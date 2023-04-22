var express = require("express");
var router = express.Router();

/* GET pricing page. */
router.get("/", function (req, res, next) {
  res.render("pricing");
});

module.exports = router;
