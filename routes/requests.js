if (process.env.NODE_ENV !== "production") {
    require("dotenv").config(); // load .env file
}

const express = require("express");
const router = express.Router();

const methodOverride = require("method-override"); // override POST method (delete)
const session = require('express-session');
const flash = require("express-flash");
const passport = require("passport");  // passport
const morgan = require("morgan");
const STATUS = require("../public/js/status"); // import status
const { checkAuthenticated } = require("../public/js/check-auth");

router.use(express.urlencoded({ extended: false })); // url-encoded body parser
router.use(express.json()); // json will be parsed automatically in req.body object
router.use(methodOverride("_method")); // override POST method (delete/put)
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

router.get("/", checkAuthenticated, async (req, res) => {
    try {        
        const requests = await db.getRequestsByUserID(req.user.ID, "ORDER BY date DESC");
        res.render("requests.ejs", { requests: requests, name: req.user.first_name, status: STATUS });
    } catch (e) {
        console.log(`Error while showing requests: ${e}`);
        req.flash("error", "Impossibile mostrare le richieste");
        const prevURL = req.header('Referer') || '/';
        res.redirect(prevURL);
    }
});

router.delete("/:requestID", checkAuthenticated, async (req, res) => {
    try {
        await db.setRequestStatus(req.params.requestID, 4);
        req.flash("success", "Richiesta annullata con successo");
        const prevURL = req.header('Referer') || '/';
        res.status(200).redirect(prevURL);
    } catch (e) {
        console.log(`Error while canceling request: ${e}`);
        req.flash("error", "Impossibile annullare la richiesta");
        const prevURL = req.header('Referer') || '/';
        res.status(400).redirect(prevURL);
    }
});

module.exports = router;