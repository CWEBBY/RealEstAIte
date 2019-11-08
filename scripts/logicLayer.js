//logicLayer.js, cw.
//The following module acts as a 'business' logic layer, with an attempt at keeping things as as object oriented as possible.
//Modules
//-Built in
const nodemailer = require('nodemailer');
const crypto = require('crypto');

//-Custom
const dataLayer = require("./dataLayer");
const statics = require("./statics");

function RegisterUser(userObject = {})
{
  var sqlRequirementsMet =  userObject.hasOwnProperty("fName") &&
                            userObject.hasOwnProperty("lName") &&
                            userObject.hasOwnProperty("email") &&
                            userObject.hasOwnProperty("password") &&
                            userObject.hasOwnProperty("dob");
  if (sqlRequirementsMet)
  {
    return dataLayer.CreateUser(
      userObject.fName,
      userObject.lName,
      userObject.email,
      userObject.password,
      userObject.dob,
      GenerateTokenString(),
      Date.now(),
      GenerateVerificationCode(userObject.email),
      false
    );
  }
  else {return null}
}

function GetUser(userKey, fields = [])
{
  if (userKey != null)
  {
    return dataLayer.ReadUser(userKey, fields);
  }
  else {return null}
}

function SetUser(userKey, fields = {})
{
  if (userKey != null)
  {
    if (fields.length == 0) {return dataLayer.ReadUser(userKey);}
    else
    {
      var fieldString = "";
      for (var fieldIndex = 0; fieldIndex < fields.length; fieldIndex++)
      {
        if (fieldIndex != 0) {fieldString += ",";}
        fieldString += fields[fieldIndex].toString();
      }
      return dataLayer.ReadUser(userKey, fieldIndex);
    }
  }
  else {return null}
}

//Functions
async function SendMail(EmaileeAddress, Subject, Body)
{
  var sender = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: statics.EMAIL_ADDRESS,
      pass: statics.EMAIL_PASSWORD
    }
  });

  var mailOptions = {
    from: statics.EMAIL_ADDRESS,
    to: EmaileeAddress,
    subject: Subject,
    text: Body
  };

  sender.sendMail(mailOptions, function(error, info){//possible rewrite for async await
    if (error) { console.log(error);}
    sender.close();
  });
}

function GenerateTokenString()
{
  return crypto.randomBytes(32).toString("hex");
}

function GenerateVerificationCode(email)
{
  var code = Math.floor(Math.random() * 9999);
  code = code.toString();
  if (code.length == 3) {code = "0" + code;}
  else if (code.length == 2) {code = "00" + code;}
  else if (code.length == 1) {code = "000" + code;}
  if (statics.DEV_MODE) {console.log("Verification code for " + email + " is as follows: " + code);}
  else
  {
    SendMail(
      email,
      "Verification Code",
      "Hello, your new verification code, used to verify your account on Real Estaite so it can be actiivated, is as follows: " + code
    );
  }
  return code;
}

function UserSessionCheck(sessionedUserID, requiredUserID = null)
{
  if (sessionedUserID!=null)
  {
    if (requiredUserID != null) //Check to see if the user is valid against the needed ID
    {
      return (sessionedUserID == requiredUserID);
    }
    else {return true;}
  }
  return false;
}

function MasterPageController(masterParams = {})
{
  //Defaults
  var masterInfo = {
    anonSession: true,
    linksBlocked: false,
    pageTitle: "Real Est(ai)te | The good solution to real estate"
  }

  //The below is really only here for clarity.
  if (masterParams.hasOwnProperty("anonSession")){masterInfo.anonSession = masterParams.anonSession;}
  if (masterParams.hasOwnProperty("linksBlocked")){masterInfo.linksBlocked = masterParams.linksBlocked;}
  if (masterParams.hasOwnProperty("pageTitle")){masterInfo.pageTitle = masterParams.pageTitle;}

  return (masterInfo);
}

function ValidationCheck(checkParams)
{
  functionKeys = {
    "validEmail": IsValidEmail,
    "validPassword": IsValidPassword,
    "validAge": IsValidAge,
    "notEmpty": IsNotEmpty
  }
  return InputCheck(functionKeys, checkParams);
}

function VerificationCheck(checkParams)
{
  functionKeys = {
    "newEmail": IsNewEmail,
    "existingEmail": IsExistingEmail,
    "correctPassword": IsCorrectPassword,
    "correctCode": IsCorrectCode
  }
  return InputCheck(functionKeys, checkParams);
}

