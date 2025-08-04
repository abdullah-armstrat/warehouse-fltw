// src/models/QRCode.js
import mongoose from "mongoose";

const qrSchema = new mongoose.Schema({
  storageLocation: { type: mongoose.Types.ObjectId, ref: "StorageLocation", required: true },
  internalId: { type: String, required: true, unique: true }, // UUID
  labelAddress: { type: String, required: true }, // typically same as storageLocation.address
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("QRCode", qrSchema);
