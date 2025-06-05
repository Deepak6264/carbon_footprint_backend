const express = require("express");
const router = express.Router();
const upload = require("./multer"); // Multer for file uploads
const pool = require("./pool"); // MySQL Connection Pool

// Update User Profile API
router.post("/update-profile", upload.single("image"), (req, res) => {
  const { name, email, mobile } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  if (!email) {
    return res.status(400).json({ message: "Email is required", status: false });
  }

  // Check if user exists
  pool.query("SELECT * FROM users WHERE email = ?", [email], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Database error", status: false });
    }
    if (result.length === 0) {
      return res.status(404).json({ message: "User not found", status: false });
    }

    // Update user profile
    const updateQuery = image
      ? "UPDATE users SET name = ?, mobile = ?, image = ? WHERE email = ?"
      : "UPDATE users SET name = ?, mobile = ? WHERE email = ?";

    const values = image ? [name, mobile, image, email] : [name, mobile, email];

    pool.query(updateQuery, values, (updateErr) => {
      if (updateErr) {
        return res.status(500).json({ message: "Failed to update profile", status: false });
      }
      res.json({ message: "Profile updated successfully!", status: true, image });
    });
  });
});

module.exports = router;
