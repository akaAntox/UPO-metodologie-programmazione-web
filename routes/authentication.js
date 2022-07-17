const express = require("express");
const router = express.Router();

const methodOverride = require("method-override"); // override POST method (delete)
const bcrypt = require("bcrypt"); // hash passwords
const flash = require("express-flash");
const passport = require("passport");  // passport
const morgan = require("morgan");
const { checkNotAuthenticated } = require("../public/js/check-auth");
const { generateAccessToken } = require("../public/js/jwt");

router.use(flash());
router.use(passport.initialize());
router.use(passport.session());
router.use(morgan("tiny")); // request a logger middleware to log requests
router.use(methodOverride("_method")); // override POST method (delete/put)

const DataBase = require("../public/js/db"); // db.js
const db = new DataBase(); // create new database

const initializePassport = require("../public/js/passport-config");
initializePassport(
    passport,
    (email) => {
        try {
            return db.findUserByEmail(email);
        } catch (e) {
            console.log(`Error while logging in: ${e}`);
            return null;
        }
    },
    (id) => {
        try {
            return db.findUserByID(id);
        } catch (e) {
            console.log(`Error while logging in: ${e}`);
            return null;
        }
    },
    generateAccessToken
);

router.get("/login", checkNotAuthenticated, (_req, res) => {
    res.render("login.ejs");
});

router.post(
    "/login",
    checkNotAuthenticated,
    passport.authenticate("local", {
        successRedirect: "/",
        failureRedirect: "/login",
        failureFlash: true,
    })
);

router.get("/login/forgot-password", checkNotAuthenticated, (_req, res) => {
    res.render("forgot-password.ejs");
});

router.post("/login/forgot-password", checkNotAuthenticated, async (req, res) => {
    try {
        if (req.body.password !== req.body.confirmPassword) {
            req.flash("error", "Le password non corrispondono");
            res.render("forgot-password.ejs");
            return;
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        await db.changeUserPassword(req.body.email, hashedPassword);
        
        req.flash("success", "La tua password è stata cambiata con successo");
        res.redirect("/login");
    } catch (e) {
        console.log(`Error while changing password: ${e}`);
        req.flash("error", "Impossibile cambiare la password");
        res.render("forgot-password.ejs");
    }
});

router.get("/register", checkNotAuthenticated, (_req, res) => {
    res.render("register.ejs");
});

router.post("/register", checkNotAuthenticated, async (req, res) => {
    try {
        if (req.body.password !== req.body.confirmPassword) {
            req.flash("error", "Le password non corrispondono");
            res.render("register.ejs");
            return;
        }

        if (await db.findUserByEmail(req.body.email)) {
            req.flash("error", "L'email è già in uso");
            res.render("register.ejs");
            return;
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        await db.addNewUser(
            [
                req.body.firstName,
                req.body.lastName,
                req.body.gender,
                req.body.birthDate,
                req.body.city,
                req.body.province,
                req.body.email,
                hashedPassword
            ]
        );

        const userFound = await db.findUserByEmail(req.body.email);
        await db.addTokenToUser(userFound.ID, generateAccessToken(userFound.ID));

        req.flash("success", "Registrazione avvenuta con successo");
        res.redirect("/login");
    } catch (e) {
        console.log("Error while registering: " + e);
        req.flash("error", "Impossibile registrare l'utente");
        res.redirect("/register");
    }
});

router.delete("/logout", function (req, res, next) {
    req.logOut(function (err) {
        if (err) {
            return next(err);
        }
        req.flash("success", "Logout effettuato con successo");
        res.redirect("/login");
    });
});

module.exports = router;