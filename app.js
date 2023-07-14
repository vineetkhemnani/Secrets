//jshint esversion:6
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');


const app = express();

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