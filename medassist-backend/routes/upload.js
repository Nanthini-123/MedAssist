import express from "express";
import multer from "multer";
import cloudinary from "cloudinary";
import streamifier from "streamifier";
import pool from "../db.js";
const router = express.Router();
const upload = multer();

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

router.post("/upload-report", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const visitorEmail = req.body.visitorEmail;
    if (!file) return res.status(400).json({ success:false, error: "no file" });

    const streamUpload = (buffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.v2.uploader.upload_stream({ resource_type: "auto", folder: "medassist/reports" }, (error, result) => {
          if (result) resolve(result);
          else reject(error);
        });
        streamifier.createReadStream(buffer).pipe(stream);
      });
    };

    const result = await streamUpload(file.buffer);
    // save record in DB (reports table)
    await pool.query("INSERT INTO reports(visitor_email, filename, url, created_at) VALUES($1,$2,$3,NOW())", [visitorEmail, result.original_filename || result.public_id, result.secure_url]);

    res.json({ success: true, url: result.secure_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success:false, error: err.message });
  }
});

export default router;