if (process.env.NODE_ENV !== "production") {
    require("dotenv").config(); // load .env file
}

const express = require("express"); // import express
const morgan = require("morgan"); // log requests
const bcrypt = require("bcrypt"); // hash passwords
const passport = require("passport"); // passport-config.js
const flash = require("express-flash"); // flash messages
const session = require("express-session"); // session middleware
const methodOverride = require("method-override"); // override POST method (delete)

const DataBase = require("./db"); // db.js
const db = new DataBase();

const app = express();
const port = 3000;

const initializePassport = require("./passport-config");
initializePassport(
    passport,
    async (email) => {
        try {
            db.open();
            const userFound = await db.findUserByEmail(email);
            db.close();
            return userFound;
        } catch (e) {
            console.log(`Error while logging in: ${e}`);
            db.close();
            return null;
        }
    },
    async (id) => {
        try {
            db.open();
            const userFound = await db.findUserByID(id);
            db.close();
            return userFound;
        } catch (e) {
            console.log(`Error while logging in: ${e}`);
            db.close();
            return null;
        }
    }
);

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: false })); // url-encoded body parser
app.use(express.json()); // json will be parsed automatically in req.body object
app.use(morgan("tiny")); // request a logger middleware to log requests
app.use(flash()); // flash messages middleware
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
    })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"));

app.get("/", checkAuthenticated, (req, res) => {
    res.render("index.ejs", { name: req.user.first_name });
});

app.get("/login", checkNotAuthenticated, (req, res) => {
    res.render("login.ejs");
});

app.post(
    "/login",
    checkNotAuthenticated,
    passport.authenticate("local", {
        successRedirect: "/",
        failureRedirect: "/login",
        failureFlash: true,
    })
);

app.get("/register", checkNotAuthenticated, (req, res) => {
    res.render("register.ejs");
});

app.post("/register", checkNotAuthenticated, async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        db.open();
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
        res.redirect("/login");
    } catch (e) {
        // res.send("Error");
        console.log("Error while registering");
        res.redirect("/register");
    }
});

app.delete("/logout", function (req, res, next) {
    req.logOut(function (err) {
        if (err) {
            return next(err);
        }
        res.redirect("/login");
    });
});

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        console.log("User is already logged in");
        return next();
    }

    res.redirect("/login");
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        console.log("User is already logged in");
        return res.redirect("/");
    }
    next();
}

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
