const mongoose = require("mongoose");
const Joi = require("joi");

let userPostsSchema = new mongoose.Schema({
    description: String,
    img_url: String,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
    },
    likes: {
        type: Array, default: []
    },
    date_created: {
        type: Date, default: Date.now
    },

})
exports.UserPostModel = mongoose.model("userPosts", userPostsSchema)
//const userPosts = module.exports = mongoose.model("userPosts", userPostsSchema);

exports.validateUserPosts = (_reqBody) => {
    let joiSchema = Joi.object({
        description: Joi.string().min(1).max(500).allow(null, ""),
        img_url: Joi.string().min(2).max(1000).allow(null, ""),
    })
    return joiSchema.validate(_reqBody)
}


