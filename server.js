require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const path = require("path");
const http = require("http"); // 🆕 Built-in Node module
const { Server } = require("socket.io"); // 🆕 Import Socket.io

const fileRoutes = require("./routes/fileRoutes");

const app = express();
const PORT = process.env.PORT || 8000;

// 🆕 Create the raw HTTP server and attach Socket.io
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// 🆕 Make 'io' globally accessible to our controllers
app.set("io", io);

io.on("connection", (socket) => {
  console.log(`[NETWORK] A new device connected to LanVault: ${socket.id}`);
});

// Security and Data Parsing Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "upgrade-insecure-requests": null,
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static File Serving
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Mount the modular routes
app.use("/api", fileRoutes);

// 🛑 CRUCIAL: Change app.listen to server.listen so WebSockets work
server.listen(PORT, "0.0.0.0", () => {
  console.log(`LanVault Server is running and listening on port ${PORT}`);
});
