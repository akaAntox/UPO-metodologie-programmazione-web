const express = require("express"); // import express
const morgan = require("morgan"); // log requests
const userRouter = require("./routes/users"); // import userRouter

const app = express();
const port = 3000;

// app.use(express.static("public")); // public folder will be served as static files
app.use(express.json()); // json will be parsed automatically in req.body object
app.use(morgan("tiny")); // request a logger middleware to log requests

app.set("view engine", "ejs");

app.get("/", (req, res) => {
    // home page
    res.render("index.ejs", { name: req.user.name });
});

app.use("/users", userRouter);

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
