const express = require("express");
const app = express();
const PORT = 8080;

const morgan = require('morgan');
app.use(morgan('dev'));

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require('cookie-parser');
app.use(cookieParser());

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

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
  templateVars.username = req.cookies.username || '';
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const key = generateRandomString();
  urlDatabase[key] = req.body.longURL;
  res.redirect(`/urls/${key}`);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {};
  templateVars.username = req.cookies.username || '';
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
  templateVars.username = req.cookies.username || '';
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

// set cookie
app.post("/login", (req, res) => {
  const name = req.body.username;
  res.cookie('username', name);
  res.redirect(`/urls`);
});

app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
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