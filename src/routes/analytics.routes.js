import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { verifyToken } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(__dirname, "../data/complaints.json");

router.use(verifyToken);

// GET /api/analytics → only superadmin & authority
router.get(
  "/",
  authorizeRoles("authority", "superadmin"),
  (req, res) => {
    try {
      const data = fs.readFileSync(filePath, "utf-8");
      const complaints = JSON.parse(data);

      // Group by status
      const statusCounts = complaints.reduce((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      }, {});

      // Group by category
      const categoryCounts = complaints.reduce((acc, c) => {
        acc[c.category] = (acc[c.category] || 0) + 1;
        return acc;
      }, {});

      // Group by district
      const districtCounts = complaints.reduce((acc, c) => {
        acc[c.district] = (acc[c.district] || 0) + 1;
        return acc;
      }, {});

      res.json({
        statusCounts,
        categoryCounts,
        districtCounts,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  }
);

export default router;