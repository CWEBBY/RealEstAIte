const dataLayer = require("./dataLayer");
const statics = require("./statics");
const nodemailer = require('nodemailer');
const _DEVMODE = true;

function AddUser(userObject)
{
  return dataLayer.AddUser(userObject);
}

function GetUserKey(searchObject)
{
  return dataLayer.GetUserKey(searchObject);
}

function GetUser(key)
{
  return dataLayer.GetUser(key);
}

function SendUserVerification(key)
{
  var user = dataLayer.GetUser(key);
  if (_DEVMODE)
  {
    console.log("Code for " + user.givenName + " " + user.surname + " is: "  + user.accountStatus.latestVerificationCode);
  }
  else
  {
    //From W3, justification being that email can be easy to screw up if not careful. Spamming, blocklisting, bannning, etc.
    //
    var sender = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: statics.EMAIL_ADDRESS,
        pass: statics.EMAIL_PASSWORD
      }
    });

    var mailOptions = {
      from: statics.EMAIL_ADDRESS,
      to: user.email,
      subject: 'Verification Code',
      text: 'Your Verification code is as follows: ' + user.accountStatus.latestVerificationCode
    };

    sender.sendMail(mailOptions, function(error, info){
      if (error) { console.log(error);}
    });
    //
  }
}

function ConfirmUser(key, code = 0)
{
  if (dataLayer.GetUser(key).accountStatus.verified) {return true;}
  else
  {
    if (dataLayer.GetUser(key).accountStatus.latestVerificationCode == code)
    {
      dataLayer.SetVerification(key);
      return true;
    }
    else {return false;}
  }
}

function ConfirmPassword(key, passwordAttempt)
{
  if (dataLayer.GetUser(key).password == passwordAttempt) {return true;}
  else {return false;}
}

function ConfirmVerified(key)
{
  return dataLayer.GetUser(key).accountStatus.verified;
}

function ConfirmCode(key, code)
{
  return dataLayer.ConfirmCode(key, code);
}

function UpdateUser(key, userObject = {})
{
  if (key!=null)
  {
    existingUser = GetUser({id: key})
    if (!userObject.hasOwnProperty("email")) {userObject.email = existingUser.email;}
    if (!userObject.hasOwnProperty("fname")) {userObject.fname = existingUser.givenName;}
    if (!userObject.hasOwnProperty("lname")) {userObject.lname = existingUser.surname;}
    if (!userObject.hasOwnProperty("dob")) {userObject.dob = existingUser.dob;}
    dataLayer.UpdateUser(key, userObject);
  }
}


module.exports = {AddUser, UpdateUser, GetUser, GetUserKey, SendUserVerification, ConfirmUser, ConfirmPassword, ConfirmCode, ConfirmVerified}
