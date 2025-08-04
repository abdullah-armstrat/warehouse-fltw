// src/routes/warehouse.js
import express from "express";
import Warehouse from "../models/Warehouse.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Create warehouse (Admin only)
router.post("/", protect, authorize("Admin"), async (req, res) => {
  try {
    const { name, address, metadata } = req.body;
    if (!name) return res.status(400).json({ message: "Name required" });

    const warehouse = new Warehouse({
      name,
      address: address || "",
      metadata: metadata || {},
    });
    await warehouse.save();
    res.status(201).json({ warehouse });
  } catch (err) {
    console.error("Create warehouse error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// List all warehouses (Admin)
router.get("/", protect, authorize("Admin"), async (req, res) => {
  try {
    const list = await Warehouse.find().sort({ createdAt: -1 });
    res.json({ warehouses: list });
  } catch (err) {
    console.error("List warehouses error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get single warehouse by ID (Admin)
router.get("/:id", protect, authorize("Admin"), async (req, res) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) return res.status(404).json({ message: "Not found" });
    res.json({ warehouse });
  } catch (err) {
    console.error("Get warehouse error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update warehouse (Admin)
router.patch("/:id", protect, authorize("Admin"), async (req, res) => {
  try {
    const updates = {};
    const { name, address, metadata } = req.body;
    if (name !== undefined) updates.name = name;
    if (address !== undefined) updates.address = address;
    if (metadata !== undefined) updates.metadata = metadata;

    const warehouse = await Warehouse.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    );
    if (!warehouse) return res.status(404).json({ message: "Not found" });
    res.json({ warehouse });
  } catch (err) {
    console.error("Update warehouse error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
