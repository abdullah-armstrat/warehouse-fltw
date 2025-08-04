// src/routes/product.js
import express from "express";
import csvParser from "csv-parser";
import fs from "fs";
import multer from "multer";
import Product from "../models/Product.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// setup multer to a temp folder
const upload = multer({
  dest: "tmp/",
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(csv)$/i)) {
      return cb(new Error("Only CSV files are allowed"));
    }
    cb(null, true);
  },
});

// Upload and import CSV
router.post(
  "/import",
  protect,
  authorize("Admin", "InventorySpecialist"),
  upload.single("file"),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "CSV file required under form field `file`" });

    const results = [];
    const filepath = req.file.path;
    const errors = [];
    let rowIndex = 0;

    const stream = fs
      .createReadStream(filepath)
      .pipe(csvParser({ skipLines: 0, mapHeaders: ({ header }) => header.trim().toLowerCase() }));

    stream.on("data", (row) => {
      stream.pause();
      rowIndex++;
      const name = (row.name || "").trim();
      const sku = (row.sku || "").trim();
      const category = (row.category || "").trim().toUpperCase();

      if (!name || !sku || !["CON", "HAN", "ACC", "GAM"].includes(category)) {
        errors.push({ row: rowIndex, reason: "Invalid or missing fields", data: row });
        stream.resume();
        return;
      }

      results.push({ name, sku, category });
      stream.resume();
    });

    stream.on("end", async () => {
      try {
        const CHUNK = 1000;
        for (let i = 0; i < results.length; i += CHUNK) {
          const chunk = results.slice(i, i + CHUNK);
          const ops = chunk.map((p) => ({
            updateOne: {
              filter: { sku: p.sku },
              update: {
                $set: {
                  name: p.name,
                  category: p.category,
                  updatedAt: new Date(),
                },
              },
              upsert: true,
            },
          }));
          await Product.bulkWrite(ops);
        }

        fs.unlink(filepath, () => {});
        res.json({
          imported: results.length,
          errors,
        });
      } catch (err) {
        console.error("CSV import error:", err);
        fs.unlink(filepath, () => {});
        res.status(500).json({ message: "Import failed", error: err.message });
      }
    });

    stream.on("error", (err) => {
      console.error("CSV parse error:", err);
      fs.unlink(filepath, () => {});
      res.status(500).json({ message: "CSV parse failed", error: err.message });
    });
  }
);

// Search endpoint with text score when q is present
router.get("/search", protect, authorize("Admin", "InventorySpecialist", "Picker"), async (req, res) => {
  try {
    const { q = "", category, limit = 50 } = req.query;

    const filter = {};
    if (category) filter.category = category.toUpperCase();

    let products;
    if (q) {
      // Use MongoDB text search for relevance
      filter.$text = { $search: q };
      // Projection to include text score
      products = await Product.find(filter, { score: { $meta: "textScore" } })
        .sort({ score: { $meta: "textScore" } })
        .limit(Number(limit));
    } else {
      // No text query; fallback to simple filtering (e.g., by category)
      products = await Product.find(filter).limit(Number(limit));
    }

    res.json({ products });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ message: "Search failed" });
  }
});

export default router;
