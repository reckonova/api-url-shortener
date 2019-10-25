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
let urlData = mongoose.model("urlData", urlSchema);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", function(req, res) {
  res.sendFile(process.cwd() + "/index.html");
});

app.route("/api/shorturl/new").post((req, res) => {
  let origUrl = req.body.url;
  //look to see if it's typed in right
  switch (true) {
    case origUrl.slice(0, 11) === "http://www.":
      origUrl = req.body.url.slice(11);
      break;
    case origUrl.slice(0, 12) === "https://www.":
      origUrl = req.body.url.slice(12);
      break;
    case origUrl.slice(0, 8) === "https://":
      origUrl = req.body.url.slice(8);
      break;
    case origUrl.slice(0, 7) === "http://":
      origUrl = req.body.url.slice(7);
      break;
    case origUrl.slice(0, 4) === "www.":
      origUrl = req.body.url.slice(4);
      break;
  }

  dns.lookup(origUrl, (err, add) => {
    if (err) {
      res.json({ error: "invalid URL" });
    } else {
      //         if the shortened url is already cready, we return it
      urlData.findOne({ original_url: origUrl }, (er, data) => {
        if (er) res.json(er);
        else if (data) {
          res.json({ 
            original_url: origUrl, 
            short_url: data.short_url });
        }
        //           otherwise, we create one another and return it
        //           we set the max number of urls created to 1000
        else {
          urlData.create(
            {
              original_url: origUrl,
              short_url: Math.floor(Math.random()*100000).toString()
            },
            (error, data) => {
              if (error) res.json(error);
              else
                res.json({
                  original_url: origUrl,
                  short_url: data.short_url
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
  urlData.findOne({ short_url: req.params.url }, (err, data) =>
    res.redirect("http://" + data.original_url)
  );
});

app.listen(port, function() {
  console.log("It's listening!");
});
