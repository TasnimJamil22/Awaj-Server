 import express from "express";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "url";
import { verifyToken } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const usersFile = path.join(__dirname, "../data/users.json");

// All admin routes need JWT
router.use(verifyToken);

// ---------------------
// CREATE AUTHORITY (superadmin only)
// ---------------------
router.post("/create-authority", authorizeRoles("superadmin"), (req, res) => {
  const { email, password, fullName, phone, district, upazila } = req.body;

  if (!email || !password || !fullName) {
    return res.status(400).json({ message: "Email, password, full name are required" });
  }

  let users = fs.existsSync(usersFile) ? JSON.parse(fs.readFileSync(usersFile, "utf-8")) : [];

  const userExists = users.find(u => u.email === email);
  if (userExists) return res.status(400).json({ message: "Email already registered" });

  const hashedPassword = bcrypt.hashSync(password, 10);

  const newUser = {
    email,
    password: hashedPassword,
    fullName,
    phone: phone || "",
    district: district || "",
    upazila: upazila || "",
    role: "authority"
  };

  users.push(newUser);
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

  res.status(201).json({ message: "Authority user created successfully", email: newUser.email, role: newUser.role });
});

export default router;