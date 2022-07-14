/* TODO LIST
/ Add confirm password functionality
/ Add forgot password functionality (simple change password)
/ Add search request by filters (city / status / date)
/ Add error status for all pages
/ Add ENUM to request status
/ Add JWT token to user (admin functionalities)
/ Add showRequests, getPendingRequests
/ Add JWT token to user (user functionalities) - almost done
/ Add header to all pages except login/register
/ Add GUI to all pages except login/register
*/

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
const jwt = require("jsonwebtoken"); // generate tokens

const DataBase = require("./db"); // db.js
const db = new DataBase(); // create new database

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
app.use(methodOverride("_method")); // override POST method (delete/put)

// static paths
const path = require('path');
app.use(express.static('public')); // public folder serves static files (css, js, images)

app.use('/css', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')));
app.use('/icons', express.static(path.join(__dirname, 'node_modules/bootstrap-icons/icons')));
app.use('/js', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')));
app.use('/js', express.static(path.join(__dirname, 'node_modules/jquery/dist')));

// HOME PAGE ////////////////////////////////////////////////////////////////////////////////////////////////
app.get("/", checkAuthenticated, async (req, res) => {
    try {
        db.open();
        const requests = await db.getRequests("ORDER BY date DESC LIMIT 5");
        db.close();
        res.render("index.ejs", { name: req.user.first_name, requests: requests });
    } catch (e) {
        console.log(`Error while showing requests: ${e}`);
        db.close();
        res.render("index.ejs", { name: req.user.first_name, requests: [], error: "Impossibile mostrare le richieste" });
    }
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

app.get("/admin", checkAuthenticated, async (req, res) => {
    try {
        db.open();
        const requests = await db.getRequests("WHERE status=1 ORDER BY date ASC");
        db.close();
        res.render("admin/admin_index.ejs", { name: req.user.first_name, requests: requests });
    } catch (e) {
        console.log(`Error while showing requests: ${e}`);
        db.close();
        res.render("admin/admin_index.ejs", { name: req.user.first_name, requests: [], error: "Impossibile mostrare le richieste" });
    }
});

// AUTHENTICATION ////////////////////////////////////////////////////////////////////////////////////////////////
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
    // (req, res) => {
    //     const accessToken = generateAccessToken(req.user);
    //     const refreshToken = jwt.sign(req.user, process.env.REFRESH_JWT_TOKEN_KEY);
    // }
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
        db.close();
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

// ROUTES ////////////////////////////////////////////////////////////////////////////////////////////////
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
        db.close();
        res.render("profile.ejs", { name: req.user.first_name, error: "Aggiornamento profilo fallito" });
    }
});

app.get("/requests", checkAuthenticated, async (req, res) => {
    try {
        db.open();
        const requests = await db.getRequestsByUserID(req.user.ID, "ORDER BY date DESC");
        db.close();
        res.render("requests.ejs", { requests: requests, name: req.user.first_name, surname: req.user.last_name });
    } catch (e) {
        console.log(`Error while showing requests: ${e}`);
        db.close();
        // res.render("profile.ejs", { name: req.user.first_name, error: "Impossibile mostrare le richieste" });
        prevURL = req.header('Referer') || '/';
        res.redirect(prevURL);
    }
});

app.delete("/requests/:requestID", (req, res) => {
    try {
        db.open();
        db.setRequestStatus(req.params.requestID, 4);
        db.close();
        prevURL = req.header('Referer') || '/';
        res.status(200).redirect(prevURL);
    } catch (e) {
        console.log(`Error while canceling request: ${e}`);
        db.close();
        prevURL = req.header('Referer') || '/';
        res.status(400).redirect(prevURL);
    }
});

app.route("/admin/requests/:requestID")
    .delete(checkAuthenticated, async (req, res) => {
        try {
            db.open();
            await db.setRequestStatus(req.body.id, 3);
            const requests = await db.getRequests("WHERE status=1 ORDER BY date ASC");
            db.close();
            res.render("admin/admin_index.ejs", { name: req.user.first_name, success: "La richiesta è stata rifiutata", requests: requests});
        } catch (e) {
            console.log(`Error while rejecting request: ${e}`);
            const requests = await db.getRequests("WHERE status=1 ORDER BY date ASC");
            db.close();
            res.render("admin/admin_index.ejs", { name: req.user.first_name, error: "Errore nella cancellazione della richiesta", requests: requests });
        }
    })
    .put(checkAuthenticated, async (req, res) => {
        try {
            db.open();
            await db.setRequestStatus(req.body.id, 2);
            const requests = await db.getRequests("WHERE status=1 ORDER BY date ASC");
            db.close();
            res.render("admin/admin_index.ejs", { name: req.user.first_name, success: "La richiesta è stata accettata", requests: requests });
        } catch (e) {
            console.log(`Error while accepting request: ${e}`);
            const requests = await db.getRequests("WHERE status=1 ORDER BY date ASC");
            db.close();
            res.render("admin/admin_index.ejs", { name: req.user.first_name, error: "Errore nell'accettare la richiesta", requests: requests });
        }
    });

// AUTHENTICATION MIDDLEWARE ////////////////////////////////////////////////////////////////////////////////////////////////
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

// JWT TOKEN ////////////////////////////////////////////////////////////////////////////////////////////////
function generateAccessToken(user) {
    return jwt.sign(user, process.env.JWT_TOKEN_KEY, { expiresIn: "1h" });
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.ACCESS_JWT_TOKEN, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
