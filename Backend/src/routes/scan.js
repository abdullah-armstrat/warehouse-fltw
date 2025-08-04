// src/routes/scan.js
import express from "express";
import QRCodeModel from "../models/QRCode.js";
import StorageLocation from "../models/StorageLocation.js";
import InventoryEntry from "../models/InventoryEntry.js";
import Product from "../models/Product.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Resolve a scan code: could be internalId (QR) or direct storage location address
// Query param optionally ?type=address or ?type=internal (auto-detect if omitted)
router.get("/:code", protect, authorize("Admin", "InventorySpecialist", "Picker"), async (req, res) => {
  try {
    const { code } = req.params;

    // First try as QR internalId
    let qr = await QRCodeModel.findOne({ internalId: code }).populate({
      path: "storageLocation",
      select: "address warehouseLocation isActive",
    });

    let storageLocation;

    if (qr && qr.storageLocation) {
      storageLocation = qr.storageLocation;
    } else {
      // Fallback: treat code as storageLocation.address (exact match)
      storageLocation = await StorageLocation.findOne({ address: code });
    }

    if (!storageLocation) {
      return res.status(404).json({ message: "No storage location found for scan code" });
    }

    // Fetch inventory entries
    const inventory = await InventoryEntry.find({ storageLocation: storageLocation._id })
      .populate("product", "name sku category")
      .populate("lastUpdatedBy", "name role")
      .sort({ updatedAt: -1 });

    // If QR exists for this storageLocation, include them
    const qrcodes = await QRCodeModel.find({ storageLocation: storageLocation._id });

    res.json({
      storageLocation: {
        _id: storageLocation._id,
        address: storageLocation.address,
        isActive: storageLocation.isActive,
      },
      inventory,
      qrcodes,
    });
  } catch (err) {
    console.error("Scan resolve error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
