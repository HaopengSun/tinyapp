const express = require("express");
const app = express();
const PORT = 8080;

// recorde every thing happedn in server in console.log
const morgan = require('morgan');
app.use(morgan('dev'));

// get req.body from the body of HTML file
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require('cookie-parser');
app.use(cookieParser());

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher"
  }
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });

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
  templateVars.user = users[req.cookies.user_id] || '';
  res.render("urls_index", templateVars);
});

// post a new url
app.post("/urls", (req, res) => {
  // random string as the key of input URL
  const key = generateRandomString();
  // bodyParse {longURL: "what user types in" } <input name="longURL">
  // id is mainly for css styling
  urlDatabase[key] = req.body.longURL;
  // res.redirect(`/urls/${key}`);
  res.redirect(`/urls`);
});

// routes order masters and "/urls/new" should be before "/urls/:shortURL"
// get a form from server to fill out the new url
app.get("/urls/new", (req, res) => {
  const templateVars = {};
  templateVars.user = users[req.cookies.user_id] || '';
  res.render("urls_new", templateVars);
});

function generateRandomString() {
  return  Math.random().toString(36).substring(2,8);
}

// shortURL is the key of the requested object { shortURL:value }
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// show individual URL
// templateVars object has just one URL based on request
// we can have multiple /:agrs
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]
  };
  templateVars.user = users[req.cookies.user_id] || '';
  res.render("urls_show", templateVars);
});

// delete
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.post("/urls/:shortURL", (req, res) => {
  const key = req.params.shortURL;
  urlDatabase[key] = req.body.longURL;
  res.redirect(`/urls`);
});

app.get("/login", (req, res) => {
  const templateVars = {};
  templateVars.user = users[req.cookies.user_id] || '';
  res.render('login', templateVars);
});

// set cookie
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!emailChecker(email) && passwordChecker(password)){
    const templateVars = {};
    const id = passwordChecker(password);
    templateVars.user = users[req.cookies.user_id] || '';
    res.cookie('user_id', id);
    res.redirect(`/urls`);
  } else {
    res.send('incorrect email/password!');
  }
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  const templateVars = {};
  templateVars.user = users[req.cookies.user_id] || '';
  res.render("registration", templateVars);
});

app.post('/register', (req, res) => {

  if (req.body.password.length === 0 || req.body.email.length === 0) {
    res.status(400);
  }

  if (!emailChecker(req.body.email)) {
    res.status(400);
    res.send('invalid email');
  }

  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  // console.log(email, password);
  users[id] = {id, email, password};

  const templateVars = {};
  templateVars.user = users[req.cookies.user_id] || '';

  res.cookie('user_id', id);
  res.redirect("/urls");
});

const emailChecker = (email) => {
  for (const user in users){
    console.log(users[user]["email"]);
    if (users[user]["email"] === email) {
      return false;
    }
  }
  return true;
}

const passwordChecker = (password) => {
  for (const user in users){
    if (users[user]["password"] === password) {
      return user;
    }
  }
  return false;
}

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

// PUT to update the URL