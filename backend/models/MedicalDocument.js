const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    size: { type: Number, default: 0 },
    description: {
      type: String,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    cloudinaryPublicId: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    documentType: {
      type: String,
      required: true,
    }
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: true } }
);

module.exports = mongoose.model('MedicalDocument', DocumentSchema);
