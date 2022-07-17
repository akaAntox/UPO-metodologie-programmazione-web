const express = require("express");
const router = express.Router();

const passport = require("passport");  // passport
const session = require('express-session');
const flash = require("express-flash");
const morgan = require("morgan");
const { checkAuthenticated } = require("../public/js/check-auth");

router.use(express.urlencoded({ extended: false })); // url-encoded body parser
router.use(express.json()); // json will be parsed automatically in req.body object
router.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
    })
);
router.use(flash());
router.use(passport.initialize());
router.use(passport.session());
router.use(morgan("tiny")); // request a logger middleware to log requests

const DataBase = require("../public/js/db"); // db.js
const db = new DataBase(); // create new database

router.get("/", checkAuthenticated, (req, res) => {
    res.render("profile.ejs", {
        cf: req.user.CF,
        name: req.user.first_name,
        surname: req.user.last_name,
        city: req.user.city,
        email: req.user.email,
        myProfile: true
    });
});

router.post("/", checkAuthenticated, async (req, res) => {
    try {
        db.updateUser(req.user.ID, req.body.firstName, req.body.lastName, req.body.city);

        req.flash("success", "Profilo aggiornato con successo");
        res.render("profile.ejs", {
            cf: req.user.CF,
            name: req.body.firstName,
            surname: req.body.lastName,
            city: req.body.city,
            email: req.user.email,
            myProfile: true
        });
    } catch (e) {
        console.log(`Error while updating profile: ${e}`);
        req.flash("error", "Impossibile aggiornare il profilo");
        res.render("profile.ejs", { name: req.user.first_name });
    }
});

router.get("/:userID", checkAuthenticated, async (req, res) => {
    try {
        const user = await db.findUserByID(req.params.userID);
        res.render("profile.ejs", {
            cf: user.CF,
            name: user.first_name,
            surname: user.last_name,
            city: user.city,
            email: user.email,
            myProfile: false
        });
    } catch (e) {
        console.log(`Error while showing profile: ${e}`);
        req.flash("error", "Impossibile mostrare il profilo");
        const prevURL = req.header('Referer') || '/';
        res.redirect(prevURL);
    }
});

module.exports = router;