//logicLayer.js, cw.
//The following module acts as a 'business' logic layer, with an attempt at keeping things as as object oriented as possible.
//Modules
//-Built in
const nodemailer = require('nodemailer');
const crypto = require('crypto');

//-Custom
const dataLayer = require("./dataLayer");
const statics = require("./statics");

async function RegisterUser(userObject = {})
{
  var sqlRequirementsMet =  userObject.hasOwnProperty("fName") &&
                            userObject.hasOwnProperty("lName") &&
                            userObject.hasOwnProperty("email") &&
                            userObject.hasOwnProperty("password") &&
                            userObject.hasOwnProperty("dob");
  if (sqlRequirementsMet)
  {
    return await dataLayer.CreateUser(
      userObject.fName,
      userObject.lName,
      userObject.email,
      userObject.password,
      userObject.dob,
      await GenerateTokenString(),
      Date.now(),
      await GenerateVerificationCode(userObject.email),
      false
    );
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

async function GenerateTokenString()
{
  var newToken = await crypto.randomBytes(32).toString("hex");
  return newToken
}

async function RegenerateVerificationCode(email)
{
  var newCode = await GenerateVerificationCode(email);
  var userKey = await dataLayer.GetUserKey({email: email});
  if (userKey != null)
  {
    var setQuery = await dataLayer.UpdateUser(userKey, {latestVerificationCode: newCode});
    return setQuery;
  }
  else {return null;}
}

async function GenerateVerificationCode(email)
{
  var code = await crypto.randomBytes(2).toString("hex");
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

async function ValidationCheck(checkParams)
{
  functionKeys = await {
    "validEmail": IsValidEmail,
    "validPassword": IsValidPassword,
    "validAge": IsValidAge,
    "validCode": IsValidCode,
    "notEmpty": IsNotEmpty
  }
  return await InputCheck(functionKeys, checkParams);
}

async function VerificationCheck(checkParams)
{
  functionKeys = await {
    "newEmail": await IsNewEmail,
    "existingEmail": await IsExistingEmail,
    "correctPassword": await IsCorrectPassword,
    "correctCode": await IsCorrectCode
  }
  return await InputCheck(functionKeys, checkParams);
}

async function InputCheck(functionKeys, checkParams)
{
  var report = {};
  var errorCount = 0;
  var secretsIndices = [];
  for (var inputIndex = 0; inputIndex < Object.keys(checkParams).length; inputIndex++)
  {//For every form input
    var testString = Object.keys(checkParams)[inputIndex];
    var testStringValues = Object.values(checkParams)[inputIndex];
    var testStringType = Object.values(checkParams)[inputIndex].type;
    var testStringTests = Object.values(checkParams)[inputIndex].checks;
    var testStringParams = null;
    if (Object.values(checkParams)[inputIndex].hasOwnProperty("params")) {testStringParams = Object.values(checkParams)[inputIndex].params;}

    //Below is not the prettiest, but the reward for the sacrifice in elegance is the parsing of submission context sensitive data, like in the case of the login/register page.
    if (testStringValues.hasOwnProperty("checks"))
    {
      report[testString] = {type: testStringType, checks: {}};
      for (var testIndex = 0; testIndex < testStringTests.length; testIndex++)
      {
        var testResult = true;
        for (var testFunctionsIndex = 0; testFunctionsIndex < Object.keys(functionKeys).length; testFunctionsIndex++)
        {
          var caller = Object.keys(functionKeys)[testFunctionsIndex];
          var testFunction = Object.values(functionKeys)[testFunctionsIndex];
          if (testStringTests[testIndex] == caller)
          {
            //This will break if passing params to a function that doesnt take it.
            //Be careful with verification checks for param overflow.
            if (testStringParams != null) {report[testString].checks[caller] = await testFunction(testString, testStringParams);}
            else {report[testString].checks[caller] = await testFunction(testString);}
            if (report[testString].checks[caller]) {testResult = false;}
          }
        }
        if (!testResult) {errorCount++;}
      }
    }
    else {secretsIndices.push(inputIndex);}
  }

  if (errorCount > 0 && secretsIndices.length > 0)
  {
    var testString = Object.keys(checkParams)[secretsIndices[0]];
    var testStringValues = Object.values(checkParams)[secretsIndices[0]];
    report[testString] = testStringValues
  }
  return await report;
}

async function QueryReader(headMessage, validationQueryObject = {})
{
  var report = {};
  if (validationQueryObject.hasOwnProperty("message"))
  {
    if (validationQueryObject.message == headMessage)
    {
      for (var keyIndex = 0; keyIndex < Object.keys(validationQueryObject).length; keyIndex++)
      {
        if (Object.keys(validationQueryObject)[keyIndex] != headMessage) {report[Object.keys(validationQueryObject)[keyIndex]] = await Object.values(validationQueryObject)[keyIndex];}
      }
    }
  }
  return await report;
}

async function QueryBuilder(headMessage, validationCheckObject)
{
  var parsedReport = {flag: false, string: '?message='+headMessage};

  for (var checkIndex = 0; checkIndex < Object.keys(validationCheckObject).length; checkIndex++)
  {
    var testString = Object.keys(validationCheckObject)[checkIndex];
    var testStringValues = Object.values(validationCheckObject)[checkIndex];
    var testStringType = Object.values(validationCheckObject)[checkIndex].type;
    var testStringTests = Object.values(validationCheckObject)[checkIndex].checks;

    if (testStringValues.hasOwnProperty("checks"))
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
      for (var unknownQueryIndex = 0; unknownQueryIndex < Object.keys(testStringValues).length; unknownQueryIndex++)
      {
        if (unknownQueryIndex > 0) {unknownQuery += "+"}
        unknownQuery += Object.values(testStringValues)[unknownQueryIndex].toString();
      }
      parsedReport.string += unknownQuery;
    }
  }
  return await parsedReport;
}

//Validation Helpers
async function IsValidEmail(email)
{
  if (!email.includes("@") || !email.includes(".")) {return await true;}
  return await false;
}

async function IsNotEmpty(string)
{
  if (string != "" &&  string.length > 0 && string != null) {return await false;}
  return await true;
}

async function IsValidPassword(newPassword)
{
  if (newPassword.length >= 8) {return await false;}
  return await true;
}

async function IsValidAge(dob)
{
  if (await CalculateAge(dob) >= 18.0) {return await false;}
  return await true;
}

async function IsValidCode(code)
{
  if (code.length == 4) {return await false;}
  return await true;
}

async function IsNewEmail(email)
{
  var keyQuery = await dataLayer.GetUserKey({email: email});
  if (await keyQuery == null) {return await true;}
  else {return await false;}
}

async function IsVerifiedAccount(email)
{
  var keyQuery = await dataLayer.GetUserKey({email: email});
  var verificationQuery = await dataLayer.ReadUser(keyQuery, ["verified"]);
  if (verificationQuery.verified == 0) {verificationQuery.verified = false;}  //SQLisms
  if (verificationQuery.verified == 1) {verificationQuery.verified = true;}  //SQLisms
  return verificationQuery.verified;
}

async function IsExistingEmail(email, userID = null)
{

  userID = userID.userID;//Due to how params are handled this can be assumed to be here.
  var keyQuery = await dataLayer.GetUserKey({email: email});
  if (await keyQuery == null) {return await false;}
  else if (userID != null)
  {
    if (userID == keyQuery) {return await false;}
  }
  else {return await true;}
}

async function IsCorrectPassword(password, paramsObject = null)
{
  if (paramsObject == null) {return false;}
  var keyQuery = await dataLayer.GetUserKey({email: paramsObject.email});
  if (keyQuery != null)
  {
    var passwordQuery = await dataLayer.ReadUser(keyQuery, ["userPassword"]);
    if (passwordQuery.userPassword == password) {return await false;}
  }
  return await true;
}

async function IsCorrectCode(code, paramsObject = null)
{
  if (paramsObject == null) {return await false;}
  var keyQuery = await dataLayer.GetUserKey({email: paramsObject.email});
  var codeQuery = await dataLayer.ReadUser(keyQuery, ["latestVerificationCode"]);
  if (codeQuery.latestVerificationCode == code) {return await false;}
  return await true;
}

async function CalculateAge(dob)
{
  var now = new Date().getTime();
  var birth = new Date(dob).getTime();
  return await ((now - birth) / (1000 * 3600 * 24)) / 365.25;
}

async function LogUserIn(email)
{
  var verified = await IsVerifiedAccount(email);
  var userKey = await dataLayer.GetUserKey({email: email}); //Not happy with how many times Im nestedly breaking async here, but out of time.
  if (!verified)
  {
    var verifiyQuery = await dataLayer.UpdateUser(userKey, {verified: 1});
  }
  return userKey;
}

async function SendResetLink(email)
{
  var userKey = await dataLayer.GetUserKey({email: email});
  if (userKey != null)
  {
    var token = await GenerateTokenString();
    var alterUserToken = await dataLayer.UpdateUser(userKey, {tokenString: token, tokenExpiration: Date.now() + (1000*60*60)});
    if (statics.DEV_MODE) {console.log("The tokenstring url to follow for " + email.toString() + " to reset password is: " + statics.SERVER_IP.toString() +":"+ statics.PORT + "/resetpassword?token=" + token + ", it will be valid for an hour.");}
    else
    {
      SendMail(
        email,
        "Reset Password",
        "Hello, please follow the link below to reset your password, this link will be valid for an hour: " + statics.SERVER_IP.toString() +":"+ statics.PORT + "/resetpassword?token=" + token
      );
    }
    return true;
  }
  return false;
}

async function SearchToken(token)
{
  var userKey = await dataLayer.GetUserKey({tokenString: token});
  return userKey;
}

async function SetNewPassword(userKey, newPassword)
{
  var newToken = await GenerateTokenString();

  var userKey = await dataLayer.UpdateUser(userKey,{userPassword: newPassword, tokenExpiration: Date.now()});
  return userKey;
}

async function GetProfileDetails(userID)
{
  var queryResults = await dataLayer.ReadUser(userID, ["fName", "lName", "email", "dob"]);
  var info = {}
  if (queryResults != null)
  {
    info = {
      fname: queryResults.fName.substring(0,1).toUpperCase() + queryResults.fName.substring(1).toLowerCase(), //A quick and dirty way of sentance casing
      lname: queryResults.lName.substring(0,1).toUpperCase() + queryResults.lName.substring(1).toLowerCase(),
      email: queryResults.email,
      dob: queryResults.dob
    };
    return info;
  }
  return null;
}

async function SetProfileDetails(userID, fname, lname, email, dob)
{
  var queryResults = await dataLayer.UpdateUser(userID, {fName: fname.toLowerCase(), lName: lname.toLowerCase(), email: email, dob: dob});
  return queryResults;
}

//Functions exported
module.exports = {
  RegisterUser,
  UserSessionCheck,
  MasterPageController,
  ValidationCheck,
  QueryReader,
  QueryBuilder,
  VerificationCheck,
  IsVerifiedAccount,
  LogUserIn,
  SendResetLink,
  SearchToken,
  SetNewPassword,
  RegenerateVerificationCode,
  GetProfileDetails,
  SetProfileDetails
}
