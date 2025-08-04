// src/routes/qr.js
import express from "express";
import { v4 as uuidv4 } from "uuid";
import QRCodeModel from "../models/QRCode.js";
import StorageLocation from "../models/StorageLocation.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Create QR code for a storage location
router.post("/", protect, authorize("Admin", "InventorySpecialist"), async (req, res) => {
  try {
    const { storageLocationId } = req.body;
    if (!storageLocationId) return res.status(400).json({ message: "storageLocationId required" });

    const sl = await StorageLocation.findById(storageLocationId);
    if (!sl) return res.status(404).json({ message: "Storage location not found" });

    // labelAddress is the storage location address (e.g., "A-1-1")
    const labelAddress = sl.address;

    // generate unique internalId
    const internalId = uuidv4();

    const qr = new QRCodeModel({
      storageLocation: sl._id,
      internalId,
      labelAddress,
      isActive: true,
    });
    await qr.save();
    res.status(201).json({ qr });
  } catch (err) {
    console.error("Create QR error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// List all QR codes (with optional filters: storageLocation, isActive)
router.get("/", protect, authorize("Admin", "InventorySpecialist"), async (req, res) => {
  try {
    const { storageLocation, isActive } = req.query;
    const filter = {};
    if (storageLocation) filter.storageLocation = storageLocation;
    if (isActive !== undefined) filter.isActive = isActive === "true";
    const list = await QRCodeModel.find(filter)
      .populate({
        path: "storageLocation",
        select: "address warehouseLocation",
      })
      .sort({ createdAt: -1 });
    res.json({ qrcodes: list });
  } catch (err) {
    console.error("List QR error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get single QR by ID
router.get("/:id", protect, authorize("Admin", "InventorySpecialist"), async (req, res) => {
  try {
    const qr = await QRCodeModel.findById(req.params.id).populate({
      path: "storageLocation",
      select: "address warehouseLocation",
    });
    if (!qr) return res.status(404).json({ message: "Not found" });
    res.json({ qr });
  } catch (err) {
    console.error("Get QR error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update (toggle isActive)
router.patch("/:id", protect, authorize("Admin", "InventorySpecialist"), async (req, res) => {
  try {
    const { isActive } = req.body;
    const updates = {};
    if (isActive !== undefined) updates.isActive = isActive;

    const qr = await QRCodeModel.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true });
    if (!qr) return res.status(404).json({ message: "Not found" });
    res.json({ qr });
  } catch (err) {
    console.error("Update QR error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete QR
router.delete("/:id", protect, authorize("Admin"), async (req, res) => {
  try {
    const qr = await QRCodeModel.findByIdAndDelete(req.params.id);
    if (!qr) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("Delete QR error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Label data endpoint for frontend to render printable label
router.get("/:id/label", protect, authorize("Admin", "InventorySpecialist"), async (req, res) => {
  try {
    const qr = await QRCodeModel.findById(req.params.id).populate({
      path: "storageLocation",
      select: "address",
    });
    if (!qr) return res.status(404).json({ message: "Not found" });

    // Provide data needed for rendering including internalId (could be encoded in QR), labelAddress, and checkbox placeholder
    res.json({
      label: {
        internalId: qr.internalId,
        address: qr.labelAddress,
        isActive: qr.isActive,
        createdAt: qr.createdAt,
        checkboxLabel: "Is Active?",
        // Frontend can generate QR code graphic from internalId or a URL like /scan?code=<internalId>
        scanPayload: qr.internalId,
      },
    });
  } catch (err) {
    console.error("Label data error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
