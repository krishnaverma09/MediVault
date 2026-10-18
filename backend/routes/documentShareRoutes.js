const authorize = require("../middleware/authorize");
const express = require("express");
const router = express.Router();
const DocumentShareController = require("../controllers/documentShareController");
const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// Upload and Share
router.post("/upload", protect, authorize("patient"), upload, DocumentShareController.uploadAndShare);
router.post("/upload-and-share", protect, authorize("patient"), upload, DocumentShareController.uploadAndShare);

// Share an already uploaded document
router.post("/share", protect, authorize("patient"), DocumentShareController.shareLater);

// Doctor views documents shared with them
router.get("/doctor/shared-documents", protect, authorize("doctor"), DocumentShareController.getDoctorSharedDocuments);

// Patient views their own uploaded documents
router.get("/patient/my-documents", protect, authorize("patient"), DocumentShareController.getPatientDocuments);

// Doctor views a specific shared document (Logs access)
router.get("/doctor/view/:shareId", protect, authorize("doctor"), DocumentShareController.viewSharedDocument);

// Revoke access from a doctor
router.delete("/share/:id", protect, authorize("patient"), DocumentShareController.revokeAccess);

// See access logs for a specific document
router.get("/access-logs/:documentId", protect, authorize("patient"), DocumentShareController.getAccessLogs);

router.get("/shares/:documentId", protect, authorize("patient"), DocumentShareController.getShares);

router.get("/patient/view/:documentId", protect, authorize("patient"), DocumentShareController.viewPatientDocument);

module.exports = router;
