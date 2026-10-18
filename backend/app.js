const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, ".env") });

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const recordRoutes = require("./routes/recordRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const documentShareRoutes = require("./routes/documentShareRoutes");
const emergencyRoutes = require("./routes/emergencyRoutes");
const publicEmergencyRoutes = require("./routes/publicEmergencyRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

const app = express();
const connectDB = require("./config/db");

// Core middleware
app.set("trust proxy", 1);
app.use(cors());
app.use(express.json());

app.use("/api", async (req, res, next) => {
  if (process.env.NODE_ENV === "test") return next();
  try {
    await connectDB();
    next();
  } catch {
    res.status(503).json({ message: "Database temporarily unavailable" });
  }
});

app.get("/", (req, res) => {
  res.send("MediVault API Running");
});

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/records", recordRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/documents", documentShareRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/public", publicEmergencyRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

module.exports = app;
