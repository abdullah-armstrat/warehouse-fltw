// src/routes/productLocations.js
import express from "express";
import InventoryEntry from "../models/InventoryEntry.js";
import StorageLocation from "../models/StorageLocation.js";
import Product from "../models/Product.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Given product ID, return all storage locations where it's present (quantity > 0)
router.get("/:productId/locations", protect, authorize("Admin", "InventorySpecialist", "Picker"), async (req, res) => {
  try {
    const { productId } = req.params;
    const entries = await InventoryEntry.find({ product: productId, quantity: { $gt: 0 } })
      .populate({
        path: "storageLocation",
        select: "address warehouseLocation isActive",
      })
      .populate("product", "name sku category")
      .sort({ updatedAt: -1 });

    // Map to simplified structure
    const locations = entries.map((e) => ({
      storageLocation: e.storageLocation,
      quantity: e.quantity,
      lastUpdatedBy: e.lastUpdatedBy,
      updatedAt: e.updatedAt,
    }));

    res.json({ productLocations: locations });
  } catch (err) {
    console.error("Product locations error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
