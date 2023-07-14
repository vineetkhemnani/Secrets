//jshint esversion:6
require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
// encrypt package to encypt data
const encrypt = require('mongoose-encryption');


const app = express();

// console.log(process.env.API_KEY);


app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
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

  // secret key for encryption
  // using plugin to extend the functionality of our schema
  userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] });
  // encrypt while save(), decrypt() while find


  const User = new mongoose.model("User", userSchema);

app.get('/',(req,res)=>{
    res.render('home');
})

app.get('/login', (req, res) => {
  res.render('login')
})

app.get('/register', (req, res) => {
  res.render('register')
})

app.post('/register', async(req, res)=>{
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    })

    try {
        await newUser.save();
        res.render("secrets")
    } catch (error) {
        console.log(error)
    }
});

app.post('/login', async (req,res)=>{
  const username = req.body.username;
  const password = req.body.password

  try {
    const foundUser = await User.findOne({email: username})
    if(foundUser.password === password){
      res.render("secrets");
    }

  } catch (error) {
    console.log(error)
  }

})






app.listen(3000, ()=>{
    console.log("Server running on port 3000");
})