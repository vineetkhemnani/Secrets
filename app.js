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
    password: String
  })

  // adding hash and salt package for our schema as a plugin
  userSchema.plugin(passportLocalMongoose);
  
  const User = new mongoose.model("User", userSchema);
  passport.use(User.createStrategy());

  passport.serializeUser(User.serializeUser())
  passport.deserializeUser(User.deserializeUser())

app.get('/',(req,res)=>{
    res.render('home');
})

app.get('/login', (req, res) => {
  res.render('login')
})

app.get('/register', (req, res) => {
  res.render('register')
})

app.get('/secrets', async(req,res)=>{
  if(req.isAuthenticated()){
    res.render('secrets');
  } else {
    res.redirect('/login');
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






app.listen(3000, ()=>{
    console.log("Server running on port 3000");
})