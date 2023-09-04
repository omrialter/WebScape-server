const express = require("express");
const { validateGroups, GroupModel } = require("../models/groupModel");
const router = express.Router();
const { auth, authAdmin } = require("../auth/auth");

router.get("/", async (req, res) => {
    res.json({ msg: "Express homepage work" });
})

//get all groups(only admin)
//Domain/users/groupsList

router.get("/groupsList", authAdmin, async (req, res) => {
    try {
        let perPage = req.query.perPage || 10;
        let page = req.query.page - 1 || 0;
        let data = await GroupModel
            .find({})
            .limit(perPage)
            .skip(page * perPage)
            .sort({ _id: -1 })
        res.json(data)
    }
    catch (err) {
        console.log(err);
        res.status(502).json({ err })
    }
})

router.get("/groupsListUser", auth, async (req, res) => {
    try {
        let perPage = req.query.perPage || 10;
        let page = req.query.page - 1 || 0;
        let data = await GroupModel
            .find({ members: req.tokenData._id })
            .limit(perPage)
            .skip(page * perPage)
            .sort({ _id: -1 })
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
        const count = await GroupModel.countDocuments({});
        res.json({ count, pages: Math.ceil(count / perPage) });
    }
    catch (err) {
        console.log("im an error");
        console.log(err);
        res.status(502).json({ err })
    }
})


router.post("/", auth, async (req, res) => {
    let validBody = validateGroups(req.body);
    if (validBody.error) {
        console.log("not valid body")
        return res.status(400).json(validBody.error.details)
    }
    try {
        let group = new GroupModel(req.body);
        group.group_admin = req.tokenData._id;
        await group.save();
        res.status(201).json(group);

    }
    catch (err) {
        console.log(err);
        res.status(502).json({ msg: "An error occurred while trying to save the group." })
    }
})

router.put("/follow/:id", auth, async (req, res) => {
    try {
        const group = await GroupModel.findById(req.params.id);
        const currentUser = await GroupModel.findById(req.tokenData._id);
        if (!group.members.includes(currentUser)) {
            await group.updateOne({ $push: { members: req.tokenData._id } })
            res.json("group has been followed ")

        } else {
            res.status(403).json("you already follow this group");
        }
    }
    catch (err) {
        console.log(err);
        res.status(502).json({ msg: "An error occurred while trying to save the group." })
    }
})

//delete group
// Domain/groups/(id of the group)
router.delete("/:id", auth, async (req, res) => {
    try {
        let id = req.params.id;
        let data;
        if (req.tokenData.role == "admin") {
            data = await GroupModel.deleteOne({ _id: id });
        }
        else {
            data = await GroupModel.deleteOne({ _id: id, user_id: req.tokenData._id });
        }
        res.json(data);
    }
    catch (err) {
        console.log(err);
        res.status(502).json({ err })
    }
})


module.exports = router;