//Protect Complaints Route with Roles
// Complaints Routes (Protected)
// Users can create complaints
// Authorities can view complaints
// Superadmin can view everything


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

// GET complaints → user, authority, superadmin
router.get("/", authorizeRoles("user", "authority", "superadmin"), (req, res) => {
  const data = fs.readFileSync(filePath, "utf-8");
  const complaints = JSON.parse(data);
  res.json(complaints);
});
 
/**
 * GET /api/complaints/my-complaints
 * - Return complaints created by the logged-in user
 * - Role allowed: user only
 */
router.get("/my-complaints", authorizeRoles("user"), (req, res) => {
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    const complaints = JSON.parse(data);

    // Filter complaints by the logged-in user's email
    const userComplaints = complaints.filter(
      (c) => c.createdBy === req.user.email
    );

    res.json(userComplaints);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch your complaints" });
  }
  });

// POST new complaint → only users
router.post("/", authorizeRoles("user"), (req, res) => {
  const { title, description, category, district, upazila } = req.body;
  const data = fs.readFileSync(filePath, "utf-8");
  const complaints = JSON.parse(data);

  const newComplaint = {
    _id: (complaints.length + 1).toString(),
    title,
    description,
    category,
    district,
    upazila,
    status: "Pending",
    createdBy: req.user.email
  };

  complaints.push(newComplaint);
  fs.writeFileSync(filePath, JSON.stringify(complaints, null, 2));

  res.status(201).json(newComplaint);
});


// POST complaint → only users
router.post("/", authorizeRoles("user"), (req, res) => {
  const { title, description, category, district, upazila } = req.body;
  const data = fs.readFileSync(filePath, "utf-8");
  const complaints = JSON.parse(data);

  const newComplaint = {
    _id: (complaints.length + 1).toString(),
    title,
    description,
    category,
    district,
    upazila,
    status: "Pending",
    createdBy: req.user.email
  };

  complaints.push(newComplaint);
  fs.writeFileSync(filePath, JSON.stringify(complaints, null, 2));

  res.status(201).json(newComplaint);
});



export default router;



//2
// import express from "express";
// import fs from "fs";
// import path from "path";
// import { fileURLToPath } from "url";
// import { verifyToken } from "../middleware/authMiddleware.js";

// const router = express.Router();
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const filePath = path.join(__dirname, "../data/complaints.json");

// // ✅ Protect all routes with verifyToken
// router.use(verifyToken);

// router.get("/", (req, res) => {
//   const data = fs.readFileSync(filePath, "utf-8");
//   const complaints = JSON.parse(data);
//   res.json(complaints);
// });

// router.post("/", (req, res) => {
//   const { title, description, category, district, upazila } = req.body;
//   const data = fs.readFileSync(filePath, "utf-8");
//   const complaints = JSON.parse(data);

//   const newComplaint = {
//     _id: (complaints.length + 1).toString(),
//     title,
//     description,
//     category,
//     district,
//     upazila,
//     status: "Pending",
//   };

//   complaints.push(newComplaint);
//   fs.writeFileSync(filePath, JSON.stringify(complaints, null, 2));
//   res.status(201).json(newComplaint);
// });

// export default router;
//1
//  import express from "express";
// import fs from "fs";
// import path from "path";
// import { fileURLToPath } from "url"; // needed for ES Modules

// const router = express.Router();

// // Fix __dirname for ES Modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Path to your complaints.json
// const filePath = path.join(__dirname, "../data/complaints.json");

// // GET all complaints
// router.get("/", (req, res) => {
//   const data = fs.readFileSync(filePath, "utf-8");
//   const complaints = JSON.parse(data);
//   res.json(complaints);
// });

// // POST new complaint
// router.post("/", (req, res) => {
//   const { title, description, category, district, upazila } = req.body;

//   if (!title || !description || !category || !district || !upazila) {
//     return res.status(400).json({ message: "All fields are required" });
//   }

//   const data = fs.readFileSync(filePath, "utf-8");
//   const complaints = JSON.parse(data);

//   const newComplaint = {
//     _id: (complaints.length + 1).toString(),
//     title,
//     description,
//     category,
//     district,
//     upazila,
//     status: "Pending",
//   };

//   complaints.push(newComplaint);

//   fs.writeFileSync(filePath, JSON.stringify(complaints, null, 2), "utf-8");

//   res.status(201).json(newComplaint);
// });

// export default router;