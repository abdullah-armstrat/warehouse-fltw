// src/routes/warehouseLocation.js
import express from "express";
import WarehouseLocation from "../models/WarehouseLocation.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Create a warehouse location (Admin or InventorySpecialist)
router.post("/", protect, authorize("Admin", "InventorySpecialist"), async (req, res) => {
  try {
    const { warehouse, name, description } = req.body;
    if (!warehouse || !name) return res.status(400).json({ message: "warehouse and name required" });

    const wl = new WarehouseLocation({
      warehouse,
      name,
      description: description || "",
    });
    await wl.save();
    res.status(201).json({ warehouseLocation: wl });
  } catch (err) {
    console.error("Create warehouse location error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// List locations for a given warehouse via query param ?warehouse=<id>
router.get("/", protect, authorize("Admin", "InventorySpecialist"), async (req, res) => {
  try {
    const { warehouse } = req.query;
    if (!warehouse) return res.status(400).json({ message: "warehouse query required" });
    const list = await WarehouseLocation.find({ warehouse }).sort({ createdAt: -1 });
    res.json({ warehouseLocations: list });
  } catch (err) {
    console.error("List warehouse locations error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get single by ID
router.get("/:id", protect, authorize("Admin", "InventorySpecialist"), async (req, res) => {
  try {
    const wl = await WarehouseLocation.findById(req.params.id);
    if (!wl) return res.status(404).json({ message: "Not found" });
    res.json({ warehouseLocation: wl });
  } catch (err) {
    console.error("Get warehouse location error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update
router.patch("/:id", protect, authorize("Admin", "InventorySpecialist"), async (req, res) => {
  try {
    const updates = {};
    const { name, description } = req.body;
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;

    const wl = await WarehouseLocation.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true });
    if (!wl) return res.status(404).json({ message: "Not found" });
    res.json({ warehouseLocation: wl });
  } catch (err) {
    console.error("Update warehouse location error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete (Admin only)
router.delete("/:id", protect, authorize("Admin"), async (req, res) => {
  try {
    const wl = await WarehouseLocation.findByIdAndDelete(req.params.id);
    if (!wl) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("Delete warehouse location error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
