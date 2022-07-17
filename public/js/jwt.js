const DataBase = require("./db"); // db.js
const db = new DataBase(); // create new database

const jwt = require("jsonwebtoken"); // generate JWT tokens
const jwt_decode = require("jwt-decode"); // decode JWT token

function generateAccessToken(user_ID) {
    return jwt.sign(
        {
            user_ID,
            role: 1,
            iat: Math.floor(new Date().getTime() / 1000)
        },
        process.env.JWT_TOKEN_KEY,
        { expiresIn: "1h" }
    );
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_TOKEN_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

async function checkRole(id) {
    const userFound = await db.findUserByID(id);
    isAdmin(userFound.token);
}

function isAdmin(token) {
    const decoded = jwt_decode(token);
    if (decoded.role === 0)
        return 1;
    return 0;
}

module.exports = { authenticateToken, generateAccessToken, checkRole, isAdmin };