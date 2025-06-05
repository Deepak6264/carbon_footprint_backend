const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images"); // ✅ Correct callback function
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); // ✅ Extract file extension
    const filename = `${uuidv4()}${ext}`; // ✅ Unique filename
    cb(null, filename);
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
