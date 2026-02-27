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
router.get(
  "/",
  authorizeRoles("user", "authority", "superadmin"),
  (req, res) => {
    const data = fs.readFileSync(filePath, "utf-8");
    const complaints = JSON.parse(data);
    res.json(complaints);
  },
);

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
      (c) => c.createdBy === req.user.email,
    );

    res.json(userComplaints);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch your complaints" });
  }
});

// GET complaint by ID → include notes
router.get(
  "/:id",
  verifyToken,
  authorizeRoles("user", "authority", "superadmin"),
  (req, res) => {
    const data = fs.readFileSync(filePath, "utf-8");
    const complaints = JSON.parse(data);
    const complaint = complaints.find((c) => c._id === req.params.id);
    if (!complaint)
      return res.status(404).json({ message: "Complaint not found" });
    res.json(complaint); // includes notes array
  },
);

// POST new complaint → only users
// POST /api/complaints
router.post("/", authorizeRoles("user"), (req, res) => {
  const { title, description, category, district, upazila, anonymous } =
    req.body;

  const data = fs.readFileSync(filePath, "utf-8");
  const complaints = JSON.parse(data);

  const now = new Date().toISOString();

  const newComplaint = {
    _id: (complaints.length + 1).toString(),
    title,
    description,
    category,
    district,
    upazila,
    status: "Submitted",
    statusHistory: [
      {
        status: "Submitted",
        updatedAt: now,
      },
    ],
    createdBy: anonymous ? "Anonymous" : req.user.email,
    anonymous: !!anonymous, // true or false
    createdAt: now,
  };

  complaints.push(newComplaint);
  fs.writeFileSync(filePath, JSON.stringify(complaints, null, 2));

  res.status(201).json(newComplaint);
});
//status workflow
const statusWorkflow = {
  Submitted: ["Under Review"],
  "Under Review": ["Investigation", "Rejected"],
  Investigation: ["Action Taken", "Rejected"],
  "Action Taken": ["Closed"],
  Closed: [],
  Rejected: [],
};

//UPDATE STATUS Route (Authority Only)
// PUT /api/complaints/:id/status
router.put(
  "/:id/status",
  authorizeRoles("authority", "superadmin"),
  (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const data = fs.readFileSync(filePath, "utf-8");
    const complaints = JSON.parse(data);

    const complaint = complaints.find((c) => c._id === id);

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    const currentStatus = complaint.status;
    const allowedNextStatuses = statusWorkflow[currentStatus];

    if (!allowedNextStatuses.includes(status)) {
      return res.status(400).json({
        message: `Cannot change status from ${currentStatus} to ${status}`,
      });
    }

    complaint.status = status;

    complaint.statusHistory.push({
      status,
      updatedAt: new Date().toISOString(),
    });

    fs.writeFileSync(filePath, JSON.stringify(complaints, null, 2));

    res.json({
      message: "Status updated successfully",
      complaint,
    });
  },
);

// Add note → only authority / superadmin
router.post(
  "/:id/notes",
  verifyToken,
  authorizeRoles("authority", "superadmin"),
  (req, res) => {
    const { id } = req.params;
    const { text } = req.body;

    if (!text)
      return res.status(400).json({ message: "Note text is required" });

    const data = fs.readFileSync(filePath, "utf-8");
    const complaints = JSON.parse(data);

    const complaint = complaints.find((c) => c._id === id);
    if (!complaint)
      return res.status(404).json({ message: "Complaint not found" });

    if (!complaint.notes) complaint.notes = [];

    const now = new Date().toISOString();
    complaint.notes.push({
      text,
      author: req.user.email,
      role: req.user.role,
      createdAt: now,
    });

    fs.writeFileSync(filePath, JSON.stringify(complaints, null, 2));
    res.status(201).json({ message: "Note added", notes: complaint.notes });
  },
);
export default router;
// POST complaint → only users
// router.post("/", authorizeRoles("user"), (req, res) => {
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
//     createdBy: req.user.email,
//   };

//   complaints.push(newComplaint);
//   fs.writeFileSync(filePath, JSON.stringify(complaints, null, 2));

//   res.status(201).json(newComplaint);
// });

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
