const sqlite3 = require("sqlite3").verbose();
let db;

class DataBase {
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

    addNewUser(firstName, lastName, gender, birthDate, city, province, email, password) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO Users(cf, first_name, last_name, city, email, password)
                    VALUES(?, ?, ?, ?, ?, ?)`;

            const codice_fiscale = require("codicefiscalejs-node");
            const birth_date = birthDate.split("-");
            const cf_computed = codice_fiscale.compute({
                nome: firstName,
                cognome: lastName,
                sesso: gender.toUpperCase()[0],
                comune: city,
                provincia: province.toUpperCase(),
                giorno: parseInt(birth_date[2]),
                mese: parseInt(birth_date[1]),
                anno: parseInt(birth_date[0]),
            });

            db.run(
                sql,
                [cf_computed, firstName, lastName, city, email, password],
                (err, row) => {
                    if (err) return reject(err);
                    resolve(row);
                }
            );
        });
    }

    updateUser(id, firstName, lastName, city) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE Users SET first_name = ?, last_name = ?, city = ? WHERE ID = ?`;
            db.run(sql, [firstName, lastName, city, id], (err, row) => {
                if (err) return reject("Read error: " + err.message);
                resolve(row);
            });
        });
    }

    findUserByEmail(email) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM Users WHERE email = ?`;
            db.get(sql, [email], (err, row) => {
                if (err) return reject("Read error: " + err.message);
                resolve(row);
            });
        });
    }

    findUserByID(id) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM Users WHERE ID = ?`;
            db.get(sql, [id], (err, row) => {
                if (err) return reject("Read error: " + err.message);
                resolve(row);
            });
        });
    }

    addNewRequest(user_id, content, location, address, lat, long) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO Requests(user_ID, content, location, address, latitude, longitude, status, date) 
                    VALUES(?, ?, ?, ?, ?, ?, ?, ?)`;

            var date = String(new Date().toLocaleString("it-IT"));

            db.run(
                sql,
                [user_id, content, location, address, lat, long, 1, date],
                (err, row) => {
                    if (err) return reject(err);
                    resolve(row);
                }
            );
        });
    }

    getRequestsByUserID(user_id) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM Requests WHERE user_ID = ?`;
            const rows = [];
            db.all(sql, [user_id], (err, row) => {
                if (err) return reject("Read error: " + err.message);
                row.forEach((row) => {
                    resolve(row);
                });
            });
        });
        // return new Promise((resolve, reject) => {
        //     const db = new sqlite3.Database(database);
        //     const queries = [];
        //     db.each(`SELECT rowid as key, * FROM ${table}`, (err, row) => {
        //         if (err) {
        //             reject(err); // optional: you might choose to swallow errors.
        //         } else {
        //             queries.push(row); // accumulate the data
        //         }
        //     }, (err, n) => {
        //         if (err) {
        //             reject(err); // optional: again, you might choose to swallow this error.
        //         } else {
        //             resolve(queries); // resolve the promise
        //         }
        //     });
        // });
    }
}

module.exports = DataBase;
