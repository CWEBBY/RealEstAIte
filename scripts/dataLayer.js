//dataLayer.js, cw.
//Modules-----------------------------------------------------
//-Built in
const data = require("../resources/data/TESTDATA");
const mysql = require("mysql");

//-Custom
const statics = require("./statics");

function AddUser(userObject)
{
  //I don't like the idea of taking the password and putting it straight into the DB, so that will change in the future but this way allows any auxillary data that is not defined straight away to go in as well.
  var randomCode =Math.trunc(Math.round(1000 + (Math.random()*8999)));
  userObject.passwordResetStatus = {expiry: 0, token: 0};
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
  else if (searchTerms.hasOwnProperty("token"))
  {
    var wasFound = false;
    for (var userIndex = 0; userIndex < Object.values(data.users).length; userIndex++)
    {
      if (data.users[userIndex].resetToken.string == searchTerms.token && Date.now() < data.users[userIndex].resetToken.expiration) {return userIndex;}
    }
    return null;
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
  /*const qString = "SELECT * FROM users WHERE userID=" + key+1 + ";";
  const dbConnection = mysql.createConnection({
    host: statics.SERVER_IP,
    user: statics.DATABASE_USER,
    password: statics.DATABASE_PASSWORD,
    database: statics.DATABASE_NAME
  });

  var user = null;
  console.log(dbConnection.query(qString));//,
    /*function(err, rows, fields)
    {
      if (err)
      {
        console.log(err);
        return;
      }
      console.log(rows[0].givenName);
      return data.users[key];
    }
  );+*/
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
}

function SetToken(key, token)
{
  data.users[key].resetToken = token;
}

module.exports = {AddUser, UpdateUser, GetUserKey, GetUser, ConfirmCode, SetVerification, SetToken};
//Data search functons going in here...
