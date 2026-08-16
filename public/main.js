let globalFiles = [];
let currentActiveFolder = null;

// --- 🆕 REAL-TIME WEBSOCKET CONNECTION ---
const socket = io(); // connnect to the backend socket.io server

// Listen for the broadcast signal
socket.on("new_file_uploaded", () => {
  // If the user is currently looking at the download tab, fetch the new files instantly in the background!
  if (document.getElementById("downloadSection").style.display === "block") {
    loadFiles();
  }
});

// --- 🧠 CONTEXT-AWARE ROUTING LOGIC ---
let currentUploadMode = "offline"; // Default

function detectNetworkEnvironment() {
  const hostname = window.location.hostname;
  const uploadForm = document.getElementById("uploadForm");
  const statusBadge = document.getElementById("network-status-badge");

  // If the URL contains "ngrok", we are securely tunneled over the global internet
  if (hostname.includes("ngrok")) {
    currentUploadMode = "online";
    if (statusBadge)
      statusBadge.innerHTML = "🌐 Connected via Global Network (Online)";
    if (statusBadge) statusBadge.style.color = "#2196F3"; // Blue
  } else {
    currentUploadMode = "offline";
    if (statusBadge)
      statusBadge.innerHTML = "📶 Connected via Secure LAN (Offline)";
    if (statusBadge) statusBadge.style.color = "#4CAF50"; // Green
  }

  // Automatically route the upload form to the correct hidden folder
  if (uploadForm) {
    uploadForm.action = `/api/upload?mode=${currentUploadMode}`;
  }
}

// --- UI TAB NAVIGATION ---
function switchTab(tabName) {
  const uploadSec = document.getElementById("uploadSection");
  const downloadSec = document.getElementById("downloadSection");
  const btnUpload = document.getElementById("btn-upload");
  const btnDownload = document.getElementById("btn-download");

  if (tabName === "upload") {
    uploadSec.style.display = "block";
    downloadSec.style.display = "none";
    btnUpload.style.backgroundColor = "#007bff";
    btnUpload.style.color = "white";
    btnDownload.style.backgroundColor = "#f1f1f1";
    btnDownload.style.color = "black";
  } else {
    uploadSec.style.display = "none";
    downloadSec.style.display = "block";
    btnDownload.style.backgroundColor = "#007bff";
    btnDownload.style.color = "white";
    btnUpload.style.backgroundColor = "#f1f1f1";
    btnUpload.style.color = "black";

    loadFiles();
  }
}

// --- DATA FETCHING ---
async function loadFiles() {
  try {
    // const response = await fetch("/api/files");
    const response = await fetch(`/api/files?mode=${currentUploadMode}`);
    if (!response.ok) throw new Error("Server error fetching files");

    globalFiles = await response.json();
    console.log("Database fetch successful:", globalFiles); // Helpful for debugging in F12 Console

    currentActiveFolder = null;
    processRender();
  } catch (error) {
    console.error("Error fetching files:", error);
    document.getElementById("fileList").innerHTML =
      `<li style="color: red; padding: 20px;">Error loading files. Check connection.</li>`;
  }
}

