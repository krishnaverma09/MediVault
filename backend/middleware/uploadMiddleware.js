const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (req, file, done) => {
    if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      return done(Object.assign(new Error('Upload a PDF, JPEG, PNG, or WebP file'), { statusCode: 400 }));
    }
    done(null, true);
  }
});

module.exports = upload.single("file");
