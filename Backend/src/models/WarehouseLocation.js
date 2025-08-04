import mongoose from "mongoose";

const warehouseLocationSchema = new mongoose.Schema({
  warehouse: { type: mongoose.Types.ObjectId, ref: "Warehouse", required: true },
  name: { type: String, required: true }, // e.g., zone A
  description: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("WarehouseLocation", warehouseLocationSchema);
