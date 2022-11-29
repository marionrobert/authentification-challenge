//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");
// const md5 = require("md5");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const app = express();

// add public file as static resources
app.use(express.static("public"));

// set view engine to ejs
app.set("view engine", "ejs");

// set up bodyParser
app.use(bodyParser.urlencoded({
  extended: true
}));

// connect app.js to the DB and create it if doesn't exist
// with property useNewUrlParser to get rid of the errors given by MongoDB
mongoose.connect("mongodb://127.0.0.1/userDB", {useNewUrlParser: true});


// create simple schema (JS object) or complexe schema to plug additionnal packages to it
const usersSchema = new mongoose.Schema ({
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  }
});

// create encryption key to seal the encryption (.env)
// add encryption package as plugin
// set option encryptedFields to encrypt only password field
// usersSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"] });

// create model
const User = new mongoose.model("User", usersSchema);

app.get("/", function(req, res){
  res.render("home");
});

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

app.post("/register", function(req, res){
  // console.log(req.body);
  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    // Store hash in your password DB.
    const newUser = new User({
      email: req.body.username,
      password: hash
    });

    // register newUser and raise err if there is one during save process
    // error is well raised
    newUser.save(function(err){
      if (err){
        console.log(`the error is ${err}`);
      } else {
        res.render("secrets");
      }
    });
  });
});

// log in with email and password already registered
app.post("/login", function(req, res){
  const username = req.body.username;
  const password = req.body.password;

  User.findOne({email: username}, function(err, foundUser){
    if (err) {
      console.log(`the error is ${err}`);
    } else {
      if (foundUser){
        console.log(foundUser);
        bcrypt.compare(password, foundUser.password, function(err, result) {
          if (result === true){
            console.log("Loged in successfully");
            res.render("secrets");
          } else {
            console.log(`Incorrect password.`);
          }
        });
      } else {
        console.log(`There is no user with the following username: ${username}`);
      }
    }
  });
});


app.listen(3000, function(){
  console.log("Server started on port 3000.");
})
