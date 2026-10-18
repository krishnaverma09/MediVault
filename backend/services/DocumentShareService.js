const DocumentRepository = require("../repositories/DocumentRepository");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

class DocumentShareService {
  /**
   * Helper method to calculate explicit expiry date.
   */
  _calculateExpiry(expiryType) {
    if (!expiryType || expiryType === 'NEVER') return null;
    const now = new Date();
    switch (expiryType) {
      case '1H':
        return new Date(now.getTime() + 1 * 60 * 60 * 1000);
      case '24H':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case '7D':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      default:
        return null;
    }
  }

  /**
   * Upload Document to Cloudinary
   */
  async uploadFileToCloudinary(fileBuffer, mimetype) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: "auto", folder: "medivault_shared" },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
  }

  /**
   * Upload and Share Multiple Doctors
   */
  async uploadAndShare({ patientId, file, title, documentType, description, doctorIds, permission, expiry }) {
    if (!file) throw new Error("File is required");
    
    // Upload to Cloudinary
    const uploadResult = await this.uploadFileToCloudinary(file.buffer, file.mimetype);

    // Save to Database
    const newDocument = await DocumentRepository.createDocument({
      patientId,
      size: file.size,
      title,
      description,
      fileUrl: uploadResult.secure_url,
      cloudinaryPublicId: uploadResult.public_id,
      fileType: file.mimetype,
      documentType: documentType || 'Other',
    });

    // Apply Sharing
    if (doctorIds && doctorIds.length > 0) {
      await this.shareDocument({
        documentId: newDocument._id,
        patientId,
        doctorIds,
        permission,
        expiry
      });
    }

    return newDocument;
  }

  /**
   * Share an existing document manually with selected doctors
   */
  async ownedDocument(documentId, patientId) {
    const mongoose = require('mongoose');
    if (!mongoose.isValidObjectId(documentId)) throw Object.assign(new Error('Invalid document ID'), { statusCode: 400 });
    let document = await DocumentRepository.getDocumentById(documentId);
    if (!document) {
      const legacy = await require('../models/MedicalRecord').findOne({ _id: documentId, user: patientId });
      if (legacy) document = await DocumentRepository.createDocument({
        _id: legacy._id, patientId, title: legacy.originalName, fileUrl: legacy.fileUrl,
        cloudinaryPublicId: legacy.publicId, fileType: 'application/pdf', documentType: 'Report', size: legacy.size,
      });
    }
    if (!document || String(document.patientId._id || document.patientId) !== String(patientId)) {
      throw Object.assign(new Error('Document not found'), { statusCode: 404 });
    }
    return document;
  }

  async shareDocument({ documentId, patientId, doctorIds, doctorEmail, permission = 'VIEW', expiry = 'NEVER', expiresAt: customExpiry }) {
    await this.ownedDocument(documentId, patientId);
    const User = require('../models/User');
    if (doctorEmail) {
      const doctor = await User.findOne({ email: doctorEmail.trim().toLowerCase(), role: 'doctor' });
      if (!doctor) throw Object.assign(new Error('No doctor account found with that email'), { statusCode: 400 });
      doctorIds = [String(doctor._id)];
    }
    if (!Array.isArray(doctorIds) || !doctorIds.length || !['VIEW', 'DOWNLOAD', 'FULL_ACCESS'].includes(permission) || !['NEVER', '1H', '24H', '7D'].includes(expiry)) {
      throw Object.assign(new Error('Invalid sharing details'), { statusCode: 400 });
    }
    doctorIds = [...new Set(doctorIds.map(String))];
    const doctors = await User.find({ _id: { $in: doctorIds }, role: 'doctor' });
    if (doctors.length !== doctorIds.length) throw Object.assign(new Error('Select valid doctor accounts'), { statusCode: 400 });
    const expiresAt = customExpiry ? new Date(customExpiry) : this._calculateExpiry(expiry);
    if (expiresAt && (!Number.isFinite(expiresAt.getTime()) || expiresAt <= new Date())) {
      throw Object.assign(new Error('Expiry must be in the future'), { statusCode: 400 });
    }
    const Share = require('../models/DocumentShare');
    const shares = [];
    for (const doctorId of doctorIds) {
      const share = await Share.findOneAndUpdate({ documentId, patientId, doctorId },
        { permission, expiry, expiresAt }, { upsert: true, new: true, runValidators: true });
      await DocumentRepository.logAccess({ documentId, doctorId, action: 'SHARE' });
      shares.push(share);
    }
    return shares;
  }

  async getShares(documentId, patientId) {
    await this.ownedDocument(documentId, patientId);
    return require('../models/DocumentShare').find({ documentId, patientId,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] }).populate('doctorId', 'name email');
  }

  /**
   * Fetch documents a doctor has been granted access to
   */
  async getDoctorSharedDocuments(doctorId) {
    const validShares = await DocumentRepository.getSharedWithDoctor(doctorId);
    
    // Map them for nicer frontend formatting
    return validShares.filter(share => share.documentId).map(share => ({
      shareId: share._id,
      document: require('../utils/fileDelivery')(share.documentId),
      patient: share.patientId,
      permission: share.permission,
      expiresAt: share.expiresAt,
      sharedAt: share.createdAt
    }));
  }

  /**
   * Access a document securely - validates dates and logs the event
   */
  async viewDocument(shareId, doctorId, action = 'VIEW') {
    const shares = await DocumentRepository.getSharedWithDoctor(doctorId);
    const accessGrant = shares.find(s => s._id.toString() === shareId);
    
    if (!accessGrant || !accessGrant.documentId) {
      throw new Error("Access expired or denied");
    }

    if (action === 'DOWNLOAD' && !['DOWNLOAD', 'FULL_ACCESS'].includes(accessGrant.permission)) {
      throw new Error('Download permission required');
    }
    // Log the event
    await DocumentRepository.logAccess({
      documentId: accessGrant.documentId._id,
      doctorId,
      action
    });

    return accessGrant.documentId; // Return document info
  }

  /**
   * Revokes the access granted to a doctor.
   */
  async revokeShare(shareId, patientId) {
    const revoked = await DocumentRepository.revokeShare(shareId, patientId);
    if (!revoked) throw new Error("Share link not found or already removed");
    
    // Log revocation
    if (revoked) {
        await DocumentRepository.logAccess({
            documentId: revoked.documentId,
            doctorId: revoked.doctorId,
            action: 'REVOKE'
        });
    }

    return revoked;
  }

  /**
   * Get Access Logs for Patient
   */
  async getDocumentLogs(documentId, patientId) {
    await this.ownedDocument(documentId, patientId);
    return await DocumentRepository.getAccessLogs(documentId);
  }
}

module.exports = new DocumentShareService();
