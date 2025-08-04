// src/models/InventoryEntry.js
import mongoose from "mongoose";

const inventoryEntrySchema = new mongoose.Schema({
  storageLocation: { type: mongoose.Types.ObjectId, ref: "StorageLocation", required: true },
  product: { type: mongoose.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true, default: 0 },
  lastUpdatedBy: { type: mongoose.Types.ObjectId, ref: "User" },
  updatedAt: { type: Date, default: Date.now }
});

inventoryEntrySchema.index({ storageLocation: 1, product: 1 }, { unique: true });

export default mongoose.model("InventoryEntry", inventoryEntrySchema);
