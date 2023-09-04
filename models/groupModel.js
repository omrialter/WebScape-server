const mongoose = require("mongoose");
const Joi = require("joi");

let schema = new mongoose.Schema({
    description: String,
    group_name: String,
    group_admin: String,
    posts: {
        type: Array, default: []
    },
    members: {
        type: Array, default: []
    },
    coverPic: {
        type: String, default: ""
    },
    date_created: {
        type: Date, default: Date.now
    },

})
exports.GroupModel = mongoose.model("groups", schema)

exports.validateGroups = (_reqBody) => {
    let joiSchema = Joi.object({
        description: Joi.string().min(1).max(500).allow(null, ""),
        group_name: Joi.string().min(2).max(40).required(),
    })
    return joiSchema.validate(_reqBody)
}