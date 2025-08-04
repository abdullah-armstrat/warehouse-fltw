import mongoose from "mongoose";

const warehouseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String },
  metadata: { type: Object },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Warehouse", warehouseSchema);
