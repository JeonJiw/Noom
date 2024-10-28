import http from "http";
import { Server } from "socket.io";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { instrument } from "@socket.io/admin-ui";

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
const io = new Server(server, {
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true,
  },
});
instrument(io, {
  auth: false,
});

server.listen(port, handleListen);
