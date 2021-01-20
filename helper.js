const getUserByEmail = function(email, users) {
  for (const user in users) {
    if (users[user]["email"] === email) {
      return user;
    }
  }
  return false;
};

module.exports = { getUserByEmail };