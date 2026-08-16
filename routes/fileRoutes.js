// links the URL strings to the Controller functions and applies the Multer middleware to the upload route specifically.

const express = require("express");
const router = express.Router();
const upload = require("../config/multerConfig");
const fileController = require("../controllers/fileController");

// The /upload route applies the Multer logic and catches size errors before firing the controller
router.post("/upload", (req, res, next) => {
  upload.single("labFile")(req, res, function (err) {
    if (err) {
      // Catches both the 2GB limit and the custom fileFilter errors
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, fileController.uploadFile);

// The GET routes
router.get("/files", fileController.getFiles);
router.get("/download-zip/:folderName", fileController.downloadZip);

module.exports = router;