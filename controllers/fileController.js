// executes the backend logic.
// contains the raw SQL insertions, fetches, and the mathematical compression sequence for the ZIP archives.

// Logic for uploading a file
const db = require("../config/db");
const path = require("path");
const fs = require("fs");
// const { ZipArchive } = require("archiver");
const archiver = require("archiver"); // 🆕 Import the archiver package
const bcrypt = require("bcryptjs"); // 🆕 Import the cryptography package

// Logic for uploading a file securely
exports.uploadFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  const scholarNumber = req.body.scholar_number;
  const rawPin = req.body.userPin; // Grab the raw PIN from the frontend
  const username = req.body.username || "Anonymous";
  const college = req.body.college || "Unknown";
  const branch = req.body.branch || "Unknown";

  const originalName = req.file.originalname;
  const filename = req.file.filename;
  const fileSize = req.file.size;
  const filePath = req.file.path;

  // 1. Check if the Scholar Number already exists in the database
  db.query(
    "SELECT * FROM users WHERE scholar_number = ?",
    [scholarNumber],
    async (err, rows) => {
      if (err)
        return res
          .status(500)
          .json({ error: "Database error during user lookup." });

      let userId;

      if (rows.length > 0) {
        // --- RETURNING USER LOGIC ---
        const existingUser = rows[0];

        // Compare the entered PIN with the hashed PIN in the database
        const isMatch = await bcrypt.compare(rawPin, existingUser.pin);

        if (!isMatch) {
          // PIN is incorrect, reject the upload and delete the temporary file Multer just saved
          fs.unlinkSync(filePath);
          return res.status(401).json({
            error:
              "Authentication Failed: Incorrect PIN for this Scholar Number.",
          });
        }

        // PIN is correct
        userId = existingUser.id;
        insertFileRecord(
          userId,
          filename,
          originalName,
          fileSize,
          filePath,
          scholarNumber,
          username,
          req,
          res,
        );
      } else {
        // --- NEW USER LOGIC ---
        // Hash the brand new PIN with a salt round of 10
        const hashedPin = await bcrypt.hash(rawPin, 10);

        const userSql =
          "INSERT INTO users (scholar_number, username, college, branch, pin) VALUES (?, ?, ?, ?, ?)";
        db.query(
          userSql,
          [scholarNumber, username, college, branch, hashedPin],
          (err, userResult) => {
            if (err)
              return res
                .status(500)
                .json({ error: "Database error while creating new user." });

            userId = userResult.insertId;
            insertFileRecord(
              userId,
              filename,
              originalName,
              fileSize,
              filePath,
              scholarNumber,
              username,
              req,
              res,
            );
          },
        );
      }
    },
  );
};

// Helper function to keep the code clean
function insertFileRecord(
  userId,
  filename,
  originalName,
  fileSize,
  filePath,
  scholarNumber,
  username,
  req,
  res,
) {
  // Grab the mode from the request (defaults to offline if missing)
  const mode = req.query.mode === "online" ? "online" : "offline";

  // 🆕 Updated SQL to include the new 'mode' column
  const fileSql =
    "INSERT INTO files (filename, original_name, file_size, file_path, user_id, mode) VALUES (?, ?, ?, ?, ?, ?)";

  db.query(
    fileSql,
    [filename, originalName, fileSize, filePath, userId, mode],
    (err) => {
      if (err)
        return res
          .status(500)
          .json({ error: "Database error while saving file data." });

      // Grab the WebSocket and broadcast a signal to every connected screen
      const io = req.app.get("io");
      if (io) {
        io.emit("new_file_uploaded");
      }

      res.status(200).json({
        message: `File successfully uploaded via ${mode.toUpperCase()} mode!`,
        file: filename,
        folder: `uploads/${mode}/${scholarNumber}_${username}`,
      });
    },
  );
}

// Logic for fetching the file list
// 🆕 UPDATED: Isolated File Fetching
exports.getFiles = (req, res) => {
  // Grab the mode from the frontend's request
  const mode = req.query.mode === "online" ? "online" : "offline";

  // Use a WHERE clause to strictly isolate the data
  const sql = `
      SELECT f.filename, f.original_name, f.file_size, f.uploaded_at, f.mode, u.username, u.scholar_number, u.college, u.branch
      FROM files f
      JOIN users u ON f.user_id = u.id
      WHERE f.mode = ? 
      ORDER BY f.uploaded_at DESC
  `;

  db.query(sql, [mode], (err, results) => {
    if (err)
      return res.status(500).json({ error: "Database retrieval error." });
    res.status(200).json(results);
  });
};

// Logic for generating the ZIP archive
exports.downloadZip = (req, res) => {
  try {
    const folderName = req.params.folderName;

    // 🆕 ADDED: Grab the mode from the URL query
    const mode = req.query.mode === "online" ? "online" : "offline";

    // 🆕 UPDATED: Inject the mode into the folder path
    const folderPath = path.join(__dirname, "..", "uploads", mode, folderName);

    if (!fs.existsSync(folderPath)) {
      console.log(`[ZIP ERROR] Folder not found: ${folderPath}`);
      return res.status(404).json({ error: "Folder not found on the server." });
    }

    console.log(`[ZIP START] Compressing ${mode} folder: ${folderName}...`);

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${folderName}.zip"`,
    );

    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.on("error", (err) => {
      console.error("[ZIP ERROR] Archiver failed:", err);
      if (!res.headersSent) {
        res.status(500).send({ error: err.message });
      }
    });

    archive.on("end", () => {
      console.log(
        `[ZIP SUCCESS] Sent ${archive.pointer()} total bytes to the user!`,
      );
    });

    archive.pipe(res);
    archive.directory(folderPath, false);
    archive.finalize();
  } catch (err) {
    console.error("[FATAL ERROR] ZIP Route crashed:", err);
    if (!res.headersSent) {
      res.status(500).send("Server encountered a fatal error.");
    }
  }
};
