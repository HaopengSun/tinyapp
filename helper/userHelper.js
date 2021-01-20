// chech whether email user inputs is existing
const emailChecker = (users, email) => {
  if (users[email]) {
    return true;
  } else {
    return false;
  }
}

// chech password user inputs is correct
const passwordChecker = (users, email, password) => {
  if (users[email].password === password) {
    return true;
  } else {
    return false;
  }
}

module.exports = { emailChecker, passwordChecker };