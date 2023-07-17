//jshint esversion:6
// npm i passport passport-local passport-local-mongoose express-session
require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

// console.log(process.env.API_KEY);

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));

// initialize session
app.use(session({
  secret: "Our little secret",
  resave: false,
  saveUninitialized: false
}))

// initialize passport
app.use(passport.initialize());
app.use(passport.session());

mongoose
  .connect('mongodb://localhost:27017/', {
    dbName: 'userDB',
  })
  .then(() => {
    console.log('MongoDB connected')
  }).catch(err=>console.log(err));

  const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
  })

  // adding hash and salt package for our schema as a plugin
  userSchema.plugin(passportLocalMongoose);
  userSchema.plugin(findOrCreate);
  
  const User = new mongoose.model("User", userSchema);
  passport.use(User.createStrategy());

  // passport.serializeUser(User.serializeUser())
  // passport.deserializeUser(User.deserializeUser())
  // replace the code for local authentication with any kind of authentication
  passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture,
      })
    })
  })

  passport.deserializeUser(function (user, cb) {
    process.nextTick(function () {
      return cb(null, user)
    })
  })

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: 'http://localhost:3000/auth/google/secrets',
      },
      function (accessToken, refreshToken, profile, cb) {
        // console.log(profile);
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
          return cb(err, user)
        })
      }
    )
  )

app.get('/',(req,res)=>{
    res.render('home');
})

// redirect to google authentication page
app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }))

// 
app.get(
  '/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function (req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets')
  }
)

app.get('/login', (req, res) => {
  res.render('login')
})

app.get('/register', (req, res) => {
  res.render('register')
})

app.get('/secrets', async(req,res)=>{
  try {
    const foundUsers = await User.find({"secret": {$ne:null}});
    if(foundUsers){
      res.render('secrets', {usersWithSecrets: foundUsers});

    }
  } catch (error) {
    console.log(error)
  }
})

app.get('/submit', (req,res)=>{
  if (req.isAuthenticated()) {
    res.render('submit')
  } else {
    res.redirect('/login')
  }
})

app.post('/submit', async(req,res)=>{
  const submittedSecret = req.body.secret;

  console.log(req.user);
  try {
    const foundUser = await User.findById(req.user.id);
    if(foundUser){
      foundUser.secret = submittedSecret;
      await foundUser.save();
      res.redirect('/secrets')
    }
  } catch (error) {
    console.log(error)
  }
})

app.post('/register', async(req, res)=>{
  try {
  const user = await User.register({username: req.body.username}, req.body.password);
  passport.authenticate("local")(req,res,()=>{
    res.redirect('/secrets')
  })
} catch (error) {
  console.log(error)
  res.redirect('/register');
  }
    
});

app.post('/login', async (req,res)=>{
  const user = new User({
    username: req.body.username,
    password: req.body.password
  })

  req.login(user, err=>{
    if(err){
      console.log(err)
    } else {
      passport.authenticate("local")(req,res,()=>{
        res.redirect('secrets')
      })
    }
  })
})

app.get('/logout', async (req,res)=>{
  req.logout(err=>{
    if(err){
      console.log(err)
    }else{
      res.redirect('/');
    }
  })
})






let port = process.env.PORT
if (port == null || port == '') {
  port = 3000
}
app.listen(port, function () {
  console.log('Server started successfully on port ' + port)
})