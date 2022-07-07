const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");

function initialize(passport) {
    const authenticateUser = async (email, password, done) => {
        try {
            const DataBase = require("./db"); // db.js
            const db = new DataBase();
            const user = await db.findUserByEmail(email);
            db.close();

            if (user == null) {
                return done(user, false, {
                    message: "No user with this email",
                });
            }
            try {
                const isValidPassword = await bcrypt.compare(
                    password,
                    user.password
                );
                if (isValidPassword) {
                    return done(null, user);
                } else {
                    return done(null, false, { message: "Invalid password" });
                }
            } catch (e) {
                return done(e);
            }
        } catch (e) {
            console.log(`Error while authenticating: ${e}`);
            done(e, false);
        }
    };

    passport.use(
        new LocalStrategy({ usernameField: "email" }, authenticateUser)
    );
    passport.serializeUser((user, done) => done(null, user.ID));
    passport.deserializeUser(
        (id, done) =>
            async function () {
                const DataBase = require("./db"); // db.js
                const db = new DataBase();
                const user = await db.findUserById(id);
                db.close();
                return done(null, user.firstName);
            }
    );
}

module.exports = initialize;
