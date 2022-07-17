const express = require("express");
const router = express.Router();

const flash = require("express-flash");
const morgan = require("morgan");
const { checkAuthenticated } = require("../public/js/check-auth");

router.use(flash());
router.use(morgan("tiny")); // request a logger middleware to log requests

const DataBase = require("../public/js/db"); // db.js
const db = new DataBase(); // create new database

router.get("/", checkAuthenticated, (req, res) => {
    res.render("profile.ejs", {
        cf: req.user.CF,
        name: req.user.first_name,
        surname: req.user.last_name,
        city: req.user.city,
        email: req.user.email
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
            email: req.user.email
        });
    } catch (e) {
        console.log(`Error while updating profile: ${e}`);
        req.flash("error", "Impossibile aggiornare il profilo");
        res.render("profile.ejs", { name: req.user.first_name });
    }
});

module.exports = router;