// src/routes/storageLocation.js
import express from "express";
import StorageLocation from "../models/StorageLocation.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Create a storage location under a warehouse location (Admin or InventorySpecialist)
router.post("/", protect, authorize("Admin", "InventorySpecialist"), async (req, res) => {
  try {
    const { warehouseLocation, address, isActive } = req.body;
    if (!warehouseLocation || !address) {
      return res.status(400).json({ message: "warehouseLocation and address required" });
    }

    const existing = await StorageLocation.findOne({ warehouseLocation, address });
    if (existing) {
      return res.status(400).json({ message: "Storage location already exists for that address" });
    }

    const sl = new StorageLocation({
      warehouseLocation,
      address,
      isActive: isActive === undefined ? true : isActive,
    });
    await sl.save();
    res.status(201).json({ storageLocation: sl });
  } catch (err) {
    console.error("Create storage location error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// List storage locations under a warehouse location (query ?warehouseLocation=...)
router.get("/", protect, authorize("Admin", "InventorySpecialist"), async (req, res) => {
  try {
    const { warehouseLocation } = req.query;
    if (!warehouseLocation) return res.status(400).json({ message: "warehouseLocation query required" });
    const list = await StorageLocation.find({ warehouseLocation }).sort({ createdAt: -1 });
    res.json({ storageLocations: list });
  } catch (err) {
    console.error("List storage locations error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get by ID
router.get("/:id", protect, authorize("Admin", "InventorySpecialist"), async (req, res) => {
  try {
    const sl = await StorageLocation.findById(req.params.id);
    if (!sl) return res.status(404).json({ message: "Not found" });
    res.json({ storageLocation: sl });
  } catch (err) {
    console.error("Get storage location error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update (e.g., address or isActive)
router.patch("/:id", protect, authorize("Admin", "InventorySpecialist"), async (req, res) => {
  try {
    const updates = {};
    const { address, isActive } = req.body;
    if (address !== undefined) updates.address = address;
    if (isActive !== undefined) updates.isActive = isActive;

    const sl = await StorageLocation.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true });
    if (!sl) return res.status(404).json({ message: "Not found" });
    res.json({ storageLocation: sl });
  } catch (err) {
    console.error("Update storage location error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete
router.delete("/:id", protect, authorize("Admin"), async (req, res) => {
  try {
    const sl = await StorageLocation.findByIdAndDelete(req.params.id);
    if (!sl) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("Delete storage location error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
