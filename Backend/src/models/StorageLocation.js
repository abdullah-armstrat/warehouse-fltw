import mongoose from "mongoose";

const storageLocationSchema = new mongoose.Schema({
  warehouseLocation: { type: mongoose.Types.ObjectId, ref: "WarehouseLocation", required: true },
  address: { type: String, required: true }, // e.g., ROW-BAY-LEVEL like B-2-2
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("StorageLocation", storageLocationSchema);
