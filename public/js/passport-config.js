const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const { checkRole } = require("./jwt");

const DataBase = require("./db"); // db.js
const db = new DataBase(); // create new database

function initialize(passport, getUserByEmail, getUserByID, generateToken) {
    const authenticateUser = async (email, password, done) => {
        try {
            const user = await getUserByEmail(email);
            if (user == null) {
                return done(user, false, {
                    message: "Incorrect email or password.", // wrong email
                });
            }

            const isValidPassword = await bcrypt.compare(
                password,
                user.password
            );

            if (isValidPassword) {
                if(!checkRole(user.ID))
                {
                    db.open();
                    await db.addTokenToUser(user.ID, generateToken(user.ID));
                    db.close();
                }
                return done(null, user);
            } else {
                return done(null, false, {
                    message: "Incorrect email or password.", // wrong password
                });
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
    passport.deserializeUser(async (id, done) => {
        const user = await getUserByID(id);
        return done(null, user);
    });
}

module.exports = initialize;
