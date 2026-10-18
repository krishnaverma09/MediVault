const authorize = require("../middleware/authorize");
const express = require("express");
const protect = require("../middleware/authMiddleware");
const uploadSingle = require("../middleware/uploadMiddleware");
const RecordController = require("../controllers/recordController");

const router = express.Router();

router.post("/upload", protect, authorize("patient"), uploadSingle, RecordController.upload);
router.get("/summary", protect, authorize("patient"), RecordController.getSummary);
router.get("/", protect, RecordController.getRecords);

module.exports = router;
