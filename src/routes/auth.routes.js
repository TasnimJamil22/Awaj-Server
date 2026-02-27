//Auth Routes (Register + Login + Role)
 import express from "express";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const usersFile = path.join(__dirname, "../data/users.json");
const JWT_SECRET = "your_secret_key";

// ---------------------
// REGISTER (default user)
// ---------------------
router.post("/register", (req, res) => {
  const { email, password, fullName, phone, district, upazila } = req.body;

  if (!email || !password || !fullName) {
    return res.status(400).json({ message: "Email, password, full name are required" });
  }

  let users = fs.existsSync(usersFile) ? JSON.parse(fs.readFileSync(usersFile, "utf-8")) : [];

  const userExists = users.find(u => u.email === email);
  if (userExists) return res.status(400).json({ message: "Email already registered" });

  const hashedPassword = bcrypt.hashSync(password, 10);

  // default role = user
  const newUser = {
    email,
    password: hashedPassword,
    fullName,
    phone: phone || "",
    district: district || "",
    upazila: upazila || "",
    role: "user"
  };

  users.push(newUser);
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

  const token = jwt.sign({ email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: "1h" });

  res.status(201).json({ token, email: newUser.email, fullName: newUser.fullName, role: newUser.role });
});

// ---------------------
// LOGIN
// ---------------------
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password required" });

  const users = fs.existsSync(usersFile) ? JSON.parse(fs.readFileSync(usersFile, "utf-8")) : [];

  const user = users.find(u => u.email === email);
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const isMatch = bcrypt.compareSync(password, user.password);
  if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign({ email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "1h" });

  res.json({ token, email: user.email, fullName: user.fullName, role: user.role });
});

export default router;

//without roles
//  import express from "express";
// import fs from "fs";
// import path from "path";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import { fileURLToPath } from "url";

// const router = express.Router();
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const usersFile = path.join(__dirname, "../data/users.json");
// const JWT_SECRET = "your_secret_key"; // In production, use process.env.JWT_SECRET

// // ========================
// // REGISTER ROUTE
// // ========================
// router.post("/register", (req, res) => {
//   const { email, password, fullName, phone, district, upazila } = req.body;

//   if (!email || !password || !fullName) {
//     return res.status(400).json({ message: "Email, password, and full name are required" });
//   }

//   // Read existing users
//   let users = [];
//   if (fs.existsSync(usersFile)) {
//     users = JSON.parse(fs.readFileSync(usersFile, "utf-8"));
//   }

//   // Check if email already exists
//   const userExists = users.find(u => u.email === email);
//   if (userExists) {
//     return res.status(400).json({ message: "Email already registered" });
//   }

//   // Hash the password
//   const hashedPassword = bcrypt.hashSync(password, 10);

//   // Create new user object
//   const newUser = {
//     email,
//     password: hashedPassword,
//     fullName,
//     phone: phone || "",
//     district: district || "",
//     upazila: upazila || ""
//   };

//   // Save user
//   users.push(newUser);
//   fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

//   // Create JWT token
//   const token = jwt.sign({ email: newUser.email }, JWT_SECRET, { expiresIn: "1h" });

//   res.status(201).json({ token, email: newUser.email, fullName: newUser.fullName });
// });

// // ========================
// // LOGIN ROUTE
// // ========================
// router.post("/login", (req, res) => {
//   const { email, password } = req.body;
//   if (!email || !password) return res.status(400).json({ message: "Email and password required" });

//   // Read users
//   const users = fs.existsSync(usersFile)
//     ? JSON.parse(fs.readFileSync(usersFile, "utf-8"))
//     : [];

//   const user = users.find(u => u.email === email);
//   if (!user) return res.status(401).json({ message: "Invalid credentials" });

//   // Compare password
//   const isMatch = bcrypt.compareSync(password, user.password);
//   if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

//   // Create JWT token
//   const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: "1h" });

//   res.json({ token, email: user.email, fullName: user.fullName });
// });

// export default router;