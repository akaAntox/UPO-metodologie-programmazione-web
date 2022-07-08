[1mdiff --git a/../Nodejs-Passport-Login-master/server.js b/./server.js[m
[1mindex e512129..460bd1f 100755[m
[1m--- a/../Nodejs-Passport-Login-master/server.js[m
[1m+++ b/./server.js[m
[36m@@ -1,29 +1,53 @@[m
 if (process.env.NODE_ENV !== "production") {[m
[31m-    require("dotenv").config();[m
[32m+[m[32m    require("dotenv").config(); // load .env file[m
 }[m
 [m
[31m-const express = require("express");[m
[31m-const app = express();[m
[31m-const bcrypt = require("bcrypt");[m
[31m-const passport = require("passport");[m
[31m-const flash = require("express-flash");[m
[31m-const session = require("express-session");[m
[31m-const methodOverride = require("method-override");[m
[32m+[m[32mconst express = require("express"); // import express[m
 const morgan = require("morgan"); // log requests[m
[32m+[m[32mconst bcrypt = require("bcrypt"); // hash passwords[m
[32m+[m[32mconst passport = require("passport"); // passport-config.js[m
[32m+[m[32mconst flash = require("express-flash"); // flash messages[m
[32m+[m[32mconst session = require("express-session"); // session middleware[m
[32m+[m[32mconst DataBase = require("./db"); // db.js[m
[32m+[m
[32m+[m[32mconst app = express();[m
[32m+[m[32mconst port = 3000;[m
 [m
 const initializePassport = require("./passport-config");[m
 initializePassport([m
     passport,[m
[31m-    (email) => users.find((user) => user.email === email),[m
[31m-    (id) => users.find((user) => user.id === id)[m
[32m+[m[32m    (email) => {[m
[32m+[m[32m        const db = new DataBase();[m
[32m+[m[32m        try {[m
[32m+[m[32m            let userFound = db.findUserByEmail(email);[m
[32m+[m[32m            db.close();[m
[32m+[m[32m            return userFound;[m
[32m+[m[32m        } catch (e) {[m
[32m+[m[32m            console.log(`Error while logging in: ${e}`);[m
[32m+[m[32m            db.close();[m
[32m+[m[32m            return null;[m
[32m+[m[32m        }[m
[32m+[m[32m    },[m
[32m+[m[32m    (id) => {[m
[32m+[m[32m        const db = new DataBase();[m
[32m+[m[32m        try {[m
[32m+[m[32m            let userFound = db.findUserByID(id);[m
[32m+[m[32m            db.close();[m
[32m+[m[32m            return userFound;[m
[32m+[m[32m        } catch (e) {[m
[32m+[m[32m            console.log(`Error while logging in: ${e}`);[m
[32m+[m[32m            db.close();[m
[32m+[m[32m            return null;[m
[32m+[m[32m        }[m
[32m+[m[32m    }[m
 );[m
 [m
[31m-const users = [];[m
[32m+[m[32mapp.set("view engine", "ejs");[m
 [m
[31m-app.set("view-engine", "ejs");[m
[31m-app.use(express.urlencoded({ extended: false }));[m
[32m+[m[32mapp.use(express.urlencoded({ extended: false })); // url-encoded body parser[m
[32m+[m[32m// app.use(express.json()); // json will be parsed automatically in req.body object[m
 app.use(morgan("tiny")); // request a logger middleware to log requests[m
[31m-app.use(flash());[m
[32m+[m[32mapp.use(flash()); // flash messages middleware[m
 app.use([m
     session({[m
         secret: process.env.SESSION_SECRET,[m
[36m@@ -33,7 +57,6 @@[m [mapp.use([m
 );[m
 app.use(passport.initialize());[m
 app.use(passport.session());[m
[31m-app.use(methodOverride("_method"));[m
 [m
 app.get("/", checkAuthenticated, (req, res) => {[m
     res.render("index.ejs", { name: req.user.name });[m
[36m@@ -59,24 +82,26 @@[m [mapp.get("/register", checkNotAuthenticated, (req, res) => {[m
 [m
 app.post("/register", checkNotAuthenticated, async (req, res) => {[m
     try {[m
[32m+[m[32m        const db = new DataBase();[m
         const hashedPassword = await bcrypt.hash(req.body.password, 10);[m
[31m-        users.push({[m
[31m-            id: Date.now().toString(),[m
[31m-            name: req.body.name,[m
[31m-            email: req.body.email,[m
[31m-            password: hashedPassword,[m
[31m-        });[m
[32m+[m[32m        db.addNewUser([m
[32m+[m[32m            // add new user to database[m
[32m+[m[32m            req.body.codiceFiscale,[m
[32m+[m[32m            req.body.firstName,[m
[32m+[m[32m            req.body.lastName,[m
[32m+[m[32m            req.body.city,[m
[32m+[m[32m            req.body.email,[m
[32m+[m[32m            hashedPassword[m
[32m+[m[32m        );[m
[32m+[m[32m        db.close();[m
         res.redirect("/login");[m
[31m-    } catch {[m
[32m+[m[32m    } catch (e) {[m
[32m+[m[32m        // res.send("Error");[m
[32m+[m[32m        console.log("Error while registering");[m
         res.redirect("/register");[m
     }[m
 });[m
 [m
[31m-app.delete("/logout", (req, res) => {[m
[31m-    req.logOut();[m
[31m-    res.redirect("/login");[m
[31m-});[m
[31m-[m
 function checkAuthenticated(req, res, next) {[m
     if (req.isAuthenticated()) {[m
         return next();[m
[36m@@ -92,4 +117,41 @@[m [mfunction checkNotAuthenticated(req, res, next) {[m
     next();[m
 }[m
 [m
[31m-app.listen(3000);[m
[32m+[m[32mapp.listen(port, () => {[m
[32m+[m[32m    console.log(`Server running on http://localhost:${port}`);[m
[32m+[m[32m});[m
[32m+[m
[32m+[m[32m// app.post("/", (req, res) => {[m
[32m+[m[32m//     const isValid = false;[m
[32m+[m[32m//     if (isValid) {[m
[32m+[m[32m//         console.log("Valid user");[m
[32m+[m[32m//         users.push({ firstName: req.body.firstName });[m
[32m+[m[32m//         // users.push(req.body);[m
[32m+[m[32m//         res.redirect(`/${users.length - 1}`);[m
[32m+[m[32m//     } else {[m
[32m+[m[32m//         console.log("Invalid user");[m
[32m+[m[32m//         res.render("register", {[m
[32m+[m[32m//             firstName: req.body.firstName,[m
[32m+[m[32m//             lastName: req.body.lastName,[m
[32m+[m[32m//             error: "Invalid user",[m
[32m+[m[32m//         });[m
[32m+[m[32m//     }[m
[32m+[m[32m// });[m
[32m+[m
[32m+[m[32m// app[m
[32m+[m[32m//     .route("/:id") // /:id[m
[32m+[m[32m//     .get((req, res) => {[m
[32m+[m[32m//         res.send(`Get user ${req.params.id}`);[m
[32m+[m[32m//     })[m
[32m+[m[32m//     .put((req, res) => {[m
[32m+[m[32m//         res.send(`Update user ${req.params.id}`);[m
[32m+[m[32m//     })[m
[32m+[m[32m//     .delete((req, res) => {[m
[32m+[m[32m//         res.send(`Delete user ${req.params.id}`);[m
[32m+[m[32m//     });[m
[32m+[m
[32m+[m[32m// const users = [{ name: "John" }, { name: "Jane" }];[m
[32m+[m[32m// app.param("id", (req, res, next, id) => {[m
[32m+[m[32m//     req.user = users[id];[m
[32m+[m[32m//     next();[m
[32m+[m[32m// });[m