function InputCheck(functionKeys, checkParams)
{
  var report = {};
  var errorCount = 0;
  var secretsIndices = [];
  for (var inputIndex = 0; inputIndex < Object.keys(checkParams).length; inputIndex++)
  {//For every form input
    var testString = Object.keys(checkParams)[inputIndex];
    var testStringParams = Object.values(checkParams)[inputIndex];
    var testStringType = Object.values(checkParams)[inputIndex].type;
    var testStringTests = Object.values(checkParams)[inputIndex].checks;

    //Below is not the prettiest, but the reward for the sacrifice in elegance is the parsing of submission context sensitive data, like in the case of the login/register page.
    if (testStringParams.hasOwnProperty("checks"))
    {
      report[testString] = {type: testStringType, checks: {}};
      for (var testIndex = 0; testIndex < testStringTests.length; testIndex++)
      {
        var testResult = false;
        for (var testFunctionsIndex = 0; testFunctionsIndex < Object.keys(functionKeys).length; testFunctionsIndex++)
        {
          var caller = Object.keys(functionKeys)[testFunctionsIndex];
          var testFunction = Object.values(functionKeys)[testFunctionsIndex];
          if (testStringTests[testIndex] == caller)
          {
            report[testString].checks[caller] = !testFunction(testString);
            if (report[testString].checks[caller]) {testResult = true;}
          }
        }
        if (testResult) {errorCount++;}
      }
    }
    else {secretsIndices.push(inputIndex);}
  }

  if (errorCount > 0)
  {
    var testString = Object.keys(checkParams)[secretsIndices[0]];
    var testStringParams = Object.values(checkParams)[secretsIndices[0]];
    report[testString] = testStringParams
  }
  return report;
}

function QueryReader(headMessage, validationQueryObject = {})
{
  var report = {};
  if (validationQueryObject.hasOwnProperty("message"))
  {

    if (validationQueryObject.message == headMessage)
    {
      for (var keyIndex = 0; keyIndex < Object.keys(validationQueryObject).length; keyIndex++)
      {
        if (Object.keys(validationQueryObject)[keyIndex] != headMessage) {report[Object.keys(validationQueryObject)[keyIndex]] = Object.values(validationQueryObject)[keyIndex];}
      }
    }
  }
  return report;
}

function QueryBuilder(headMessage, validationCheckObject)
{
  var parsedReport = {flag: false, string: '?message='+headMessage};

  for (var checkIndex = 0; checkIndex < Object.keys(validationCheckObject).length; checkIndex++)
  {
    var testString = Object.keys(validationCheckObject)[checkIndex];
    var testStringParams = Object.values(validationCheckObject)[checkIndex];
    var testStringType = Object.values(validationCheckObject)[checkIndex].type;
    var testStringTests = Object.values(validationCheckObject)[checkIndex].checks;

    if (testStringParams.hasOwnProperty("checks"))
    {
      for (var resultIndex = 0; resultIndex < Object.keys(testStringTests).length; resultIndex++)
      {
        var test = Object.keys(testStringTests)[resultIndex];
        var result = Object.values(testStringTests)[resultIndex];

        if (result)
        {
          parsedReport.flag = true;
          parsedReport.string += "&" + testStringType + "=" + test;
        }
      }
    }
    else
    {
      var unknownQuery = "&" + testString.toString() + "=";
      for (var unknownQueryIndex = 0; unknownQueryIndex < Object.keys(testStringParams).length; unknownQueryIndex++)
      {
        if (unknownQueryIndex > 0) {unknownQuery += "+"}
        unknownQuery += Object.values(testStringParams)[unknownQueryIndex].toString();
      }
      parsedReport.string += unknownQuery;
    }
  }
  return parsedReport;
}

//Validation Helpers
function IsValidEmail(email)
{
  if (!email.includes("@") || !email.includes(".")) {return false;}
  return true;
}

function IsNotEmpty(string)
{
  if (string != "" &&  string.length > 0 && string != null) {return true;}
  return false;
}

function IsValidPassword(newPassword)
{
  if (newPassword.length >= 8) {return true;}
  return false;
}

function IsConfirmedPassword(newPassword, newConfirmPassword)
{
  if (newPassword == newConfirmPassword) {return true;}
  return false;
}

function IsValidAge(dob)
{
  if (CalculateAge(dob) >= 18.0) {return true;}
  return false;
}

function IsCorrectValid()
{
  return true;
}

function IsNewEmail()
{
  return true;
}

function IsExistingEmail()
{
  return true;
}

function IsCorrectPassword()
{
  return true;
}

function IsCorrectCode()
{
  return true;
}

function CalculateAge(dob)
{
  var now = new Date().getTime();
  var birth = new Date(dob).getTime();
  return ((now - birth) / (1000 * 3600 * 24)) / 365.25;
}

//Functions exported
module.exports = {
  RegisterUser,
  UserSessionCheck,
  MasterPageController,
  ValidationCheck,
  QueryReader,
  QueryBuilder,
  VerificationCheck
}
