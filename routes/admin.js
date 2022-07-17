const express = require("express");
const router = express.Router();

const methodOverride = require("method-override"); // override POST method (delete)
const flash = require("express-flash");
const morgan = require("morgan");
const { checkAuthenticated, checkIsNotAdmin } = require("../public/js/check-auth");
const STATUS = require("../public/js/status"); // import status

const DataBase = require("../public/js/db"); // db.js
const db = new DataBase(); // create new database

router.get("/", checkAuthenticated, checkIsNotAdmin, async (req, res) => {
    try {
        const requests = await db.getRequests("WHERE status=1 ORDER BY date ASC");
        res.render("admin/admin_index.ejs", { name: req.user.first_name, requests: requests, status: STATUS });
    } catch (e) {
        console.log(`Error while showing requests: ${e}`);
        db.close();
        req.flash("error", "Impossibile mostrare le richieste");
        res.render("admin/admin_index.ejs", { name: req.user.first_name, requests: [], status: STATUS });
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

        const requests = await db.getRequests(filter + " ORDER BY date ASC");
        res.render("admin/admin_index.ejs", { name: req.user.first_name, requests: requests, status: STATUS });
    } catch (e) {
        console.log(`Error while updating request: ${e}`);
        db.close();
        req.flash("error", "Impossibile aggiornare la richiesta");
        res.render("admin/admin_index.ejs", { name: req.user.first_name, requests: [], status: STATUS });
    }
});

router.route("/requests/:requestID")
    .delete(checkAuthenticated, checkIsNotAdmin, async (req, res) => {
        try {
            await db.setRequestStatus(req.body.id, 3);
            const requests = await db.getRequests("WHERE status=1 ORDER BY date ASC");
            
            req.flash("success", "Richiesta rifiutata con successo");
            res.render("admin/admin_index.ejs", { name: req.user.first_name, requests: requests, status: STATUS });
        } catch (e) {
            console.log(`Error while rejecting request: ${e}`);
            const requests = await db.getRequests("WHERE status=1 ORDER BY date ASC");
            db.close();
            req.flash("error", "Impossibile rifiutare la richiesta");
            res.render("admin/admin_index.ejs", { name: req.user.first_name, requests: requests, status: STATUS });
        }
    })
    .put(checkAuthenticated, checkIsNotAdmin, async (req, res) => {
        try {
            await db.setRequestStatus(req.body.id, 2);
            const requests = await db.getRequests("WHERE status=1 ORDER BY date ASC");

            req.flash("success", "Richiesta accettata con successo");
            res.render("admin/admin_index.ejs", { name: req.user.first_name, requests: requests, status: STATUS });
        } catch (e) {
            console.log(`Error while accepting request: ${e}`);
            const requests = await db.getRequests("WHERE status=1 ORDER BY date ASC");
            db.close();
            req.flash("error", "Impossibile accettare la richiesta");
            res.render("admin/admin_index.ejs", { name: req.user.first_name, requests: requests, status: STATUS });
        }
    });

module.exports = router;