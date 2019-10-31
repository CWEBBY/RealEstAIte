//This is basically a temp setup until I figure the SQL module out
const data = require("../resources/data/TESTDATA");

function AddUser(givenName, surname, dob, email, password)
{
  var randomCode =Math.trunc(Math.round(1000 + (Math.random()*8999)));
  var newUser = {};
  newUser.givenName = givenName;
  newUser.surname = surname;
  newUser.email = email;
  newUser.password = password;  //I REALLY don't like this, but hashing and p&p key encryption is to be implemented if there is time.
  newUser.dob = dob;
  newUser.accountStatus = {verified: false, latestVerificationCode: randomCode }
  data.users[Object.keys(data.users).length]= newUser;
  console.log(data.users)
}

function GetUserByID(key)
{
  if (data.users.hasOwnProperty(key))
  {
    return data.users[key];
  }
  console.log(key)
  return null;
}

module.exports = {AddUser, GetUserByID};
//Data search functons going in here...
