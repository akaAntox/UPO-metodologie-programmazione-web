const sqlite3 = require("sqlite3").verbose();
let db;

class DataBase {
    open() {
        db = new sqlite3.Database("./112.db", sqlite3.OPEN_READWRITE, (err) => {
            if (err) throw console.error(err.message);
        });
    }

    close() {
        db.close((err) => {
            if (err) throw console.error(err.message);
        });
    }

    /*
    0: firstName
    1: lastName
    2: gender
    3: birthDate
    4: city
    5: province
    6: email
    7: password
    */
    addNewUser(user) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO Users(cf, first_name, last_name, city, email, password)
                    VALUES(?, ?, ?, ?, ?, ?)`;

            const codice_fiscale = require("codicefiscalejs-node");
            const birth_date = user[3].split("-");
            const cf_computed = codice_fiscale.compute({
                nome: user[0],
                cognome: user[1],
                sesso: user[2].toUpperCase()[0],
                comune: user[4],
                provincia: user[5].toUpperCase(),
                giorno: parseInt(birth_date[2]),
                mese: parseInt(birth_date[1]),
                anno: parseInt(birth_date[0]),
            });

            this.open();
            db.run(
                sql,
                [cf_computed, user[0], user[1], user[4], user[6].toLowerCase(), user[7]],
                (err, row) => {
                    if (err) throw reject(err);
                    resolve(row);
                }
            );
            this.close();
        });
    }

    addTokenToUser(user_id, token) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE Users SET token = ? WHERE ID = ?`;

            this.open();
            db.run(sql, [token, user_id], (err, row) => {
                if (err) throw reject(err);
                resolve(row);
            });
            this.close();
        });
    }

    updateUser(id, firstName, lastName, city) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE Users SET first_name = ?, last_name = ?, city = ? WHERE ID = ?`;

            this.open();
            db.run(sql, [firstName, lastName, city, id], (err, row) => {
                if (err) throw reject(err);
                resolve(row);
            });
            this.close();
        });
    }

    changeUserPassword(email, password) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE Users SET password = ? WHERE email = ?`;

            this.open();
            db.run(sql, [password, email], (err, row) => {
                if (err) throw reject(err);
                resolve(row);
            });
            this.close();
        });
    }

    findUserByEmail(email) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM Users WHERE email = ?`;

            this.open();
            db.get(sql, [email], (err, row) => {
                if (err) throw reject(err);
                resolve(row);
            });
            this.close();
        });
    }

    findUserByID(id) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM Users WHERE ID = ?`;

            this.open();
            db.get(sql, [id], (err, row) => {
                if (err) throw reject(err);
                resolve(row);
            });
            this.close();
        });
    }

    addNewRequest(user_id, content, location, address, lat, long) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO Requests(user_ID, content, location, address, latitude, longitude, status, date) 
                    VALUES(?, ?, ?, ?, ?, ?, ?, ?)`;

            const date = String(new Date().toLocaleString("it-IT"));

            this.open();
            db.run(
                sql,
                [user_id, content, location, address, lat, long, 1, date],
                (err, row) => {
                    if (err) throw reject(err);
                    resolve(row);
                }
            );
            this.close();
        });
    }

    getRequestsByUserID(user_id, filter) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM Requests WHERE user_ID = ?` + filter;

            this.open();
            db.all(sql, [user_id], (err, rows) => {
                if (err) throw reject(err);
                resolve(rows);
            });
            this.close();
        });
    }

    getRequests(filter) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT Requests.ID AS requestID, Requests.content, Requests.location, Requests.address, Requests.latitude, Requests.longitude, Requests.status , Requests.date , Users.ID AS userID, Users.first_name, Users.last_name FROM Requests JOIN Users ON Requests.user_ID = Users.ID ` + filter;

            this.open();
            db.all(sql, [], (err, rows) => {
                if (err) throw reject(err);
                resolve(rows);
            });
            this.close();
        });
    }

    setRequestStatus(requestID, status) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE Requests SET status=? WHERE ID=?`;

            this.open();
            db.run(sql, [status, requestID], (err, rows) => {
                if (err) throw reject(err);
                resolve(rows);
            });
            this.close();
        });
    }
}

module.exports = DataBase;
