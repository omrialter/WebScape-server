const jwt = require("jsonwebtoken");
const { config } = require("../config/secret");


exports.auth = (req, res, next) => {
    let token = req.header("x-api-key");
    if (!token) {
        res.status(401).json({ msg: "you must send token!" });
    }
    try {
        let decodeToken = jwt.verify(token, config.tokenSecret);
        req.tokenData = decodeToken;
        next();
    }
    catch (err) {
        console.log(err);
        res.status(502).json({ msg: "token invalid" });
    }
}

exports.authAdmin = (req, res, next) => {
    let token = req.header("x-api-key");
    if (!token) {
        return res.status(401).json({ err: "You must send token to this endpoint " });
    }
    try {
        let decodeToken = jwt.verify(token, config.tokenSecret);
        if (decodeToken.role != "admin") {
            return res.status(401).json({ err: "You must send admin token to this endpoint" });
        }
        req.tokenData = decodeToken;
        next();
    }
    catch (err) {
        res.status(401).json({ err: "Token invalid or expired " })
    }
}