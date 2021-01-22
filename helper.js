const getUserByEmail = function(email, users) {
  for (const user in users) {
    if (users[user]["email"] === email) {
      return user;
    }
  }
  return undefined;
};

function generateRandomString() {
  return  Math.random().toString(36).substring(2,8);
}

// hashing password
const bcrypt = require('bcrypt');
const addNewUser = (users, email, password) => {
  const id = generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, 10);
  users[id] = {id, email: email, password: hashedPassword};
  return email;
};

module.exports = { getUserByEmail, generateRandomString, addNewUser };