import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: "YOUR_CLOUD_NAME", // 🔹 replace with your cloud name
  api_key: "YOUR_API_KEY",
  api_secret: "YOUR_API_SECRET",
  secure: true,
});

export default cloudinary;