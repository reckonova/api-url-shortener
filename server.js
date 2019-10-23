"use strict";

var express = require("express");
var mongo = require("mongodb");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var dns = require("dns");
var cors = require("cors");

var app = express();

var port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI);
var Schema = mongoose.Schema;
var urlSchema = new Schema({
  original_url: String,
  short_url: Number
});
var Url = mongoose.model("Url", urlSchema);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", function(req, res) {
  res.sendFile(process.cwd() + "/index.html");
});

app.listen(port, function() {
  console.log("Node.js listening ...");
});

app.route("/api/shorturl/new").post((req, res) => {
  //   we change the requested url so it handles all kind of urls and can be parsed by dns
  if (req.body.url.slice(0, 11) === "http://www.") {
    req.body.url = req.body.url.slice(11);
  } else if (req.body.url.slice(0, 12) === "https://www.") {
    req.body.url = req.body.url.slice(12);
  } else if (req.body.url.slice(0, 8) === "https://") {
    req.body.url = req.body.url.slice(8);
  } else if (req.body.url.slice(0, 7) === "http://") {
    req.body.url = req.body.url.slice(7);
  } else if (req.body.url.slice(0, 4) === "www.") {
    req.body.url = req.body.url.slice(4);
  }
  //   we check if the url is valid
  dns.lookup(req.body.url, (err, add) => {
    if (err) {
      res.json({ error: "invalid URL" });
    } else {
      //         if the shortened url is already cready, we return it
      Url.findOne({ original_url: req.body.url }, (er, data) => {
        if (er) res.json(er);
        else if (data) {
          res.json({ original_url: req.body.url, short_url: data.short_url });
        }
        //           otherwise, we create one another and return it
        //           we set the max number of urls created to 1000
        else {
          Url.create(
            {
              original_url: req.body.url,
              short_url: Math.floor(Math.random() * 1000) + 1
            },
            (error, dat) => {
              if (error) res.json(error);
              else
                res.json({
                  original_url: req.body.url,
                  short_url: dat.short_url
                });
            }
          );
        }
      });
    }
  });
});

// the redirect view
app.get("/api/shorturl/:url", (req, res) => {
  Url.findOne({ short_url: req.params.url }, (err, data) =>
    res.redirect("http://" + data.original_url)
  );
});
