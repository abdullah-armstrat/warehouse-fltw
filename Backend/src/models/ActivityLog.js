// src/models/ActivityLog.js
import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema({
  user: { type: mongoose.Types.ObjectId, ref: "User", required: true },
  action: { type: String, required: true }, // formatted sentence
  details: Object,
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model("ActivityLog", activityLogSchema);
