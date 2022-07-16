const { checkRole } = require("./jwt"); // check if user is admin

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

function checkIsAdmin(req, res, next) {
    if (checkRole(req.user.ID)) {
        return res.redirect("/admin");
    }
    next();
}

function checkIsNotAdmin(req, res, next) {
    if (checkRole(req.user.ID)) {
        return next();
    }
    res.redirect("/");
}

module.exports = { checkAuthenticated, checkNotAuthenticated, checkIsAdmin, checkIsNotAdmin };