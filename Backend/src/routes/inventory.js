// src/routes/inventory.js
import express from "express";
import InventoryEntry from "../models/InventoryEntry.js";
import StorageLocation from "../models/StorageLocation.js";
import Product from "../models/Product.js";
import ActivityLog from "../models/ActivityLog.js";
import QRCodeModel from "../models/QRCode.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Helper to log action
const logAction = async ({ userId, action, details }) => {
  await ActivityLog.create({
    user: userId,
    action,
    details,
    timestamp: new Date(),
  });
};

/**
 * General adjust endpoint
 * Body: { storageLocationId, productId, delta, validate: boolean }
 * delta > 0 = add, delta < 0 = remove
 * Picker is prevented from adding (only removal)
 */
router.post(
  "/adjust",
  protect,
  authorize("Admin", "InventorySpecialist", "Picker"),
  async (req, res) => {
    try {
      const { storageLocationId, productId, delta, validate } = req.body;
      if (!storageLocationId || !productId || typeof delta !== "number") {
        return res.status(400).json({ message: "storageLocationId, productId, delta required" });
      }

      // Enforce picker cannot add inventory
      if (req.user.role === "Picker" && delta > 0) {
        return res.status(403).json({ message: "Picker cannot add inventory, only remove" });
      }

      const sl = await StorageLocation.findById(storageLocationId);
      if (!sl) return res.status(404).json({ message: "Storage location not found" });

      const product = await Product.findById(productId);
      if (!product) return res.status(404).json({ message: "Product not found" });

      // Fetch or create inventory entry
      const filter = { storageLocation: storageLocationId, product: productId };
      let entry = await InventoryEntry.findOne(filter);
      if (!entry) {
        entry = new InventoryEntry({
          storageLocation: storageLocationId,
          product: productId,
          quantity: 0,
        });
      }

      // Adjust quantity
      const newQty = entry.quantity + delta;
      if (newQty < 0) {
        return res.status(400).json({ message: "Resulting quantity cannot be negative" });
      }

      if (validate) {
        entry.quantity = newQty;
        entry.lastUpdatedBy = req.user._id;
        entry.updatedAt = new Date();
        await entry.save();

        // Log action
        const verb = delta > 0 ? "Added" : "Removed";
        const absDelta = Math.abs(delta);
        const actionText = `${req.user.name} ${verb} ${product.name} x${absDelta} to/from ${sl.address}`;
        await logAction({
          userId: req.user._id,
          action: actionText,
          details: {
            storageLocation: sl._id,
            product: product._id,
            delta,
            resultingQuantity: entry.quantity,
          },
        });

        return res.json({ inventoryEntry: entry, message: "Adjustment validated and saved" });
      } else {
        // Preview without saving
        return res.json({
          preview: {
            currentQuantity: entry.quantity,
            proposedQuantity: newQty,
            delta,
          },
          message: "Adjustment preview (not validated)",
        });
      }
    } catch (err) {
      console.error("Inventory adjust error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Picker flow: scanCode + productId + quantity (removal only)
router.post(
  "/pick",
  protect,
  authorize("Admin", "InventorySpecialist", "Picker"),
  async (req, res) => {
    try {
      const { scanCode, productId, quantity } = req.body;
      if (!scanCode || !productId || typeof quantity !== "number" || quantity <= 0) {
        return res.status(400).json({ message: "scanCode, productId and positive quantity required" });
      }

      // Resolve storage location from scanCode (QR internalId or address)
      let storageLocation = null;

      const qr = await QRCodeModel.findOne({ internalId: scanCode });
      if (qr) {
        storageLocation = await StorageLocation.findById(qr.storageLocation);
      } else {
        storageLocation = await StorageLocation.findOne({ address: scanCode });
      }

      if (!storageLocation) {
        return res.status(404).json({ message: "Storage location not found for scanCode" });
      }

      const product = await Product.findById(productId);
      if (!product) return res.status(404).json({ message: "Product not found" });

      let entry = await InventoryEntry.findOne({
        storageLocation: storageLocation._id,
        product: product._id,
      });

      if (!entry || entry.quantity <= 0) {
        return res.status(400).json({ message: "No inventory available to pick from at this location" });
      }

      if (entry.quantity < quantity) {
        return res.status(400).json({ message: "Insufficient quantity to pick" });
      }

      const delta = -Math.abs(quantity); // removal

      entry.quantity = entry.quantity + delta;
      entry.lastUpdatedBy = req.user._id;
      entry.updatedAt = new Date();
      await entry.save();

      const actionText = `${req.user.name} Removed ${product.name} x${quantity} from ${storageLocation.address}`;
      await logAction({
        userId: req.user._id,
        action: actionText,
        details: {
          storageLocation: storageLocation._id,
          product: product._id,
          delta,
          resultingQuantity: entry.quantity,
        },
      });

      res.json({
        inventoryEntry: entry,
        message: "Pick validated and inventory updated",
      });
    } catch (err) {
      console.error("Picker pick error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Get inventory for a storage location (shelf detail)
router.get(
  "/by-storage-location/:id",
  protect,
  authorize("Admin", "InventorySpecialist", "Picker"),
  async (req, res) => {
    try {
      const storageLocationId = req.params.id;
      const entries = await InventoryEntry.find({ storageLocation: storageLocationId })
        .populate("product", "name sku category")
        .populate("lastUpdatedBy", "name email role")
        .sort({ updatedAt: -1 });
      res.json({ inventory: entries });
    } catch (err) {
      console.error("Get inventory error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Get activity logs (filterable)
router.get(
  "/logs",
  protect,
  authorize("Admin", "InventorySpecialist"),
  async (req, res) => {
    try {
      const { user, product, storageLocation, limit = 100 } = req.query;
      const filter = {};
      if (user) filter.user = user;
      if (product) filter["details.product"] = product;
      if (storageLocation) filter["details.storageLocation"] = storageLocation;

      const logs = await ActivityLog.find(filter)
        .populate("user", "name email role")
        .sort({ timestamp: -1 })
        .limit(Number(limit));
      res.json({ logs });
    } catch (err) {
      console.error("Fetch logs error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
