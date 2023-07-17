# Using passport for authentication

## Step 1
```
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')
```

## Step 2
### Set Up session
```
app.use(session({
  secret: "Our little secret",
  resave: false,
  saveUninitialized: false
}))
```

## Step 3
### Initialize passport and passport session
```
app.use(passport.initialize());
app.use(passport.session());
```

## Step 4
### Add Passport Local Mongoose as a plugin to our mongoose Schema
```
userSchema.plugin(passportLocalMongoose);
```
*Use just before creating a mongoose model*

## Step 5
### Use createStrategy to authenticate users
*After creating user* 
```
passport.use(User.createStrategy());

  passport.serializeUser(User.serializeUser());
  passport.deserializeUser(User.deserializeUser());
```

## Step 6
### Set up get and post routes for authentication
```
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
```

### Setup secrets route to show secrets page if authenticated else force to login
```
app.get('/secrets', async(req,res)=>{
  if(req.isAuthenticated()){
    res.render('secrets');
  } else {
    res.redirect('/login');
  }
})
```

### Setup login route to handle the cookie
```
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
```

# Step 7 
## Setup logout route to deauthenticate the user
```
app.get('/logout', (req,res)=>{
  req.logout();
  res.redirect('/');
})
```


# OAuth
### Why OAuth?
*Provides Granular Access Levels- We can require access for only certain things from the vendor eg. Google, Facebook*
*Read-only/ Read-write access*
*Revoke access*

## Step 1
### Set-up your App
*We get an app id from their dashboard*
```
const GoogleStrategy = require('passport-google-oauth20').Strategy;
```

*just after serialize-deserialize user*
```
passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://www.example.com/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
```
*User.findOrCreate() is a pseudocode in the above function and needs to be replaced*
*We can make it an actual function using mongoose-findorcreate package*
### Install mongoose-findorcreate package
```
npm install mongoose-findorcreate
```
### require mongoose-findorcreate
```
const findOrCreate = require('mongoose-findorcreate');
```
### add it as a plugin to our schema
```
userSchema.plugin(findOrCreate);
```
## Step 2
### Redirect to authenticate
```
app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }))
```
## Step 3
### User logs in
*log-in on the website that the user actually trusts*
```
app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });
```
*Need to serialize-deserialize user for all strategies not just local*
```
passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture
    });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});
```
*replace serialize-desrialize code with above code*
## Step 4
### User grants permissions
*User selects what permissions to grant to work with*
**Add googleId field to our database to uniquely identify users**
## Step 5
### Our Api receives back auth code

## Step 6
### Exchange auth code for access token
*We can save access token in our database*
*This access token is valid for longer than auth code*

