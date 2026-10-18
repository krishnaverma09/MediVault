const cloudinary = require('../config/cloudinary');

// Cloudinary can block public PDF delivery even when upload succeeds.
// Its signed download API serves the original PDF without changing account settings.
function fileDelivery(document) {
  const file = document.toObject ? document.toObject() : { ...document };
  const isPdf = file.fileType === 'application/pdf' || /\.pdf$/i.test(file.originalName || file.fileName || file.fileUrl || '');
  const publicId = file.cloudinaryPublicId || file.publicId;
  if (isPdf && publicId && file.fileUrl?.startsWith('https://res.cloudinary.com/')) {
    file.fileUrl = cloudinary.utils.private_download_url(publicId, 'pdf', {
      resource_type: 'image', type: 'upload', attachment: false,
      expires_at: Math.floor(Date.now() / 1000) + 300,
    });
  }
  return file;
}

module.exports = fileDelivery;
