const MedicalRecordRepository = require("../repositories/MedicalRecordRepository");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

class RecordService {
  static async uploadMedicalRecord(userId, file) {

    if (!file) {
      const error = new Error("No file uploaded");
      error.statusCode = 400;
      throw error;
    }

    return new Promise((resolve, reject) => {

      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "medivault",
          resource_type: "auto"
        },
        async (error, result) => {

          if (error) {
            console.error("Cloudinary Error:", error);
            return reject(new Error("Failed to upload to cloudinary"));
          }

          try {

            const record = await MedicalRecordRepository.create({
              user: userId,
              fileName: file.originalname,
              originalName: file.originalname,
              fileUrl: result.secure_url,
              publicId: result.public_id,
              size: file.size
            });

            resolve({
              _id: record._id,
              fileName: record.fileName,
              fileUrl: record.fileUrl,
              createdAt: record.createdAt
            });

          } catch (dbError) {
            console.error("Database Error:", dbError);
            reject(new Error("Failed to save to database"));
          }

        }
      );

      streamifier.createReadStream(file.buffer).pipe(stream);

    });

  }

  static async getRecords(user) {
    const DocumentRepository = require('../repositories/DocumentRepository');
    const toRecord = (doc, patient) => ({
      _id: doc._id, originalName: doc.title, fileName: doc.title,
      fileUrl: doc.fileUrl, size: doc.size || 0, createdAt: doc.createdAt,
      user: patient, fileType: doc.fileType,
    });
    if (user.role === 'doctor') {
      const shares = await DocumentRepository.getSharedWithDoctor(user.id);
      const unique = new Map();
      for (const share of shares) if (share.documentId) {
        unique.set(String(share.documentId._id), { ...toRecord(share.documentId, share.patientId), shareId: share._id });
      }
      return [...unique.values()];
    }
    const [records, documents] = await Promise.all([
      MedicalRecordRepository.findByUserId(user.id), DocumentRepository.getPatientDocuments(user.id),
    ]);
    const documentIds = new Set(documents.map(doc => String(doc._id)));
    return [...records.filter(record => !documentIds.has(String(record._id))), ...documents.map(doc => toRecord(doc))]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
}

module.exports = RecordService;
