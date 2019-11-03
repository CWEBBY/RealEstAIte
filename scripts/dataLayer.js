//This is basically a temp setup until I figure the SQL module out
const data = require("../resources/data/TESTDATA");

function AddUser(userObject)
{
  //I don't like the idea of taking the password and putting it straight into the DB, so that will change in the future but this way allows any auxillary data that is not defined straight away to go in as well.
  var randomCode =Math.trunc(Math.round(1000 + (Math.random()*8999)));
  userObject.accountStatus = {verified: false, latestVerificationCode: randomCode }
  data.users[Object.keys(data.users).length]= userObject;
}

function GetUserKey(searchTerms = {})
{
  if (searchTerms.hasOwnProperty("id"))
  {
    if (data.users.hasOwnProperty(searchTerms.id)) {return searchTerms.id;}
    else {return null;}
  }
  else if (searchTerms.hasOwnProperty("email"))
  {
    var wasFound = false;
    for (var userIndex = 0; userIndex < Object.values(data.users).length; userIndex++)
    {
      if (data.users[userIndex].email == searchTerms.email) {return userIndex;}
    }
    return null;
  }
  else {return null;}
}

function GetUser(key)
{
  return data.users[key];
}

function SetVerification(key)
{
  data.users[key].accountStatus.verified = true;
}

function ConfirmCode(key, code)
{
  return data.users[key].accountStatus.latestVerificationCode == code;
}

function UpdateUser(key, userObject)
{
  var userInQuestion = data.users[key];
  Object.assign(userInQuestion, userObject);
  data.users[key] = userInQuestion;
  console.log(data.users[key]);
}

//Debug
function DEBUGGetUsers()
{
  return data.users;
}

module.exports = {AddUser, UpdateUser, GetUserKey, GetUser, ConfirmCode, SetVerification, DEBUGGetUsers};
//Data search functons going in here...
