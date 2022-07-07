const sqlite3 = require("sqlite3").verbose();
let db;

class DataBase {
    constructor() {
        this.open();
    }

    open() {
        db = new sqlite3.Database("./112.db", sqlite3.OPEN_READWRITE, (err) => {
            if (err) return console.error(err.message);
            console.log("Connected to the database.");
        });
    }

    close() {
        db.close((err) => {
            if (err) return console.error(err.message);
            console.log("Close the database connection.");
        });
    }

    addNewUser(cf, firstName, lastName, city, email, password) {
        const sql = `INSERT INTO Users(cf, first_name, last_name, city, email, password)
                VALUES(?, ?, ?, ?, ?, ?)`;
        return new Promise((resolve, reject) => {
            db.run(
                sql,
                [cf, firstName, lastName, city, email, password],
                (err, row) => {
                    if (err) return reject(err);
                    resolve(row);
                }
            );
        });
    }

    findUserByEmail(email) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM Users WHERE email = ?`;
            db.get(sql, [email], (err, row) => {
                if (err) return reject("Read error: " + err.message);
                console.log(row);
                resolve(row);
            });
        });
    }

    findUserByID(id) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM Users WHERE ID = ?`;
            db.get(sql, [id], (err, row) => {
                if (err) return reject("Read error: " + err.message);
                console.log(row);
                resolve(row);
            });
        });
    }
}

// query data
// const sql = `SELECT * FROM users`;
// db.all(sql, [], (err, rows) => {
//   if (err) return console.error(err.message);
//   rows.forEach((row) => {
//     console.log(row);
//   });
// });

module.exports = DataBase;
