 import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { verifyToken } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const usersPath = path.join(__dirname, "../data/users.json");

// GET all authorities → for dropdown
router.get("/authorities", verifyToken, authorizeRoles("superadmin"), (req, res) => {
  const users = JSON.parse(fs.readFileSync(usersPath, "utf-8"));
  const authorities = users.filter(u => u.role === "authority");
  res.json(authorities);
});

// PUT → assign districts to an authority user
router.put("/:id/assign-district", verifyToken, authorizeRoles("superadmin"), (req, res) => {
  const { id } = req.params;
  const { districts } = req.body; // array of district strings

  const users = JSON.parse(fs.readFileSync(usersPath, "utf-8"));
  const user = users.find(u => u._id === id);

  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.role !== "authority") return res.status(400).json({ message: "Not an authority user" });

  user.assignedDistricts = districts; // update assignedDistricts
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

  res.json({ message: "Districts assigned successfully", user });
});
 
// 🔹 Get assigned districts of logged-in user
router.get("/assigned-districts", verifyToken, (req, res) => {
  const usersData = JSON.parse(fs.readFileSync(usersPath, "utf-8"));
  const user = usersData.find(u => u.email === req.user.email);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json({
    assignedDistricts: user.assignedDistricts || [],
    role: user.role,
  });
});
// GET all users → only superadmin
router.get("/", verifyToken, authorizeRoles("superadmin"), (req, res) => {
  if (!fs.existsSync(usersPath)) return res.json([]);
  const data = fs.readFileSync(usersPath, "utf-8");
  const users = JSON.parse(data);
  res.json(users);
});

// ✅ Suspend / Unsuspend user (superadmin only)
router.put("/:id/suspend", verifyToken, authorizeRoles("superadmin"), (req, res) => {
  const data = fs.readFileSync(usersPath, "utf-8");
  const users = JSON.parse(data);

  const user = users.find(u => u._id === req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.suspended = !user.suspended; // toggle suspend status

  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
  res.json({ message: `User ${user.suspended ? "suspended" : "unsuspended"} successfully`, user });
});

export default router;