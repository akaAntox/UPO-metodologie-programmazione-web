const express = require("express");
const router = express.Router();

// url-encoded body parser
router.use(express.urlencoded({ extended: false }));

router.get("/", (req, res) => {
  console.log(req.query.name);
  res.send("User List");
});

router.get("/login", (req, res) => {
  res.render("users/login");
});

router.post("/login", (req, res) => {
  res.send("Login");
});

router.get("/register", (req, res) => {
  res.render("users/register");
});

router.post("/register", (req, res) => {
  console.log(req.body);
  res.send("User Registered");
});

router.post("/", (req, res) => {
  const isValid = false;
  if (isValid) {
    console.log("Valid user");
    users.push({ firstName: req.body.firstName });
    // users.push(req.body);
    res.redirect(`/users/${users.length - 1}`);
  } else {
    console.log("Invalid user");
    res.render("users/register", {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      error: "Invalid user",
    });
  }
});

router
  .route("/:id")
  .get((req, res) => {
    res.send(`Get user ${req.params.id}`);
  })
  .put((req, res) => {
    res.send(`Update user ${req.params.id}`);
  })
  .delete((req, res) => {
    res.send(`Delete user ${req.params.id}`);
  });

const users = [{ name: "John" }, { name: "Jane" }];
router.param("id", (req, res, next, id) => {
  req.user = users[id];
  next();
});

module.exports = router;
