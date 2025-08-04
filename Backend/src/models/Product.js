import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  sku: { type: String, required: true, unique: true, index: true },
  category: { type: String, enum: ["CON", "HAN", "ACC", "GAM"], required: true },
  metadata: Object,
  createdAt: { type: Date, default: Date.now }
});

// For text search fallback
productSchema.index({ name: "text", sku: "text" });

export default mongoose.model("Product", productSchema);
