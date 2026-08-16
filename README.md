# 🗄️ LanVault: Context-Aware Dual-Environment File Share

LanVault is a containerized, intelligent file-sharing platform designed to seamlessly handle both **Local Area Network (LAN)** and **Global (WAN)** traffic.

Instead of relying on standard cloud storage, LanVault acts as a self-hosted secure vault. It features a "Context-Aware" network brain that automatically detects where a user is connecting from and strictly isolates their files into separate physical environments to prevent network cross-contamination.

## ✨ Core Architecture & Features

- 🧠 **Context-Aware Routing:** The application intercepts the incoming connection URL. If it detects an `ngrok` tunnel, it locks the session to **Online Mode**. If it detects a local IP (`192.168.x.x`) or `localhost`, it locks to **Offline Mode**.
- 🧱 **Strict Network Isolation:** Files uploaded over the global internet are saved to an isolated `uploads/online` directory, while local files go to `uploads/offline`. Local users cannot see global files, and global users cannot see local files.
- 🐳 **Containerized Database:** Utilizes a Dockerized MySQL database for easy deployment and teardown without cluttering the host machine.
- 📦 **Dynamic ZIP Compilation:** Users can download entire directories of uploaded files on-the-fly, compressed dynamically by the server via `archiver`.
- 🔒 **Secure PIN Authentication:** Uploads are tied to unique Scholar Numbers and a persistent 4-digit PIN for identity verification.

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js
- **Storage & Routing:** Multer (Multipart/form-data handling), `fs` (File System)
- **Database:** MySQL (Running inside a Docker Container)
- **Infrastructure:** Docker, Docker Compose
- **Global Tunneling:** Ngrok
- **Frontend:** Vanilla HTML/CSS/JS with Context-Aware DOM manipulation

## 📂 Project Structure

```text
├── config/              # Database and Multer storage configurations
├── controllers/         # Core business logic and file handling
├── public/              # Frontend UI and Context-Aware JavaScript
├── routes/              # Express API endpoints
├── sql_commands/        # SQL initialization and update scripts
├── uploads/             # Dynamic, isolated storage (ignored in git)
├── docker-compose.yml   # Container orchestration
├── server.js            # Node.js entry point
└── .env                 # Environment variables
```

## 🚀 How to Run Locally

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
- [Node.js](https://nodejs.org/) installed.
- [Ngrok](https://ngrok.com/) (Optional, for global access).

### 1. Start the Database Environment

Clone this repository and spin up the MySQL container:

```bash
git clone [https://github.com/YOUR_USERNAME/LanVault.git](https://github.com/YOUR_USERNAME/LanVault.git)
cd LanVault
docker-compose up -d --build
```

### 2. Start the Node Server

Install the required dependencies and start the backend:

```bash
npm install
npm run dev
```

### 3. Access the Application

- **LAN Access:** Open `http://localhost:8000` (or your machine's IPv4 address `http://192.168.x.x:8000`) in any browser on your local network.
- **Global Access:** Run `ngrok http 8000` in a separate terminal and share the generated HTTPS link.

---

_Designed and engineered by theanubhavarya_
