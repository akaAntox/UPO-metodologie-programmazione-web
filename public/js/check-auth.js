const { isAdmin } = require("./jwt"); // check if user is admin

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
    if (isAdmin(req.user.token)) {
        return res.redirect("/admin");
    }
    next();
}

function checkIsNotAdmin(req, res, next) {
    if (isAdmin(req.user.token)) {
        return next();
    }
    req.flash("error", "Non hai i permessi per andare su quella pagina");
    prevURL = req.header('Referer') || '/';
    res.status(200).redirect(prevURL);
}

module.exports = { checkAuthenticated, checkNotAuthenticated, checkIsAdmin, checkIsNotAdmin };