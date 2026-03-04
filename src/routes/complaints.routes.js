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
// Users JSON
const usersPath = path.join(__dirname, "../data/users.json");
import upload from "../middleware/uploadMiddleware.js";

router.use(verifyToken);


// GET complaints → user, authority, superadmin
router.get(
  "/",
  verifyToken,
  authorizeRoles("user", "authority", "superadmin"),
  (req, res) => {
    const complaintsData = fs.readFileSync(filePath, "utf-8");
    const complaints = JSON.parse(complaintsData);

    if (req.user.role === "authority") {
      const usersData = fs.readFileSync(usersPath, "utf-8");
      const users = JSON.parse(usersData);

      const authority = users.find(u => u.email === req.user.email);

      const filtered = complaints.filter(c =>
        authority.assignedDistricts?.includes(c.district)
      );

      return res.json(filtered);
    }

    if (req.user.role === "user") {
      const filtered = complaints.filter(
        c => c.createdBy === req.user.email
      );
      return res.json(filtered);
    }

    // superadmin sees all
    res.json(complaints);
  }
);
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

    // ✅ show BOTH normal + anonymous complaints
    const userComplaints = complaints.filter(
      (c) => c.ownerEmail === req.user.email
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
router.post(
  "/",
  verifyToken,
  authorizeRoles("user"),
  upload.single("evidence"),
  (req, res) => {
    const {
      title,
      description,
      category,
      district,
      upazila,
      anonymous,
    } = req.body;

    const data = fs.readFileSync(filePath, "utf-8");
    const complaints = JSON.parse(data);

    // ✅ formData sends string
    const isAnonymous =
      anonymous === true ||
      anonymous === "true" ||
      anonymous === "on";
    const newComplaint = {
      _id: (complaints.length + 1).toString(),
      title,
      description,
      category,
      district,
      upazila,
      status: "Submitted",
      statusHistory: [{ status: "Submitted", updatedAt: new Date().toISOString() }],
      createdBy: isAnonymous ? "Anonymous" : req.user.email,
      ownerEmail: req.user.email,
      anonymous: isAnonymous,
      evidence: req.file ? `/uploads/${req.file.filename}` : null,
      createdAt: new Date().toISOString(),
    };

    // const newComplaint = {
    //   _id: (complaints.length + 1).toString(),
    //   title,
    //   description,
    //   category,
    //   district,
    //   upazila,

    //   status: "Submitted",

    //   // visible identity
    //   createdBy: isAnonymous ? "Anonymous" : req.user.email,

    //   // 🔥 ALWAYS save real owner
    //   ownerEmail: req.user.email,

    //   anonymous: isAnonymous,

    //   evidence: req.file ? `/uploads/${req.file.filename}` : null,

    //   createdAt: new Date().toISOString(),
    // };

    complaints.push(newComplaint);

    fs.writeFileSync(filePath, JSON.stringify(complaints, null, 2));

    res.status(201).json(newComplaint);
  }
);

// // POST complaint with cloud upload → only users
//   router.post("/", verifyToken, upload.single("evidence"), (req, res) => {
//   const { title, description, category, district, upazila } = req.body;

//   const data = fs.readFileSync(filePath, "utf-8");
//   const complaints = JSON.parse(data);

//   // ✅ Force default to false
//   const isAnonymous = req.body.anonymous === "true" ? true : false;

//   const newComplaint = {
//     _id: (complaints.length + 1).toString(),
//     title,
//     description,
//     category,
//     district,
//     upazila,
//     status: "Submitted",

//     // ✅ Default user
//     createdBy: isAnonymous ? "Anonymous" : req.user.email,
//     anonymous: isAnonymous,

//     evidence: req.file ? `/uploads/${req.file.filename}` : null,
//     createdAt: new Date().toISOString(),
//   };

//   complaints.push(newComplaint);
//   fs.writeFileSync(filePath, JSON.stringify(complaints, null, 2));

//   res.status(201).json(newComplaint);
// });

// router.post(
//   "/",
//   authorizeRoles("user"),
//   upload.single("evidence"), // input field: evidence
//   async (req, res) => {
//     const { title, description, category, district, upazila, anonymous } = req.body;

//     const data = fs.readFileSync(filePath, "utf-8");
//     const complaints = JSON.parse(data);

//     let evidenceUrl = null;
//     if (req.file) {
//       try {
//         const uploaded = await cloudinary.uploader.upload_stream(
//           {
//             resource_type: "auto", // images, videos, pdf
//             folder: "complaints",
//           },
//           (error, result) => {
//             if (error) throw error;
//             evidenceUrl = result.secure_url;
//           }
//         );
//         uploaded.end(req.file.buffer);
//         // Wait for upload to finish
//         await new Promise(resolve => uploaded.on("finish", resolve));
//       } catch (err) {
//         return res.status(500).json({ message: "Cloud upload failed", error: err.message });
//       }
//     }

//     const now = new Date().toISOString();

//     const newComplaint = {
//       _id: (complaints.length + 1).toString(),
//       title,
//       description,
//       category,
//       district,
//       upazila,
//       status: "Submitted",
//       statusHistory: [{ status: "Submitted", updatedAt: now }],
//       createdBy: anonymous ? "Anonymous" : req.user.email,
//       anonymous: !!anonymous,
//       evidence: evidenceUrl,
//       notes: [],
//       createdAt: now,
//     };

//     complaints.push(newComplaint);
//     fs.writeFileSync(filePath, JSON.stringify(complaints, null, 2));
//     res.status(201).json(newComplaint);
//   }
// );
// router.post(
//   "/",
//   verifyToken,
//   authorizeRoles("user"),
//   upload.single("evidence"), // 👈 important
//   (req, res) => {
//     const { title, description, category, district, upazila, anonymous } =
//       req.body;

//     const data = fs.readFileSync(filePath, "utf-8");
//     const complaints = JSON.parse(data);

//     const now = new Date().toISOString();

//     const evidencePath = req.file ? `/uploads/${req.file.filename}` : null;

//     const isAnonymous = anonymous === "true";

//     const newComplaint = {
//       _id: (complaints.length + 1).toString(),
//       title,
//       description,
//       category,
//       district,
//       upazila,
//       status: "Submitted",
//       statusHistory: [
//         {
//           status: "Submitted",
//           updatedAt: now,
//         },
//       ],
//       createdBy: isAnonymous ? "Anonymous" : req.user.email,
//       anonymous: isAnonymous,
//       evidence: evidencePath,
//       notes: [],
//       createdAt: now,
//     };

//     complaints.push(newComplaint);
//     fs.writeFileSync(filePath, JSON.stringify(complaints, null, 2));

//     res.status(201).json(newComplaint);
//   }
// );
// router.post("/", authorizeRoles("user"), (req, res) => {
//   const { title, description, category, district, upazila, anonymous } =
//     req.body;

//   const data = fs.readFileSync(filePath, "utf-8");
//   const complaints = JSON.parse(data);

//   const now = new Date().toISOString();

//   const newComplaint = {
//     _id: (complaints.length + 1).toString(),
//     title,
//     description,
//     category,
//     district,
//     upazila,
//     status: "Submitted",
//     statusHistory: [
//       {
//         status: "Submitted",
//         updatedAt: now,
//       },
//     ],
//     createdBy: anonymous ? "Anonymous" : req.user.email,
//     anonymous: !!anonymous, // true or false
//     createdAt: now,
//   };

//   complaints.push(newComplaint);
//   fs.writeFileSync(filePath, JSON.stringify(complaints, null, 2));

//   res.status(201).json(newComplaint);
// });
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
    const allowedNextStatuses = statusWorkflow[currentStatus] || [];

    if (!allowedNextStatuses.includes(status)) {
      return res.status(400).json({
        message: `Cannot change status from ${currentStatus} to ${status}`,
      });
    }

    // ✅ Ensure statusHistory exists
    if (!complaint.statusHistory) complaint.statusHistory = [];

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
  }
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
//authority complaints
 router.get("/authority-complaints", verifyToken, (req, res) => {
  const userDistrict = req.user.district; // coming from JWT
  const complaints = fs.existsSync(complaintsFile)
    ? JSON.parse(fs.readFileSync(complaintsFile, "utf-8"))
    : [];

  const filtered = complaints.filter(c => c.district === userDistrict);
  res.json(filtered);
});
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
