require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { createClient } = require("redis");
const { createAdapter } = require("@socket.io/redis-adapter");

const app = express();

const server = http.createServer(app);

const pubClient = createClient({ url: "redis://localhost:6379" });
const subClient = pubClient.duplicate();

pubClient.connect().catch(console.error);
subClient.connect().catch(console.error);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Allow requests from the front end
    methods: ["GET", "POST"],
  },
});

io.adapter(createAdapter(pubClient, subClient));

app.use(
  cors({
    origin: "http://localhost:5173", // Allow requests from the front end
  })
);

// Listen for incoming connections
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("message", (msg) => {
    console.log("Message received on PORT:", { PORT: process.env.PORT, msg });

    io.emit("message", msg);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