// --- SORTING & FILTERING ENGINE ---
function processRender() {
  const searchQuery = document
    .getElementById("searchInput")
    .value.toLowerCase();
  const sortMode = document.getElementById("sortSelect").value;
  const list = document.getElementById("fileList");
  list.innerHTML = "";

  if (currentActiveFolder === null) {
    // ===============================
    // WE ARE IN FOLDER VIEW
    // ===============================
    let folders = {};

    // 1. Group the files safely (Handling nulls)
    globalFiles.forEach((file) => {
      const sNum = file.scholar_number || "UnknownID";
      const uName = file.username || "Anonymous";
      const col = file.college || "Unknown";
      const br = file.branch || "Unknown";

      if (!folders[sNum]) {
        folders[sNum] = {
          scholar_number: sNum,
          username: uName,
          college: col,
          branch: br,
          latest_upload: file.uploaded_at,
          files: [],
        };
      }
      folders[sNum].files.push(file);

      if (new Date(file.uploaded_at) > new Date(folders[sNum].latest_upload)) {
        folders[sNum].latest_upload = file.uploaded_at;
      }
    });

    // 2. Convert object to array for sorting and filtering
    let folderArray = Object.values(folders);

    // 3. Safely Apply Search Filter
    if (searchQuery) {
      folderArray = folderArray.filter(
        (f) =>
          String(f.username).toLowerCase().includes(searchQuery) ||
          String(f.scholar_number).toLowerCase().includes(searchQuery) ||
          String(f.college).toLowerCase().includes(searchQuery) ||
          String(f.branch).toLowerCase().includes(searchQuery),
      );
    }

    // 4. Apply Sorting
    folderArray.sort((a, b) => {
      if (sortMode === "newest")
        return new Date(b.latest_upload) - new Date(a.latest_upload);
      if (sortMode === "oldest")
        return new Date(a.latest_upload) - new Date(b.latest_upload);
      if (sortMode === "az")
        return String(a.username).localeCompare(String(b.username));
      if (sortMode === "za")
        return String(b.username).localeCompare(String(a.username));
    });

    // 5. Draw Folders (Now with ZIP button)
    folderArray.forEach((folderData) => {
      const li = document.createElement("li");
      li.style.cursor = "pointer";
      li.style.padding = "15px";
      li.style.borderBottom = "1px solid #ccc";
      li.style.listStyleType = "none";

      // Use Flexbox to separate folder info (left) and the ZIP button (right)
      li.style.display = "flex";
      li.style.justifyContent = "space-between";
      li.style.alignItems = "center";

      const folderName = `${folderData.scholar_number}_${folderData.username}`;

      // --- Left Side: Folder Icon & Details ---
      const leftDiv = document.createElement("div");
      leftDiv.innerHTML = `
        <span style="font-size: 2em; vertical-align: middle;">📁</span> 
        <strong style="font-size: 1.2em; margin-left: 10px;">${folderName}</strong>
        <br>
        <span style="color: #666; margin-left: 55px;">${folderData.college} - ${folderData.branch} (${folderData.files.length} items)</span>
      `;

      // --- Right Side: Download ZIP Button ---
      const rightDiv = document.createElement("div");
      const zipBtn = document.createElement("a");
      // zipBtn.href = `/api/download-zip/${folderName}`;
      zipBtn.href = `/api/download-zip/${folderName}?mode=${currentUploadMode}`;
      zipBtn.innerText = "📦 Download ZIP";
      zipBtn.style.padding = "8px 15px";
      zipBtn.style.backgroundColor = "#ffc107";
      zipBtn.style.color = "black";
      zipBtn.style.textDecoration = "none";
      zipBtn.style.borderRadius = "5px";
      zipBtn.style.fontWeight = "bold";
      zipBtn.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";

      // CRUCIAL: Stop the click from opening the folder behind the button
      zipBtn.onclick = (e) => e.stopPropagation();
      zipBtn.onmouseover = () => (zipBtn.style.backgroundColor = "#e0a800");
      zipBtn.onmouseout = () => (zipBtn.style.backgroundColor = "#ffc107");

      rightDiv.appendChild(zipBtn);

      // Append both sides to the list item
      li.appendChild(leftDiv);
      li.appendChild(rightDiv);

      // The click event to open the folder
      li.onclick = () => {
        currentActiveFolder = folderData;
        document.getElementById("searchInput").value = "";
        processRender();
      };

      li.onmouseover = () => (li.style.backgroundColor = "#eaf4ff");
      li.onmouseout = () => (li.style.backgroundColor = "transparent");

      list.appendChild(li);
    });
  } else {
    // ===============================
    // WE ARE IN FILE VIEW
    // ===============================
    let filesToRender = currentActiveFolder.files;

    // 1. Safely Apply Search
    if (searchQuery) {
      filesToRender = filesToRender.filter((f) =>
        String(f.original_name).toLowerCase().includes(searchQuery),
      );
    }

    // 2. Apply Sorting
    filesToRender.sort((a, b) => {
      if (sortMode === "newest")
        return new Date(b.uploaded_at) - new Date(a.uploaded_at);
      if (sortMode === "oldest")
        return new Date(a.uploaded_at) - new Date(b.uploaded_at);
      if (sortMode === "az")
        return String(a.original_name).localeCompare(String(b.original_name));
      if (sortMode === "za")
        return String(b.original_name).localeCompare(String(a.original_name));
    });

    // 3. Draw Back Button
    const backBtn = document.createElement("button");
    backBtn.innerText = "⬅️ Back to Folders";
    backBtn.style.marginBottom = "20px";
    backBtn.style.padding = "8px 15px";
    backBtn.style.cursor = "pointer";
    backBtn.onclick = () => {
      currentActiveFolder = null;
      document.getElementById("searchInput").value = "";
      processRender();
    };
    list.appendChild(backBtn);

    // 4. Draw Files
    filesToRender.forEach((file) => {
      const li = document.createElement("li");
      li.style.padding = "12px 10px";
      li.style.borderBottom = "1px solid #eee";
      li.style.listStyleType = "none";

      // Format folder structure accurately
      const folderName = `${file.scholar_number || "UnknownID"}_${file.username || "Anonymous"}`;
      // const downloadUrl = `/uploads/${folderName}/${file.filename}`;
      const downloadUrl = `/uploads/${currentUploadMode}/${folderName}/${file.filename}`;
      const dateStr = new Date(file.uploaded_at).toLocaleString();

      li.innerHTML = `
        <span style="font-size: 1.2em;">📄</span> 
        <strong style="margin-left: 10px;">${file.original_name}</strong> 
        <span style="color: #888; font-size: 0.85em; margin-left: 10px;">(${Math.round(file.file_size / 1024)} KB) - Uploaded: ${dateStr}</span>
        <a href="${downloadUrl}" download="${file.original_name}" style="float: right; text-decoration: none; color: white; background: #28a745; padding: 5px 10px; border-radius: 4px; font-size: 0.9em; font-weight: bold;">Download</a>
      `;
      list.appendChild(li);
    });
  }
}

// --- SECURE EVENT LISTENERS ---
// Securely attach event listeners after the DOM loads
window.onload = () => {
  document
    .getElementById("btn-upload")
    .addEventListener("click", () => switchTab("upload"));
  document
    .getElementById("btn-download")
    .addEventListener("click", () => switchTab("download"));
  document
    .getElementById("searchInput")
    .addEventListener("keyup", processRender);
  document
    .getElementById("sortSelect")
    .addEventListener("change", processRender);

  // 🆕 ADDED: Initialize the Mode Toggles
  // setupModeToggles();
  detectNetworkEnvironment();

  // Ensure the Upload tab is shown cleanly by default on load
  switchTab("upload");
};
