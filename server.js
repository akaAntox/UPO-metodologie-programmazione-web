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
const path = require('path');
app.use('/css', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')));
app.use('/js', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')));
app.use('/js', express.static(path.join(__dirname, 'node_modules/jquery/dist')));

app.get("/", checkAuthenticated, (req, res) => {
    res.render("index.ejs", { name: req.user.first_name });
});

app.post("/", checkAuthenticated, (req, res) => {
    try {
        db.open();
        db.addNewRequest(req.user.ID, req.body.content, req.body.location, req.body.address, req.body.latitude, req.body.longitude);
        db.close();
        res.render("index.ejs", { name: req.user.first_name, success: "La tua richiesta verrà presa in carico prima possibile." });
    } catch (e) {
        console.log(`Error while adding request: ${e}`);
        db.close();
        res.render("index.ejs", { name: req.user.first_name, error: "Errore nell'aggiunta della richiesta" });
    }
});

app.get("/login", checkNotAuthenticated, (_req, res) => {
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

app.get("/register", checkNotAuthenticated, (_req, res) => {
    res.render("register.ejs");
});

app.post("/register", checkNotAuthenticated, async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        db.open();
        db.addNewUser(
            // add new user to database
            [req.body.firstName,
            req.body.lastName,
            req.body.gender,
            req.body.birthDate,
            req.body.city,
            req.body.province,
            req.body.email,
            hashedPassword]
        );
        db.close();
        res.redirect("/login");
    } catch (e) {
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

app.get("/profile", checkAuthenticated, (req, res) => {
    res.render("profile.ejs", {
        cf: req.user.CF,
        name: req.user.first_name,
        surname: req.user.last_name,
        city: req.user.city,
        email: req.user.email
    });
});

app.post("/profile", checkAuthenticated, async (req, res) => {
    try {
        db.open();
        db.updateUser(req.user.ID, req.body.firstName, req.body.lastName, req.body.city);
        db.close();
        res.render("profile.ejs", {
            cf: req.user.CF,
            name: req.body.firstName,
            surname: req.body.lastName,
            city: req.body.city,
            email: req.user.email,
            success: "Profilo aggiornato con successo"
        });
    } catch (e) {
        console.log(`Error while updating profile: ${e}`);
        res.render("profile.ejs", { name: req.user.first_name, error: "Aggiornamento profilo fallito" });
    }
});

app.get("/profile/requests", checkAuthenticated, async (req, res) => {
    db.open();
    const requests = await db.getRequestsByUserID(req.user.ID);
    db.close();
    res.render("requests.ejs", {
        requests: requests        
    })
});

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/login");
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect("/");
    }
    next();
}

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
