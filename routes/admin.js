if (process.env.NODE_ENV !== "production") {
    require("dotenv").config(); // load .env file
}

const express = require("express");
const router = express.Router();

const methodOverride = require("method-override"); // override POST method (delete)
const session = require("express-session"); // session middleware
const flash = require("express-flash");
const passport = require("passport");  // passport
const morgan = require("morgan");
const STATUS = require("../public/js/status"); // import status
const { checkAuthenticated, checkIsNotAdmin } = require("../public/js/check-auth");

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

router.get("/", checkAuthenticated, checkIsNotAdmin, async (req, res) => {
    try {
        const requests = await db.getRequests("WHERE status=1 ORDER BY date DESC");
        res.render("admin_index.ejs", { name: req.user.first_name, requests: requests, status: STATUS });
    } catch (e) {
        console.log(`Error while showing requests: ${e}`);
        req.flash("error", "Impossibile mostrare le richieste");
        res.render("admin_index.ejs", { name: req.user.first_name, requests: [], status: STATUS });
    }
});

router.post("/", checkAuthenticated, checkIsNotAdmin, async (req, res) => {
    try {
        let filter = "";

        if (req.body.status && req.body.location && req.body.address)
            filter = `WHERE status=${req.body.status} AND location='${req.body.location}' AND address='${req.body.address}'`;
        else if (req.body.status && req.body.location)
            filter = `WHERE status=${req.body.status} AND location='${req.body.location}'`;
        else if (req.body.status && req.body.address)
            filter = `WHERE status=${req.body.status} AND address='${req.body.address}'`;
        else if (req.body.location && req.body.address)
            filter = `WHERE location='${req.body.location}' AND address='${req.body.address}'`;
        else if (req.body.status)
            filter = `WHERE status=${req.body.status}`;
        else if (req.body.location)
            filter = `WHERE location='${req.body.location}'`;
        else if (req.body.address)
            filter = `WHERE address='${req.body.address}'`;

        const requests = await db.getRequests(filter + " ORDER BY date DESC");
        res.render("admin_index.ejs", { name: req.user.first_name, requests: requests, status: STATUS });
    } catch (e) {
        console.log(`Error while updating request: ${e}`);
        req.flash("error", "Impossibile aggiornare la richiesta");
        res.render("admin_index.ejs", { name: req.user.first_name, requests: [], status: STATUS });
    }
});

router.delete("/:requestID", checkAuthenticated, async (req, res) => {
    try {
        await db.setRequestStatus(req.params.requestID, 3);
        req.flash("success", "Richiesta rifiutata con successo");
        const prevURL = req.header('Referer') || '/';
        res.status(200).redirect(prevURL);
    } catch (e) {
        console.log(`Error while rejecting request: ${e}`);
        req.flash("error", "Impossibile rifiutare la richiesta");
        const prevURL = req.header('Referer') || '/';
        res.status(400).redirect(prevURL);
    }
});

router.put("/:requestID", checkAuthenticated, async (req, res) => {
    try {
        await db.setRequestStatus(req.params.requestID, 2);
        req.flash("success", "Richiesta accettata con successo");
        const msg = req.flash("success");
        const prevURL = req.header('Referer') || '/';
        res.status(200).redirect(prevURL);
    } catch (e) {
        console.log(`Error while accepting request: ${e}`);
        req.flash("error", "Impossibile accettare la richiesta");
        const prevURL = req.header('Referer') || '/';
        res.status(400).redirect(prevURL);
    }
});

module.exports = router;