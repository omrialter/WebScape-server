const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { UserModel, validateUser, validateLogin, createToken, validateUpdate, validateChangePass } = require("../models/userModel")
const { auth, authAdmin } = require("../auth/auth.js");
const { UserPostModel } = require("../models/userPostModel");
const router = express.Router();

const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

router.get("/", async (req, res) => {
  res.json({ msg: "Users work" });
})



// only check the token 
router.get("/checkToken", auth, async (req, res) => {
  res.json({ _id: req.tokenData._id, role: req.tokenData.role });
})


// Get user info 
// Domain/users/userInfo
router.get("/userInfo", auth, async (req, res) => {
  try {
    let user = await UserModel.findOne({ _id: req.tokenData._id }, { password: 0 }).
      populate(`userPosts`)
      .exec()
    res.json(user)
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
})

router.get("/otherUserInfo/:user_name", auth, async (req, res) => {
  try {
    let username = req.params.user_name;
    let user = await UserModel.findOne({ user_name: username }, { password: 0 }).
      populate(`userPosts`)
      .exec()
    res.json(user)
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
})



router.get("/random4", auth, async (req, res) => {
  try {
    const user = await UserModel.findById(req.tokenData._id);
    const data = await UserModel.aggregate([
      { $match: { _id: { $ne: user._id } } },
      { $sample: { size: 5 } },
    ])
    res.json(data);

  } catch (err) {
    console.log(err);
    res.status(502).json({ err });
  }
});

router.get("/random5", auth, async (req, res) => {
  try {
    const user = await UserModel.findById(req.tokenData._id)

    const userId = new ObjectId(req.tokenData._id);
    const followingIds = user.followings;
    const data = await UserModel.aggregate([
      { $match: { _id: { $in: followingIds } } },
      { $sample: { size: 5 } },
      {
        $addFields: {
          followingsAsObjectIds: {
            $map: {
              input: "$followings",
              in: { $toObjectId: "$$this" }
            }
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "followingsAsObjectIds",
          foreignField: "_id",
          as: "followings"
        }

      },
      // Project the required fields
      {
        $project: {
          _id: 1,
          user_name: 1,
          profilePic: 1,
          followings: 1
        }
      },
      { $unwind: "$followings" },
      {
        $replaceRoot: { newRoot: "$followings" }
      },
      // Match to exclude already followed users
      { $match: { _id: { $nin: [userId, ...followingIds] } } },
      // // Sample from the remaining followings
      { $sample: { size: 5 } }
    ]);
    res.json(data);

  } catch (err) {
    console.log(err);
    res.status(502).json({ err });
  }
});



router.get("/usersList", authAdmin, async (req, res) => {
  try {
    let perPage = req.query.perPage || 8;
    let page = req.query.page - 1 || 0;
    let data = await UserModel
      .find({}, { password: 0 })
      .limit(perPage)
      .skip(page * perPage)
    res.json(data)
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
})


router.get("/count", async (req, res) => {
  try {
    let perPage = req.query.perPage || 5;
    const count = await UserModel.countDocuments({});
    res.json({ count, pages: Math.ceil(count / perPage) });
  }
  catch (err) {
    console.log("im an error");
    console.log(err);
    res.status(502).json({ err })
  }
})

router.get("/search", auth, async (req, res) => {
  let s = req.query.s;
  let searchExp = new RegExp(s, "i");
  try {
    let data = await UserModel
      .find({ user_name: searchExp })
      .limit(10)
    res.json(data);
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
})



// Create a new user
// Domain/users
router.post("/", async (req, res) => {
  let validBody = validateUser(req.body);
  if (validBody.error) {
    return res.status(400).json(validBody.error.details)
  }
  try {
    let user = new UserModel(req.body);
    user.password = await bcrypt.hash(user.password, 10);
    user.profilePic = "https://www.pexels.com/photo/man-facing-sideways-428364/";
    await user.save();
    user.password = "******";
    res.json(user);
  }
  catch (err) {
    console.log(err);
    if (err.code == 11000) {
      res.status(400).json({ msg: "email or user_name already exist", code: 11000 })
    }

  }
})

// Log in to get a token
// Domain/users/login

router.post("/login", async (req, res) => {
  let validBody = validateLogin(req.body);
  if (validBody.error) {
    return res.status(400).json(validBody.error.details);
  }
  let user = await UserModel.findOne({ user_name: req.body.user_name });
  if (!user) {
    return res.status(401).json({ msg: "user_name not found" });
  }
  let passValid = await bcrypt.compare(req.body.password, user.password);
  if (!passValid) {
    return res.status(401).json({ msg: `problem with the password` });
  }

  let newToken = createToken(user._id, user.role, user.followings, user.email, user.user_name)
  res.json({ token: newToken });

})

// Update user (you cant update password or email)
// Domain/users/(id of the user you want to update)

router.put("/:id", auth, async (req, res) => {
  let validBody = validateUpdate(req.body);
  if (validBody.error) {
    return res.status(400).json(validBody.error.details)
  }
  try {
    let id = req.params.id.trim();
    let data;
    if (req.tokenData.role == "admin") {
      data = await UserModel.updateOne({ _id: id }, req.body);
    } else if (id == req.tokenData._id) {
      data = await UserModel.updateOne({ _id: id }, req.body);
    }
    res.json(data);
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
})

//follow other user
//Domain/users/follow/(id of the user you want to follow)
router.put("/follow/:id", auth, async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id);
    const currentUser = await UserModel.findById(req.tokenData._id);
    if (!user.followers.includes(req.tokenData._id)) {
      await user.updateOne({ $push: { followers: req.tokenData._id } });
      await currentUser.updateOne({ $push: { followings: req.params.id } });
      res.json("user has been followed ")

    } else {
      await user.updateOne({ $pull: { followers: req.tokenData._id } });
      await currentUser.updateOne({ $pull: { followings: req.params.id } });
      res.json("user have been UnFollowd");
    }
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
}
)





//change user role
//Domain/users/changeRole/(id of the user)/admin\user
router.patch("/changeRole/:id/:role", authAdmin, async (req, res) => {
  const id = req.params.id;
  const newRole = req.params.role;
  try {
    if (id == req.tokenData._id || id == "643aeef089f3063e797886ae") {
      return res.status(401).json({ err: "You cant change your role! or the super admin" })
    }
    const data = await UserModel.updateOne({ _id: id }, { role: newRole })
    res.json(data);
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
})



router.patch("/profilePic", auth, async (req, res) => {
  try {
    if (req.body.profilePic.length > 0) {
      const data = await UserModel.updateOne({ _id: req.tokenData._id }, { profilePic: req.body.profilePic })
      res.json(data)
    }
    else {
      res.status(400).json({ err: "You need to send img_url in body" })
    }
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
})


// Delete
// Domain/users/(id of the user)
router.delete("/:id", auth, async (req, res) => {
  let id = req.params.id;
  let data;
  try {
    if (req.tokenData.role == "admin" && id != "643aeef089f3063e797886ae") {
      data = await UserModel.deleteOne({ _id: id });
    }
    else if (id == req.tokenData._id) {
      data = await UserModel.deleteOne({ _id: id });
    }
    res.json(data);
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }

})



module.exports = router;