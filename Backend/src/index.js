import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import warehouseRoutes from "./routes/warehouse.js";
import warehouseLocationRoutes from "./routes/warehouseLocation.js";
import storageLocationRoutes from "./routes/storageLocation.js";
import productRoutes from "./routes/product.js";
import qrRoutes from "./routes/qr.js";
import inventoryRoutes from "./routes/inventory.js";
import scanRoutes from "./routes/scan.js";
import productLocationsRoutes from "./routes/productLocations.js";







const app = express();
app.use(cors());
app.use(express.json());

// debug load
console.log("MONGO_URI loaded:", process.env.MONGO_URI ? "[FOUND]" : "[MISSING]");

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error("MONGO_URI is missing in .env");
  process.exit(1);
}

mongoose.set("strictQuery", false);
mongoose
  .connect(mongoUri, {})
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// mounted routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/warehouses", warehouseRoutes);
app.use("/api/warehouse-locations", warehouseLocationRoutes);
app.use("/api/storage-locations", storageLocationRoutes);
app.use("/api/product-locations", productLocationsRoutes);
app.use("/api/products", productRoutes);
app.use("/api/qr", qrRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/scan", scanRoutes);




app.get("/", (req, res) => res.send("Fleetwood backend up"));

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server running on port ${port}`));
