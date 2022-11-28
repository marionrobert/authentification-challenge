//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");

const app = express();

// add public file as static resources
app.use(express.static("public"));

// set view engine to ejs
app.set("view engine", "ejs");

// set up bodyParser
app.use(bodyParser.urlencoded({
  extended: true
}));

app.get("/", function(req, res){
  res.render("home");
});

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});


app.listen(3000, function(){
  console.log("Server started on port 3000.");
})
