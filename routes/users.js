if (process.env.NODE_ENV !== "production") {
    require("dotenv").config(); // load .env file
}

const express = require("express");
const bcrypt = require("bcrypt"); // hash passwords
const router = express.Router();

const passport = require("passport"); // passport-config.js
const flash = require("express-flash"); // flash messages
const session = require("express-session"); // session middleware

const initializePassport = require("../passport-config");
initializePassport(
    passport,
    (email) => {
        const DataBase = require("./db"); // db.js
        const db = new DataBase();
        try {
            let userFound = db.findUserByEmail(email);
            db.close();
            return userFound;
        } catch (e) {
            console.log(`Error while logging in: ${e}`);
            db.close();
            return null;
        }
    },
    (id) => {
        const DataBase = require("./db"); // db.js
        const db = new DataBase();
        try {
            let userFound = db.findUserByID(id);
            db.close();
            return userFound;
        } catch (e) {
            console.log(`Error while logging in: ${e}`);
            db.close();
            return null;
        }
    }
);

// url-encoded body parser
router.use(express.urlencoded({ extended: false }));

router.use(flash()); // flash messages middleware
router.use(
    // session middleware
    session({
        secret: process.env.SESSION_SECRET,
        resave: false, // do not save session if not modified
        saveUninitialized: false,
    })
);
router.use(passport.initialize());
router.use(passport.session());

router.get("/", (req, res) => {
    // users page
    console.log(req.query.name);
    res.send("User List");
    // home page
    // res.render("users", { name: req.user.name });
});

router.get("/login", (req, res) => {
    // users/login page
    res.render("users/login");
});

router.post(
    "/login",
    passport.authenticate("local", {
        // successRedirect: "/",
        successRedirect: "/users",
        failureRedirect: "/users/login",
        failureFlash: true,
    })
);

router.get("/register", (req, res) => {
    // users/register page
    res.render("users/register");
});

router.post("/register", async (req, res) => {
    // users/register POST request
    try {
        const DataBase = require("../db");
        const db = new DataBase();
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        db.addNewUser(
            // add new user to database
            req.body.codiceFiscale,
            req.body.firstName,
            req.body.lastName,
            req.body.city,
            req.body.email,
            hashedPassword
        );
        db.close();
        res.redirect("/users/login");
    } catch (e) {
        // res.send("Error");
        console.log("Error while registering");
        res.redirect("/users/register");
    }
});

// router.post("/", (req, res) => {
//     const isValid = false;
//     if (isValid) {
//         console.log("Valid user");
//         users.push({ firstName: req.body.firstName });
//         // users.push(req.body);
//         res.redirect(`/users/${users.length - 1}`);
//     } else {
//         console.log("Invalid user");
//         res.render("users/register", {
//             firstName: req.body.firstName,
//             lastName: req.body.lastName,
//             error: "Invalid user",
//         });
//     }
// });

// router
//     .route("/:id") // /users/:id
//     .get((req, res) => {
//         res.send(`Get user ${req.params.id}`);
//     })
//     .put((req, res) => {
//         res.send(`Update user ${req.params.id}`);
//     })
//     .delete((req, res) => {
//         res.send(`Delete user ${req.params.id}`);
//     });

// const users = [{ name: "John" }, { name: "Jane" }];
// router.param("id", (req, res, next, id) => {
//     req.user = users[id];
//     next();
// });

module.exports = router;
