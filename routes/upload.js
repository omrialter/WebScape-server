const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;
const { config } = require("../config/secret");


cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_KEY,
    api_secret: process.env.CLOUD_SECRET
});



router.get("/", async (req, res) => {
    res.json({ msg: "Upload work" });
})



router.post("/cloud", async (req, res) => {
    try {
        // Upload the image to Cloudinary with unique filename
        const dataUpload = await cloudinary.uploader.upload(req.body.image, { unique_filename: true })
        res.json({ data: dataUpload });  // Respond with the uploaded image data
    }
    catch (err) {
        console.log(err);
        res.status(502).json({ err })
    }
})







module.exports = router;