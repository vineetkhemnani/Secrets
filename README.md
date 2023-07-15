# Using passport for authentication

## Step 1
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')

## Step 2
### Set Up session
app.use(session({
  secret: "Our little secret",
  resave: false,
  saveUninitialized: false
}))

## Step 3
### Initialize passport and passport session
app.use(passport.initialize());
app.use(passport.session());

## Step 4
### Add Passport Local Mongoose as a plugin to our mongoose Schema
userSchema.plugin(passportLocalMongoose);
*Use just before creating a mongoose model*

## Step 5
### Use createStrategy to authenticate users
*After creating user*
passport.use(User.createStrategy());

  passport.serializeUser(User.serializeUser());
  passport.deserializeUser(User.deserializeUser());

## Step 6
### Set up get and post routes for authentication
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

### Setup secrets route to show secrets page if authenticated else force to login
app.get('/secrets', async(req,res)=>{
  if(req.isAuthenticated()){
    res.render('secrets');
  } else {
    res.redirect('/login');
  }
})

### Setup login route to handle the cookie
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

# Step 7 
## Setup logout route to deauthenticate the user
app.get('/logout', (req,res)=>{
  req.logout();
  res.redirect('/');
})

