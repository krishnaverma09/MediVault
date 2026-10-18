const RecordService = require("../services/RecordService");

class RecordController {
  static async getSummary(req, res) {
    try {
      const Share = require('../models/DocumentShare');
      const Appointment = require('../models/Appointment');
      const shares = await Share.find({ patientId: req.user.id, $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] }).lean();
      const consultations = await Appointment.countDocuments({ patientId: req.user.id, status: { $ne: 'Cancelled' } });
      res.json({ activeShares: shares.length, doctors: new Set(shares.map(share => String(share.doctorId))).size, consultations });
    } catch (error) { res.status(500).json({ message: error.message }); }
  }

  static async upload(req, res) {
    try {
      const record = await RecordService.uploadMedicalRecord(req.user.id, req.file);
      res.status(201).json({ message: "Upload successful", record: require("../utils/fileDelivery")(record) });
    } catch (error) {
      res.status(error.statusCode || 500).json({ message: error.message });
    }
  }

  static async getRecords(req, res) {
    try {
      const records = await RecordService.getRecords(req.user);
      res.status(200).json({ data: records });
    } catch (error) {
      res.status(error.statusCode || 500).json({ message: error.message });
    }
  }
}

module.exports = RecordController;
