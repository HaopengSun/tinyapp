const express = require("express");
const app = express();

// public file provide css or boostrap
// app.use(express.static("public"))

const PORT = 8080;

// recorde every thing happedn in server in console.log
const morgan = require('morgan');
app.use(morgan('dev'));

// get req.body from the body of HTML file
const bodyParser = require("body-parser");

// form request being filled out is sent to server and parsed as object
app.use(bodyParser.urlencoded({extended: true}));
const cookieParser = require('cookie-parser');

// override with POST having ?_method=DELETE
var methodOverride = require('method-override');
app.use(methodOverride('_method'));

// take in a cookie string and parse it to object
app.use(cookieParser());

var cookieSession = require('cookie-session')
app.use(cookieSession({
  name: 'session',
  keys: ["secret"],
  maxAge: 24 * 60 * 60 * 1000
}))

// hashing password
const bcrypt = require('bcrypt');

// ejs syntax <%= var %>
app.set("view engine", "ejs");

// import helpers
const { getUserByEmail, generateRandomString, addNewUser } = require('./helper');

// middleware--currentUser
const currentUser = (req, res, next) => {
  req.currentUser = req.session.user;
  // calling the next middleware in the chain.
  next();
};

// activate the middleware
// on each request, it's going to execute that function
app.use(currentUser);

const urlDatabase = {};

const users = {}

app.get("/", (req, res) => {
  const templateVars = {};
  templateVars.currentUser = req.currentUser;
  if (templateVars.currentUser) {
    res.redirect('/urls');
  } else {
    res.render('login', templateVars);
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  const templateVars = { greeting: 'Hello World!' };
  // render takes two args, first is file name and second is arguments that
  // you want to be accessable inside the view
  res.render("hello_world", templateVars);
});

app.get("/urls", (req, res) => {
  const templateVars = { 
    urls: urlDatabase
  };
  templateVars.currentUser = req.currentUser || '';
  console.log(req.session);
  res.render("urls_index", templateVars);
});

// post a new url
app.post("/urls", (req, res) => {
  if (req.session.user) {
    // random string as the key of input URL
    const key = generateRandomString();
    // bodyParse {longURL: "what user types in" } <input name="longURL">
    // id is mainly for css styling
    urlDatabase[key] = {
      longURL: req.body.longURL,
      userID: req.session.user,
      visited: 1,
      visitedUser: [],
    };
    res.redirect(`/urls/${key}`);
  } else {
    res.send('please log in!');
  }
});

// routes order masters and "/urls/new" should be before "/urls/:shortURL"
// get a form from server to fill out the new url
app.get("/urls/new", (req, res) => {
  const templateVars = {};
  templateVars.currentUser = req.currentUser;
  if (templateVars.currentUser) {
    res.render("urls_new", templateVars);
  } else {
    const templateVars = { currentUser: null };
    res.render('login', templateVars);
  }
});

// shortURL is the key of the requested object { shortURL:value }
app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    res.send('url is not existed!');
  }
  const longURL = urlDatabase[req.params.shortURL]["longURL"];
  res.redirect(longURL);
});

// show individual URL
// templateVars object has just one URL based on request
// we can have multiple /:agrs
app.get("/urls/:shortURL", (req, res) => {
  const urlData = urlDatabase[req.params.shortURL];

  if (!urlData) {
    res.send('url is not existed!');
  }

  const currentDate = new Date();
  if (req.currentUser) {
    const visitInfo = req.currentUser + '(' + currentDate.toJSON().slice(0, 10) + ')';
    urlData.visitedUser.push(visitInfo);
  } else {
    res.send('please log in!');
  }

  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlData.longURL,
    visited: urlData.visited++,
    visitedUser: urlData.visitedUser,
    // "currentUser: req.session.user," is transfered to middleware currentUser
    currentUser: req.currentUser,
    user: urlData.userID,
  };

  res.render("urls_show", templateVars);
});

// delete
app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.session.user) {
    if (req.session.user === urlDatabase[req.params.shortURL]['user']) {
      delete urlDatabase[req.params.shortURL];
      res.redirect("/urls");
    } else {
      res.send('You are not authenticated to delete!');
    }
  } else {
    res.send('please log in!');
  }
});

app.post("/urls/:shortURL", (req, res) => {
  if (req.session.user) {
    if (req.session.user === urlDatabase[req.params.shortURL]['user']) {
      const key = req.params.shortURL;
      urlDatabase[key] = { 
        longURL: req.body.longURL,
        userID: req.session.user,
        visited: 1,
        visitedUser: [],
      };
      res.redirect(`/urls`);
    } else {
      res.send('You are not authenticated to create!');
    }
  } else {
    res.send('Please log in!');
  }
});

app.get("/login", (req, res) => {
  const templateVars = { currentUser: null };
  res.render('login', templateVars);
});

app.post("/login", (req, res) => {
  // due to bodyPaser, we can be access to the body object
  const email = req.body.email;
  const password = req.body.password;
  if (getUserByEmail(email, users)) {
    const user = getUserByEmail(email, users);
    if (bcrypt.compareSync(password, users[user]["password"])){
      const templateVars = {};
      templateVars.user = email;

      req.session.user = email;
      res.redirect(`/urls`);
    } else {
      res.status(403);
      res.send('incorrect password!');
    }
  } else {
    res.status(403);
    res.send('incorrect email!');
  }  
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  const templateVars = {};
  templateVars.currentUser = req.currentUser || null;
  res.render("registration", templateVars);
});

app.post('/register', (req, res) => {
  const passwordInput = req.body.password;
  const emailInput = req.body.email;

  if (passwordInput.length === 0 || emailInput.length === 0) {
    res.status(400);
    res.send('input email and password');
  }

  if (getUserByEmail(emailInput, users)) {
    res.status(400);
    res.send('invalid email');
  }
  
  const email = addNewUser(users, emailInput, passwordInput);
  const templateVars = { user: email};
  req.session.user = email;
  res.redirect("/urls");
});


// Modify the forms that should be PUT or DELETE.
app.delete("/urls/:shortURL", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.put("/urls/:shortURL", (req, res) => {
  console.log('put')
  console.log(req);
  const key = req.params.shortURL;
  urlDatabase[key] = {
    longURL: req.body.longURL,
    userID: req.session.user,
    visited: 1,
    visitedUser: [],
  };
  res.redirect(`/urls`);
});

// a variable that is created in one request is not accessible in another
app.get("/set", (req, res) => {
 const a = 1;
 res.send(`a = ${a}`);
});

app.get("/fetch", (req, res) => {
 res.send(`a = ${a}`);
});

// server starts listening
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});