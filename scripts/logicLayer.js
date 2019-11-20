//logicLayer.js, cw.
//The following module acts as a 'business' logic layer, with an attempt at keeping things as as object oriented as possible.
//Modules
//-Built in
const nodemailer = require('nodemailer'); //For the mailing service
const crypto = require('crypto'); //For the hashing of random bytes in tokens

//-Custom
const dataLayer = require("./dataLayer");
const statics = require("./statics");

//User functions
async function RegisterUser(userObject = {})
{//These conditions must be met for the object to be added to the DB.
  //I mention once in these comments somewhere that, because of the blurred lines between these layers in my mind in the context of NodeJS (due to it being JS, a versitile langauge that isn't tied down to a particular paradigm like C#),
  //the logic layer probably should not need to know EXACTLY what the SQL needs (as per n-tier standards), but my reasoning is that,  in this case, the data layer should be dedicated to the SQL,  even if that means parsing corrected data in from here.
  var sqlRequirementsMet =  userObject.hasOwnProperty("fName") &&
                            userObject.hasOwnProperty("lName") &&
                            userObject.hasOwnProperty("email") &&
                            userObject.hasOwnProperty("password") &&
                            userObject.hasOwnProperty("dob");
  if (sqlRequirementsMet)
  {//Downside (in this case) to relational DBs.... you need to be specific about what you put in it.
    return await dataLayer.CreateUser(  //Add the data handed in.
      userObject.fName,
      userObject.lName,
      userObject.email,
      userObject.password,
      userObject.dob,
      await GenerateTokenString(),  //Generate a first token
      Date.now(), //Generate expiry for that token (now, so it doesn't matter, it is not valid)
      await GenerateVerificationCode(userObject.email), //Generate verification code
      false//set verification status.
    );
  }
  else
  {
    console.log("Reqs were not meant for SQL, check the register POST event");
    return null
  }
}

//Token and Verification
async function GenerateTokenString()
{//This generates 32bytes of noise in hex and translates to a string, this is the token, it gets added to the resetpassword links to allow as auth for password changes.
  var newToken = await crypto.randomBytes(32).toString("hex");
  return newToken
}

async function RegenerateVerificationCode(email)
{//This function is just an addition to the one below but it has to also change the user's code in the DB.
  var newCode = await GenerateVerificationCode(email);
  var userKey = await dataLayer.GetUserKey({email: email});
  if (userKey != null)
  {
    var setQuery = await dataLayer.UpdateUser(userKey, {latestVerificationCode: newCode});  //Passing the key for the code as that is the only thing that needs changing.
    return setQuery;  //Return the result incase, for whatever reason, it needs to be read.
  }
  return userKey; //or null, which wuld be userKey if the email did not get found.
}

async function GenerateVerificationCode(email)
{
  var code = await crypto.randomBytes(2).toString("hex");// Use the randomBytes function to get 4 chars of random for an alpha numeric verification code code.
  if (statics.DEV_MODE) {console.log("Verification code for " + email + " is as follows: " + code);}  //It helps to have a 3rd party terminal that lets you click links if dev mode in statics is enabled.
  else
  {//Otherwise, send the code to the user.
    SendMail( //This, with further time, could be made prettier with html and css in the email.
      email,
      "Verification Code",
      "Hello, your new verification code, used to verify your account on Real Estaite so it can be actiivated, is as follows: " + code
    );
  }
  return code;
}

//Page utils
function UserSessionCheck(sessionedUserID, requiredUserID = null)
{//Used a lot, this simply checks for a user ID given a session object.
  //If a second param is supplied, the function will compare the two and return whether the two are the same.
  //Otherwise it will just check to see if there is a userID in session.
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
  var masterInfo = {  //Default values for the master page.
    anonSession: true,
    linksBlocked: false,
    pageTitle: "Real Est(ai)te | The good solution to real estate"  //Settable in case of custom titles for search results for example.
  }

  //The below is really only here for clarity. This could be done in 2 lines for countless keys, but it is like this for readability.
  if (masterParams.hasOwnProperty("anonSession")){masterInfo.anonSession = masterParams.anonSession;}
  if (masterParams.hasOwnProperty("linksBlocked")){masterInfo.linksBlocked = masterParams.linksBlocked;}
  if (masterParams.hasOwnProperty("pageTitle")){masterInfo.pageTitle = masterParams.pageTitle;}

  return (masterInfo);
}

