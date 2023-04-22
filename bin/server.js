var app = require("../app");
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const port = process.env.PORT || 8080;

io.on("connection", (socket) => {
  console.log("user connected");
  socket.on("disconnect", function () {
    console.log("user disconnected");
  });
});
server.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
