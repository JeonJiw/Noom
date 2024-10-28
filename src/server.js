import http from "http";
import { Server } from "socket.io";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const port = 3002;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
app.use("/public", express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const handleListen = () => console.log(`Listening on http://localhost:${port}`);

const server = http.createServer(app);
const io = new Server(server);

function publicRooms() {
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = io;

  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });
  return publicRooms;
}

function countRoom(roomName) {
  return io.sockets.adapter.rooms.get(roomName)?.size;
}

io.on("connection", (socket) => {
  socket["nickname"] = "Anon";
  socket.onAny((event) => {
    console.log(io.sockets.adapter);
    console.log(`Socket Event: ${event}`);
  });
  socket.on("enter_room", (roomName, done) => {
    socket.join(roomName);
    const userCount = countRoom(roomName);
    done(userCount);
    socket.to(roomName).emit("welcome", socket.nickname, userCount);
    io.sockets.emit("room_change", publicRooms());
  });
  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) =>
      socket.to(room).emit("bye", socket.nickname, countRoom(room) - 1)
    );
  });
  socket.on("disconnect", () => {
    io.sockets.emit("room_change", publicRooms());
  });

  socket.on("new_message", (msg, room, done) => {
    socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
    done();
  });
  socket.on("nickname", (nickname) => (socket["nickname"] = nickname));
});

server.listen(port, handleListen);
