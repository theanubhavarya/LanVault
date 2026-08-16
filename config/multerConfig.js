// configures the hard drive streaming, creates the custom folders, and strictly enforces the 2GB size limit and file type rules.

const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const scholarNumber = req.body.scholar_number || "UnknownID";
    const username = req.body.username || "Anonymous";

    // 🆕 THE LOGIC: Read the query parameter to determine the folder
    // Example: If the URL is /api/upload?mode=online, it goes to the online folder
    const mode = req.query.mode === "online" ? "online" : "offline";

    const folderName = `${scholarNumber}_${username}`;

    // 🆕 THE PATH: It now routes to uploads/online/Folder or uploads/offline/Folder
    const userFolder = path.join(__dirname, "..", "uploads", mode, folderName);

    if (!fs.existsSync(userFolder)) {
      fs.mkdirSync(userFolder, { recursive: true });
    }
    cb(null, userFolder);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes =
    /jpeg|jpg|png|pdf|doc|docx|txt|csv|ipynb|py|cpp|c|java|zip/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );

  if (extname) {
    return cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only standard documents, datasets, and code files are allowed.",
      ),
    );
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2GB Limit
  fileFilter: fileFilter,
});

module.exports = upload;
