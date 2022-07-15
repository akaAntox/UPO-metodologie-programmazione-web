const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");

function initialize(passport, getUserByEmail, getUserByID) {
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
