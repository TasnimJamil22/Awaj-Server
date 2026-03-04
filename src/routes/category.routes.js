import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { verifyToken } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(__dirname, "../data/categories.json");

// ------------------------------------
// GET all categories — PUBLIC
// ------------------------------------
router.get("/", (req, res) => {
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    const categories = JSON.parse(data);
    res.json(categories);
  } catch (error) {
    console.error("Error reading categories:", error);
    res.status(500).json({ message: "Failed to load categories" });
  }
});

// ------------------------------------
// POST new category — SUPERADMIN ONLY
// ------------------------------------
router.post("/", verifyToken, authorizeRoles("superadmin"), (req, res) => {
  const { name, description } = req.body;
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    const categories = JSON.parse(data);

    const newCategory = {
      _id: (categories.length + 1).toString(),
      name,
      description,
    };

    categories.push(newCategory);
    fs.writeFileSync(filePath, JSON.stringify(categories, null, 2));

    res.status(201).json(newCategory);
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ message: "Failed to create category" });
  }
});

// ------------------------------------
// PUT update category — SUPERADMIN ONLY
// ------------------------------------
router.put("/:id", verifyToken, authorizeRoles("superadmin"), (req, res) => {
  const { name, description } = req.body;
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    const categories = JSON.parse(data);

    const category = categories.find((c) => c._id === req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    category.name = name || category.name;
    category.description = description || category.description;

    fs.writeFileSync(filePath, JSON.stringify(categories, null, 2));
    res.json(category);
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ message: "Failed to update category" });
  }
});

// ------------------------------------
// DELETE category — SUPERADMIN ONLY
// ------------------------------------
router.delete("/:id", verifyToken, authorizeRoles("superadmin"), (req, res) => {
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    let categories = JSON.parse(data);

    const category = categories.find((c) => c._id === req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    categories = categories.filter((c) => c._id !== req.params.id);
    fs.writeFileSync(filePath, JSON.stringify(categories, null, 2));

    res.json({ message: "Category deleted" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ message: "Failed to delete category" });
  }
});

export default router;

// import express from "express";
// import fs from "fs";
// import path from "path";
// import { fileURLToPath } from "url";
// import { verifyToken } from "../middleware/authMiddleware.js";
// import { authorizeRoles } from "../middleware/roleMiddleware.js";

// const router = express.Router();
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const filePath = path.join(__dirname, "../data/categories.json");

// // ✅ All routes for super admin only
// router.use(verifyToken); //👈 affects ALL routes below
// router.use(authorizeRoles("superadmin"));

// // GET all categories
// router.get("/", (req, res) => {
//   const data = fs.readFileSync(filePath, "utf-8");
//   const categories = JSON.parse(data);
//   res.json(categories);
// });

// // POST new category
// router.post("/", (req, res) => {
//   const { name, description } = req.body;
//   const data = fs.readFileSync(filePath, "utf-8");
//   const categories = JSON.parse(data);

//   const newCategory = {
//     _id: (categories.length + 1).toString(),
//     name,
//     description
//   };

//   categories.push(newCategory);
//   fs.writeFileSync(filePath, JSON.stringify(categories, null, 2));

//   res.status(201).json(newCategory);
// });

// // PUT update category
// router.put("/:id", (req, res) => {
//   const { name, description } = req.body;
//   const data = fs.readFileSync(filePath, "utf-8");
//   const categories = JSON.parse(data);

//   const category = categories.find(c => c._id === req.params.id);
//   if (!category) return res.status(404).json({ message: "Category not found" });

//   category.name = name || category.name;
//   category.description = description || category.description;

//   fs.writeFileSync(filePath, JSON.stringify(categories, null, 2));
//   res.json(category);
// });

// // DELETE category
// router.delete("/:id", (req, res) => {
//   const data = fs.readFileSync(filePath, "utf-8");
//   let categories = JSON.parse(data);

//   const category = categories.find(c => c._id === req.params.id);
//   if (!category) return res.status(404).json({ message: "Category not found" });

//   categories = categories.filter(c => c._id !== req.params.id);
//   fs.writeFileSync(filePath, JSON.stringify(categories, null, 2));

//   res.json({ message: "Category deleted" });
// });

// export default router;