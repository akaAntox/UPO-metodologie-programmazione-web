const express = require("express");
const morgan = require("morgan");
const sqlite = require("sqlite3").verbose();

const app = express();
const port = 3000;

const db = new sqlite.Database("112.db", (err) => {
  if (err) return console.error(err.message);
  console.log("Connected to the database.");
});

// public folder will be served as static files
app.use(express.static("public"));
// json will be parsed automatically in req.body
app.use(express.json());
// request a logger middleware
app.use(morgan("tiny"));

app.set("view engine", "ejs");

app.get("/", (req, res) => {
  console.log("Here");
  res.render("index");
});

const userRouter = require("./routes/users");

app.use("/users", userRouter);

// db.close((err) => {
//   if (err) return console.error(err.message);
//   console.log("Close the database connection.");
// })

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