async function ValidationCheck(checkParams)
{//This, as well as VerificationCheck, are the start of some rather complex-to-follow code.
  //Here, I create an object that has keys that are attatched to functions as values.
  //Then, both checkParams and the object are sent to InputCheck.
  //You may have noticed the following line of comment in presentationLayer, THAT, from that layer, is checkParams.
  //Input: {{type}, [subscribedChecks]}
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
{//This, as well as ValidationCheck, are the start of some rather complex-to-follow code.
  //Here, I create an object that has keys that are attatched to functions as values.
  //Then, both checkParams and the object are sent to InputCheck.
  //You may have noticed the following line of comment in presentationLayer, THAT, from that layer, is checkParams.
  //Input: {{type}, [subscribedChecks]}
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
  //One of the most intricate parts of this project. I will give a line by line.
  var report = {};
  var errorCount = 0;
  var secretsIndices = [];
  //Above, I make some empty vars.

  for (var inputIndex = 0; inputIndex < Object.keys(checkParams).length; inputIndex++)  //For every key in checkParams, that is, every form input
  {
    var testString = Object.keys(checkParams)[inputIndex];  //I break the object that s checkParams down again by each key, that is, run of this loop. Usually two, maybe three, rarely one.
    var testStringValues = Object.values(checkParams)[inputIndex];  //On the above line, I take the key (the value from the input), then I take the values to that key, so any checks or params it may have.
    var testStringType = Object.values(checkParams)[inputIndex].type; //I get its type, this is mainly to show in the URL safetly
    var testStringTests = Object.values(checkParams)[inputIndex].checks;  //I specifically get the checks the input needs to go under in its array form.
    var testStringParams = null;  //I create a new var for params and set it to null for if there is not any params for the check.
    if (Object.values(checkParams)[inputIndex].hasOwnProperty("params")) {testStringParams = Object.values(checkParams)[inputIndex].params;}
    //Above, I check that the values of the particular key in the checkParams object, that is, the particular input, has a params entry, if it doesn't, this if won't trip, not overiding the null that it was created with.
    //Below is not the prettiest, but the reward for the sacrifice in elegance is the parsing of submission context sensitive data, like in the case of the login/register page.
    if (testStringValues.hasOwnProperty("checks"))  //Then, if it has checks,
    {
      report[testString] = {type: testStringType, checks: {}}; //On the first loop, report is empty from the top, regardless, I insert into this blank object a key that is the, much like how checkParams is handed in in the calling functions, literal value of the input along with a checks property.
      for (var testIndex = 0; testIndex < testStringTests.length; testIndex++)  //For every check a value is to go through
      {
        var testResult = true;  //Set a default bool to true, important in a bit.
        for (var testFunctionsIndex = 0; testFunctionsIndex < Object.keys(functionKeys).length; testFunctionsIndex++)
        {
          var caller = Object.keys(functionKeys)[testFunctionsIndex];  //Get the caller from the function keys I made in the callers.
          var testFunction = Object.values(functionKeys)[testFunctionsIndex]; //Get the paired function.
          if (testStringTests[testIndex] == caller) //Basically, I loop through all of these function keys, looking for ones that match the ones turned into the checkParams object.
          {
            if (testStringParams != null) {report[testString].checks[caller] = await testFunction(testString, testStringParams);} //If the params didn't stay null when checked earlier, run the caller function with params
            else {report[testString].checks[caller] = await testFunction(testString);}  //Otherwise, run it normally.
            if (report[testString].checks[caller]) {testResult = false;}  //Basically, if the function returns true (that there is an error), it will set this to false, as in it is a 'negative' result.
          }
        }
        if (!testResult) {errorCount++;}  //If there was an error in that loop, keeping in mind we are still in a loop for each input, increment the count of errors.
      }
    }
    else {secretsIndices.push(inputIndex);} //So if it didnt have checks, what was it? It was a secret. A message just for the page parsing on the other side, used on the presentationLayer as I wanted two forms on the one page to return errors without having to name sections 'login validation emaill not valid error' and 'register validation emaill not valid error'.
  }

  if (errorCount > 0 && secretsIndices.length > 0)  //If the error count incremented, that is, if there was more than no errors and there was actually a secret, deal with the secret. I limited it to one because that was a special use case.
  {
    var testString = Object.keys(checkParams)[secretsIndices[0]];
    var testStringValues = Object.values(checkParams)[secretsIndices[0]];
    report[testString] = testStringValues
  }
  return await report;  //Return all that, which was all put into the report object. This will get built into a query string for the browser.
}

async function QueryReader(headMessage, validationQueryObject = {})
{//A qstring reading function.
  var report = {};  //create an empty report object.
  if (validationQueryObject.hasOwnProperty("message")) //validationQueryObject is req.query, the q string of the browser on get, so this message property will be visible in the browser, the point of it is to convey relevant and ordered info, eg, I want a validation error message to show before a success message does.
  {
    if (validationQueryObject.message == headMessage)   //See if it is the message I am looking for.
    {
      for (var keyIndex = 0; keyIndex < Object.keys(validationQueryObject).length; keyIndex++)  //If so, loop through all the things in the, presumably, browser q string.
      { //Excluding the message itself, dump the q string object properties handed in to the report object with the relevant key (which is the 'type' from before)
        if (Object.keys(validationQueryObject)[keyIndex] != headMessage) {report[Object.keys(validationQueryObject)[keyIndex]] = await Object.values(validationQueryObject)[keyIndex];}
      }//This  occurs for every property of the query string object handed in.
    }
  }
  return await report;  //This gets Object.assign-ed into the validation info object on get reqs where there are possible errors on page..
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

async function GetMessagesFromString(arrayOfMessagesToPayAttentionTo, source)
{//This function takes an array of messages to look for from the source string.
  //It returns the result which in most cases gets sent straight to the page rendering returning an object of messages to use for PugJS.
  var messagesObject = {};
  for (var messageIndex = 0; messageIndex < arrayOfMessagesToPayAttentionTo.length; messageIndex++) {messagesObject = await Object.assign(messagesObject, await QueryReader(arrayOfMessagesToPayAttentionTo[messageIndex], source));}
  return await messagesObject;
}

//User functions
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
  var userKey = await dataLayer.GetUserKey({email: email}); //Find an account by email address and if not null
  if (userKey != null)
  {
    var token = await GenerateTokenString();  //Generate the token
    var alterUserToken = await dataLayer.UpdateUser(userKey, {tokenString: token, tokenExpiration: Date.now() + (1000*60*60)}); //1 hour from Date.now()
    if (statics.DEV_MODE) {console.log("The tokenstring url to follow for " + email.toString() + " to reset password is: " + statics.SERVER_IP.toString() +":"+ statics.PORT + "/resetpassword?token=" + token + ", it will be valid for an hour.");}
    else   //Email or log based on mode. You may want a terminal that is 3rd party (better than CMD or base linux termainal, more features like clickable links).
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
{//Searches for the user key with the provided token, returns null if not found, else, returns the key.
  var userKey = await dataLayer.GetUserKey({tokenString: token});
  return userKey;
}

async function SetNewPassword(userKey, newPassword)
{//Simply reach into the database and set the new password of the user key, this function is only used at point that the userkey has already been found.
  var newToken = await GenerateTokenString();

  var userKey = await dataLayer.UpdateUser(userKey,{userPassword: newPassword, tokenExpiration: Date.now()}); //If, on the off chance that the key is null, UpdateUser checks. But, basically, set the new params like the token expiry (which needs to be invalid if the new password has been successfully set to prevent random guesses at other peoples tokens).
  return userKey;
}

async function GetProfileDetails(userID)
{//This is used for the profile page. It is getting data to display to the page, so sentance case is needed.
  var queryResults = await dataLayer.ReadUser(userID, ["fName", "lName", "email", "dob"]);
  //Above is one of the only uses of ReadUser, this is done by providing a key and a list of fields you want from it.
  var info = {}
  if (queryResults != null) //Only proceed if the user is found (ReadUser utilises the same null checks as GetUserKey)
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
{//This is used for the profile page. The page sentance cases it and this is used on post as well so lowercase names as in the registration function.
  //UpdateUSer is pretty nifty using the optional object property trick I learned using node modules. It is the only method, asides from creation, to change data.
  var queryResults = await dataLayer.UpdateUser(userID, {fName: fname.toLowerCase(), lName: lname.toLowerCase(), email: email, dob: dob});
  return queryResults;
}

//Improv validation.
//I wont explain these, just state a case.
//With more time, I wanted to implement the express-validator module.
//With project situations, I was in a state of needed to rapidly redesign this system and server in general.
//This led to weird orders of doing things, like, for example, implementing validation myself in a rudamentry (NOT SANITIZED) way before I did the input or output, or it world seem. These are just from iterations past.
//These below are not good, but they work enough to do the job.
//They are pretty easy to follow.
//IF you havent already, find my comments on verification and validation and the difference they meant to me during development.
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
  if (newPassword.length >= 8) {return await false;}  //No complications, just have a pswd longer than 7 characters.
  return await true;
}

async function IsValidAge(dob)
{
  if (await CalculateAge(dob) >= 18.0) {return await false;}  //Privacy policy, I dreaded the idea of having to incorperate COPPA into the policy, so 18 or over.
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
  if (verificationQuery.verified == 0) {verificationQuery.verified = false;}  //SQLisms, its a 1 bit number, not a bool
  if (verificationQuery.verified == 1) {verificationQuery.verified = true;}  //SQLisms, its a 1 bit number, not a bool
  return verificationQuery.verified;
}

async function IsExistingEmail(email, userID = {})
{
  if (userID.hasOwnProperty("userID")) {userID = userID.userID;}
  else {userID = null;}

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

//General
async function SendMail(EmaileeAddress, Subject, Body)
{//This was inspired by W3-Schools, in my own personal experience with email providers, you REALLY need to do things by-the-book otherwise they might ban you, so to keep the email account unbanned and unflagged as spam, I wanted to be very careful, following W3 felt like the safest thing to do.
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

  sender.sendMail(mailOptions, function(error, info){ //possible rewrite for async await if time.
    if (error) { console.log(error);}
    sender.close();
  });
}

async function CalculateAge(dob)
{//This was one of those functions that was super elaborate, only because I mainly program in compiled langauges where time is usually associated with cpu clock time, so the idea of dealing with UTC datestrings was foreign to me.
  //I eventually figured out how to do it simply.
  //Check the reference for JS time though, it is all over the place, refering to years correctly and days between 1-31 but months between 0-11. Weird.
  var now = new Date().getTime();
  var birth = new Date(dob).getTime();
  return await ((now - birth) / (1000 * 3600 * 24)) / 365.25;   //Age in years based off of millis from 1/1/1970 calculated into age from birth.
}

//IN DEVELOPMENT
async function GetListings(queryObject = null)
{
  //Here, if AI was implemented, would it step in and modify listings.
  //Unlike RegisterUser, where I parse params to be what the relational SQL needs, I hand the query object right into the layer, this is because, while in RegisterUser it was straight forward what was going on,
  //the query object needs to be parsed to extract any needed query conditionals, this is why I'm letting a logic layer param go down another level, because (as per n-tier), the data layer should need to be the 'only thing changed' in the event of a DB redesign.
  //If the DB is redesigned, all of the conditionals in the query object will need to be changed in how they result in a conditional, making it easier to just pass down, not worring about breaking it up in this layer.
  //I do, however, do some general fixing of any weird inputs, like maxbeds being less than minbeds etc.
  var fixedQueryObject = {};

  //I annoyingly need to check that users are not entering their own URLs with custom q strings
  if (queryObject.hasOwnProperty("type")) {fixedQueryObject.type = queryObject.type;}

  if (queryObject.hasOwnProperty("minBeds"))
  {
    if (queryObject.minBeds > -1) {fixedQueryObject.minBeds = queryObject.minBeds;}
  }
  if (queryObject.hasOwnProperty("maxBeds"))
  {
    if (queryObject.maxBeds > -1) {fixedQueryObject.maxBeds = queryObject.maxBeds;}
  }

  if (fixedQueryObject.hasOwnProperty("minBeds") && fixedQueryObject.hasOwnProperty("maxBeds"))
  {
    if (fixedQueryObject.minBeds > fixedQueryObject.maxBeds)
    {
      var switcher = fixedQueryObject.minBeds;
      fixedQueryObject.minBeds = fixedQueryObject.maxBeds;
      fixedQueryObject.maxBeds = switcher;
    }
  }

  if (queryObject.hasOwnProperty("searchBy")) {fixedQueryObject.searchBy = queryObject.searchBy;}
  if (queryObject.hasOwnProperty("searchTerm")) {fixedQueryObject.searchTerm = queryObject.searchTerm;}

  var listings = await dataLayer.ReadListings(fixedQueryObject);
  return listings;
}

async function GetListing(id = null)
{
  //Here, if AI was implemented, would it step in and modify listings.
  var listings = await dataLayer.ReadListing(id);
  return listings;
}
//IN DEVELOPMENT

module.exports = {
  //Page exports:
  MasterPageController,
  UserSessionCheck,
  ValidationCheck,
  VerificationCheck,
  QueryBuilder,
  GetMessagesFromString,

  //User exports:
  RegisterUser,
  IsVerifiedAccount,
  LogUserIn,
  SendResetLink,
  SearchToken,
  SetNewPassword,
  RegenerateVerificationCode,
  GetProfileDetails,
  SetProfileDetails,

  //Listing exports:
  //IN DEVELOPMENT
  GetListings,
  GetListing
  //IN DEVELOPMENT
}
