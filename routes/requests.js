const express = require("express");
const router = express.Router();

const methodOverride = require("method-override"); // override POST method (delete)
const flash = require("express-flash");
const morgan = require("morgan");
const STATUS = require("../public/js/status"); // import status
const { checkAuthenticated, checkIsNotAdmin } = require("../public/js/check-auth");

router.use(methodOverride("_method")); // override POST method (delete/put)
router.use(flash());
router.use(morgan("tiny")); // request a logger middleware to log requests

const DataBase = require("../public/js/db"); // db.js
const db = new DataBase(); // create new database

router.get("/", checkAuthenticated, checkIsNotAdmin, async (req, res) => {
    try {
        db.open();
        const requests = await db.getRequestsByUserID(req.user.ID, "ORDER BY date DESC");
        db.close();
        res.render("requests.ejs", { requests: requests, name: req.user.first_name, status: STATUS });
    } catch (e) {
        console.log(`Error while showing requests: ${e}`);
        db.close();
        req.flash("error", "Impossibile mostrare le richieste");
        prevURL = req.header('Referer') || '/';
        res.redirect(prevURL);
    }
});

router.delete("/:requestID", checkAuthenticated, checkIsNotAdmin, (req, res) => {
    try {
        db.open();
        db.setRequestStatus(req.params.requestID, 4);
        db.close();
        req.flash("success", "Richiesta annullata con successo");
        prevURL = req.header('Referer') || '/';
        res.status(200).redirect(prevURL);
    } catch (e) {
        console.log(`Error while canceling request: ${e}`);
        db.close();
        req.flash("error", "Impossibile annullare la richiesta");
        prevURL = req.header('Referer') || '/';
        res.status(400).redirect(prevURL);
    }
});

module.exports = router;