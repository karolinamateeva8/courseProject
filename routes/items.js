let express = require("express");
let router = express.Router();
const fs = require("fs");

//Показване на Login форма
router.get("/login", function (req, res) {
  res.render("login", { info: "PLEASE LOGIN" });
});

//Създаване на сесия след успешен Login
session = require("express-session");
router.use(
  session({
    secret: "random string",
    resave: true,
    saveUninitialized: true,
  })
);

sqlite3 = require("sqlite3");
db = new sqlite3.Database("items.sqlitedb");
db.serialize();
db.run(`CREATE TABLE IF NOT EXISTS items(
    id INTEGER PRIMARY KEY,
    user TEXT NOT NULL,
    item TEXT,
    url TEXT,
    quantity INTEGER,
    date_created TEXT)`);
db.parallelize();

fileUpload = require("express-fileupload");
router.use(fileUpload());

bcrypt = require("bcryptjs");
users = require("./passwd.json");

router.post("/login", function (req, res) {
  bcrypt.compare(
    req.body.password,
    users[req.body.username] || "",
    function (err, is_match) {
      if (err) throw err;
      if (is_match === true) {
        req.session.username = req.body.username;
        req.session.count = 0;
        res.redirect("/items/");
      } else {
        res.render("login", { warn: "TRY AGAIN" });
      }
    }
  );
});

//Logout - унищожаване на сесия
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/items/");
});

router.all("*", function (req, res, next) {
  if (!req.session.username) {
    res.redirect("/items/login");
    return;
  }
  next();
});

router.get("/", async function (req, res, next) {
  //Async file reading
  var array;
  fs.readFile("info.txt", async function (err, data) {
    if (err) throw err;
    array = data.toString().split("\n");
    for (i in array) console.log(i + "\t" + array[i]);
  });

  req.session.count++;
  s =
    "User: " +
    req.session.username +
    " Count: " +
    req.session.count +
    " " +
    new Date() +
    array;

  db.all(
    "SELECT * FROM items ORDER BY date_created DESC;",
    function (err, rows) {
      if (err) throw err;
      res.render("items", { info: s, rows: rows });
    }
  );
});

//CREATErud + Picture upload
router.post("/upload", (req, res) => {
  url = "";
  if (req.files && req.files.file) {
    req.files.file.mv("./public/imagesdb/" + req.files.file.name, (err) => {
      if (err) throw err;
    });
    url = "/imagesdb/" + req.files.file.name;
  }

  db.run(
    `
        INSERT INTO items(
            user,
            item,
            url,
            quantity,
            date_created
        ) VALUES (
            ?,
            ?,
            ?,
            ?,
            DATETIME('now','localtime'));
        `,
    [req.session.username, req.body.item || "", url, req.body.quantity || 1],
    (err) => {
      if (err) throw err;
      res.redirect("/items/");
    }
  );
});

//cruDELETE
router.post("/delete", (req, res) => {
  db.run("DELETE FROM items WHERE id = ?", req.body.id, (err) => {
    if (err) throw err;
    res.redirect("/items/");
  });
});

//crUPDATEd
router.post("/update", (req, res) => {
  db.run(
    `UPDATE items
            SET user = ?,
                item = ?,
                url = ?,
                quantity = ?,
                date_created = DATETIME('now','localtime')
            WHERE id = ?;`,
    req.session.username,
    req.body.item,
    req.body.url,
    req.body.quantity,
    req.body.id,
    (err) => {
      if (err) throw err;
      res.redirect("/items/");
    }
  );
});

router.all("*", function (req, res) {
  res.send("No such page or action! Go to: <a href='/items/'>main page</a>");
});

module.exports = router;
