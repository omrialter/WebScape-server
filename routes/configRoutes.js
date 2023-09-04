const indexR = require("./index");
const usersR = require("./users");
const userPostsR = require("./userPosts");
const commentsR = require("./comments");
const groupsR = require("./groups");
const uploadR = require("./upload");


exports.routesInit = (app) => {
  app.use("/", indexR);
  app.use("/users", usersR);
  app.use("/userPosts", userPostsR);
  app.use("/comments", commentsR);
  app.use("/groups", groupsR);
  app.use("/upload", uploadR);
  app.use("/*", (req, res) => {
    res.status(404).json({ msg: "page not found 404" })
  })
}
