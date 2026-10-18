const DocumentShareService = require("../services/DocumentShareService");

class DocumentShareController {
  
  static async uploadAndShare(req, res) {
    try {
      const patientId = req.user.id;
      const file = req.file;
      const { title, description, documentType, doctorIds, permission, expiry } = req.body;

      // Parsing doctorIds if it comes as a JSON string from form-data
      let parsedDoctors = [];
      if (doctorIds) {
        try {
          parsedDoctors = JSON.parse(doctorIds);
        } catch (e) {
          parsedDoctors = typeof doctorIds === "string" ? [doctorIds] : doctorIds;
        }
      }

      if (!file) return res.status(400).json({ success: false, message: "File is required." });
      if (!title) return res.status(400).json({ success: false, message: "Document title is required." });

      const newDoc = await DocumentShareService.uploadAndShare({
        patientId,
        file,
        title,
        description,
        documentType,
        doctorIds: parsedDoctors,
        permission,
        expiry: expiry || 'NEVER'
      });

      res.status(201).json({
        success: true,
        message: "Document uploaded and shared successfully",
        data: newDoc
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  }

  static async shareLater(req, res) {
    try {
      const patientId = req.user.id;
      const { documentId, doctorIds, doctorEmail, permission, expiry, expiresAt } = req.body;

      if (!documentId || (!doctorEmail && (!Array.isArray(doctorIds) || !doctorIds.length))) {
        return res.status(400).json({ success: false, message: "Missing required sharing details." });
      }

      const shares = await DocumentShareService.shareDocument({
        documentId,
        patientId,
        doctorIds, doctorEmail,
        permission,
        expiry, expiresAt
      });

      res.status(200).json({
        success: true,
        message: "Document shared successfully with selected doctors",
        data: shares
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  }

  static async getDoctorSharedDocuments(req, res) {
    try {
      const doctorId = req.user.id;
      if (req.user.role !== 'doctor') {
         // Some endpoints might allow dual role if it wasn't strictly enforced initially
         // But logic dictates it's for 'doctor'
         return res.status(403).json({ success: false, message: "Unauthorized. Doctor access only." });
      }

      const sharedDocs = await DocumentShareService.getDoctorSharedDocuments(doctorId);

      res.status(200).json({
        success: true,
        data: sharedDocs
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  }

  static async viewSharedDocument(req, res) {
    try {
      const doctorId = req.user.id;
      const { shareId } = req.params;

      const documentData = await DocumentShareService.viewDocument(shareId, doctorId, req.query.download === 'true' ? 'DOWNLOAD' : 'VIEW');

      // We just return document details (URL) assuming frontend handles rendering/downloading
      res.status(200).json({
        success: true,
        data: documentData
      });
    } catch (error) {
      res.status(403).json({ success: false, message: error.message });
    }
  }

  static async revokeAccess(req, res) {
    try {
      const patientId = req.user.id;
      const { id: shareId } = req.params;

      const revoked = await DocumentShareService.revokeShare(shareId, patientId);

      if (!revoked) {
         return res.status(404).json({ success: false, message: "Link not found for revocation." });
      }

      res.status(200).json({
        success: true,
        message: "Doctor access revoked successfully."
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  }

  static async getAccessLogs(req, res) {
    try {
      const { documentId } = req.params;
      const logs = await DocumentShareService.getDocumentLogs(documentId, req.user.id);

      res.status(200).json({
        success: true,
        data: logs
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  }

  static async getShares(req, res) {
    try {
      res.json({ success: true, data: await DocumentShareService.getShares(req.params.documentId, req.user.id) });
    } catch (error) {
      res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  }

  static async getPatientDocuments(req, res) {
    try {
      const patientId = req.user.id;
      const DocumentRepository = require("../repositories/DocumentRepository");
      const docs = await DocumentRepository.getPatientDocuments(patientId);
      
      res.status(200).json({
        success: true,
        data: docs
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  }
}

module.exports = DocumentShareController;
