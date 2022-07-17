/* TODO LIST
/ Add error status for all pages (404, 500, etc)
/ Add GUI to all pages
*/

if (process.env.NODE_ENV !== "production") {
    require("dotenv").config(); // load .env file
}

const express = require("express"); // import express
const morgan = require("morgan"); // log requests to console
const flash = require("express-flash"); // flash messages
const session = require("express-session"); // session middleware
const methodOverride = require("method-override"); // override POST method (delete)
const passport = require("passport");  // passport
const STATUS = require("./public/js/status"); // import status
const { checkAuthenticated, checkIsAdmin } = require("./public/js/check-auth"); // check if user is authenticated

const DataBase = require("./public/js/db"); // db.js
const db = new DataBase(); // create new database

const app = express();
const port = 3000;

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
app.use(methodOverride("_method")); // override POST method (delete/put)

// static paths
const path = require('path');
app.use(express.static('public')); // public folder serves static files (css, js, images)

app.use('/css', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')));
app.use('/icons', express.static(path.join(__dirname, 'node_modules/bootstrap-icons/icons')));
app.use('/js', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')));
app.use('/js', express.static(path.join(__dirname, 'node_modules/jquery/dist')));

app.get("/", checkAuthenticated, checkIsAdmin, async (req, res) => {
    try {
        const requests = await db.getRequestsByUserID(req.user.ID, "ORDER BY date DESC LIMIT 5");
        res.status(302).render("index.ejs", { name: req.user.first_name, requests: requests, status: STATUS });
    } catch (e) {
        console.log(`Error while showing requests: ${e}`);
        req.flash("error", "Impossibile mostrare le richieste");
        res.status(400).res.render("index.ejs", { name: req.user.first_name, requests: [], status: STATUS });
    }
});

app.post("/", checkAuthenticated, checkIsAdmin, async (req, res) => {
    try {
        await db.addNewRequest(req.user.ID, req.body.content, req.body.location, req.body.address, req.body.latitude, req.body.longitude);
        const requests = await db.getRequestsByUserID(req.user.ID, "ORDER BY date DESC LIMIT 5");
        req.flash("success", "La tua richiesta verrà presa in carico prima possibile.");
        res.render("index.ejs", { name: req.user.first_name, requests: requests, status: STATUS });
    } catch (e) {
        console.log(`Error while adding request: ${e}`);
        req.flash("error", "Impossibile spedire la richiesta");
        res.render("index.ejs", { name: req.user.first_name, requests: [], status: STATUS });
    }
});

app.delete("/admin/:requestID", checkAuthenticated, (req, res) => {
    try {
        db.setRequestStatus(req.params.requestID, 3);
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

app.put("/admin/:requestID", checkAuthenticated, (req, res) => {
    try {
        db.setRequestStatus(req.params.requestID, 2);
        req.flash("success", "Richiesta accettata con successo");
        const prevURL = req.header('Referer') || '/';
        res.status(200).redirect(prevURL);
    } catch (e) {
        console.log(`Error while accepting request: ${e}`);
        req.flash("error", "Impossibile accettare la richiesta");
        const prevURL = req.header('Referer') || '/';
        res.status(200).redirect(prevURL);
    }
});

const authRoutes = require("./routes/authentication");
app.use("/", authRoutes);

const adminRoutes = require("./routes/admin");
app.use("/admin", adminRoutes);

const profileRoutes = require("./routes/profile");
app.use("/profile", profileRoutes);

const requestsRoutes = require("./routes/requests");
app.use("/requests", requestsRoutes);

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
