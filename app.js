const express = require("express");
const http = require("http");
const path = require("path");
const { routesInit } = require("./routes/configRoutes");
const cors = require("cors");


require("./db/mongoConnect");

const app = express();

app.use(cors());
app.use(express.json({ limit: "5 mb" }));
app.use(express.static(path.join(__dirname, "public")));
const server = http.createServer(app);

routesInit(app);

let port = process.env.PORT || 3007;
server.listen(port);
console.log("server listening on port " + port);





