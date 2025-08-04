// src/routes/user.js
import express from "express";
import User from "../models/User.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Admin creates a user (InventorySpecialist or Picker)
router.post("/", protect, authorize("Admin"), async (req, res) => {
  try {
    const { name, email, password, role, designation, photoUrl } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "name, email, password, role required" });
    }
    if (!["Admin", "InventorySpecialist", "Picker"].includes(role)) {
      return res.status(400).json({ message: "invalid role" });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ message: "email already in use" });

    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      role,
      designation: designation || "",
      photoUrl: photoUrl || "",
    });
    await user.save();

    res.status(201).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        designation: user.designation,
        photoUrl: user.photoUrl,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({ message: "server error" });
  }
});

// List users (Admin only)
router.get("/", protect, authorize("Admin"), async (req, res) => {
  const users = await User.find().select("-password");
  res.json({ users });
});

// Get own profile
router.get("/me", protect, async (req, res) => {
  res.json({ user: req.user });
});

export default router;
