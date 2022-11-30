//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth2").Strategy;
const findOrCreate = require("mongoose-findOrCreate");
const FacebookStrategy = require("passport-facebook").Strategy;
// const encrypt = require("mongoose-encryption");
// const md5 = require("md5");
// const bcrypt = require("bcrypt");
// const saltRounds = 10;

const app = express();

// add public file as static resources
app.use(express.static("public"));

// set view engine to ejs
app.set("view engine", "ejs");

// set up bodyParser
app.use(bodyParser.urlencoded({
  extended: true
}));

// set up the session --> app must use session package
app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

// app must initialize passport and use it to deal with sessions
app.use(passport.initialize());
app.use(passport.session());

// connect app.js to the DB and create it if doesn't exist
// with property useNewUrlParser to get rid of the errors given by MongoDB
mongoose.connect("mongodb://127.0.0.1/userDB", {useNewUrlParser: true});


// create simple schema (JS object) or complexe schema to plug additionnal packages to it
const usersSchema = new mongoose.Schema ({
  email: {
    type: String
  },
  password: {
    type: String
  },
  googleId: {
    type: String
  },
  facebookId: {
    type: String
  }
});

// enable passportLocalMongoose package to encrypt passwords
usersSchema.plugin(passportLocalMongoose);
usersSchema.plugin(findOrCreate);

// create model
const User = new mongoose.model("User", usersSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

// set up the google strategy, with options to help google to recognize our app
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/authentification-challenge",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

// set up the FB Strategy
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/authentification-challenge"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({
      facebookId: profile.id
    }, function(err, user) {
      return cb(err, user);
    });
  }
));


app.get("/", function(req, res){
  res.render("home");
});


// use passport to authenticate the user using google strategy
// and ask for the user profile
app.route("/auth/google")
  .get(passport.authenticate("google", {scope: ["profile"]})
);

app.get("/auth/google/authentification-challenge",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect secrets page.
    res.redirect('/secrets');
  }
);

// use passport to authenticate the user using google strategy
// and ask for the user profile
app.get('/auth/facebook', passport.authenticate('facebook'));

app.get('/auth/facebook/authentification-challenge',
  passport.authenticate('facebook', { failureRedirect: '/login', failureMessage: true }),
  function(req, res) {
    // Successful authentication, redirect screts page.
    res.redirect('/secrets');
  }
);

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

app.get("/secrets", function(req, res){
  // passport method to check if the user is authenticated
  if (req.isAuthenticated()){
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", function(req, res){
  req.logout(function(err){
    if (err){
      console.log(`The error is: ${err}`)
    } else {
      console.log("Successfully loged out")
      res.redirect("/")
    }
  });
  ;
})

app.post("/register", function(req, res){
  // passport method to register a user
  User.register({username: req.body.username}, req.body.password, function(err, user){
    if (err) {
      console.log(`The error is --> ${err}.`)
      res.redirect("/register");
    } else {
      // passport method to create and a cookie to the browser
      // and say to the brower to hold on to that cookie
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      })
    }
  })
});

app.post("/login", function(req, res){
  // create a new user with the information send through the form
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  });
});

// // registration and encryption salting and hashing with bcrypt
// app.post("/register", function(req, res){
//   // console.log(req.body);
//   bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
//     // Store hash in your password DB.
//     const newUser = new User({
//       email: req.body.username,
//       password: hash
//     });
//
//     // register newUser and raise err if there is one during save process
//     // error is well raised
//     newUser.save(function(err){
//       if (err){
//         console.log(`the error is ${err}`);
//       } else {
//         res.render("secrets");
//       }
//     });
//   });
// });
//
// // log in with email and password already registered
// // salting and hashing with bcrypt
// app.post("/login", function(req, res){
//   const username = req.body.username;
//   const password = req.body.password;
//
//   User.findOne({email: username}, function(err, foundUser){
//     if (err) {
//       console.log(`the error is ${err}`);
//     } else {
//       if (foundUser){
//         console.log(foundUser);
//         bcrypt.compare(password, foundUser.password, function(err, result) {
//           if (result === true){
//             console.log("Loged in successfully");
//             res.render("secrets");
//           } else {
//             console.log(`Incorrect password.`);
//           }
//         });
//       } else {
//         console.log(`There is no user with the following username: ${username}`);
//       }
//     }
//   });
// });


app.listen(3000, function(){
  console.log("Server started on port 3000.");
})
