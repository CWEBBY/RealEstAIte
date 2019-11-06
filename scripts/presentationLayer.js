//presentationLayer.js, cw.
//Modules-----------------------------------------------------
//-Built in
const express = require("express");
const session = require("express-session");
const expressValidator = require("express-validator");
const path = require("path");
const bodyParser = require('body-parser');

//-Custom
const statics = require("./statics");
const logicLayer = require("./logicLayer");

//-Instances
var server = express();
//var admin = express();

//Middleware-----------------------------------------------------
server.set("views", path.join(__dirname, "../resources/pages"));
server.set("view engine", "pug");

//Misc-----------------------------------------------------
server.use(session({
  name: "sid",
  resave: false,
  secret: "01e91c96d838c66a56f4a60c77979628", //MD5 hash of "realestaite"... would be something less obvious normally.
  saveUninitialized: false,
  cookie: {
    sameSite: true,
    secure: false//Needs HTTPS for true. Don't have certificate.
  },
}));
server.use(expressValidator());
server.use(bodyParser.urlencoded({extended: true}));
server.use("/public", express.static(path.join(__dirname, statics.HTTP_PUBLIC_DIR)));

//Requests-----------------------------------------------------
//-General
function SessionUsersName(session)
{
  if (session.userID) {return "My Account";}
  else {return "Log In / Register";}
}

server.get(
  "/",
  function (req, res) {
    //
    var masterPageObject = {};
    if (SessionedUserCheck(req.session))
    {
      masterPageObject.anonSession = false;
    }

    res.render(
      "index",
      {
        masterInfo: GetMasterInfo(masterPageObject),
      }
    );
  }
)

//-User stuff
//Gets
server.get(
  "/loginorregister",
  function (req, res) {
    var masterInfoObject = {};
    var qStringErrors = {};

    //Refactor this later
    var qString = req.query;
    qStringErrors = {
      registraionErrors : {
        notOldEnough: false,
        lastEmpty: false,
        firstEmpty: false,
        emailAlreadyExists: false,
        emailNotValid: false,
        passwordNotConfirmed: false,
        passwordTooShort: false
      },
      loginErrors : {
        emailNotRegistered: false,
        emailNotValid: false,
        passwordIncorrect: false
      }
    }

    if (qString.hasOwnProperty("validationError"))
    {
      qString = qString.validationError;
      //This runaround is due to the fact that PugJS's in-script syntax doesn't allow for more elegant checking. It basically wants bools. Will Refactor later.
      if (qString.includes("ageNotEnough")) {qStringErrors.registraionErrors.notOldEnough = true;}
      if (qString.includes("lnameEmpty")) {qStringErrors.registraionErrors.lastEmpty = true;}
      if (qString.includes("fnameEmpty")) {qStringErrors.registraionErrors.firstEmpty = true;}
      if (qString.includes("emailAlreadyExists")) {qStringErrors.registraionErrors.emailAlreadyExists = true;}
      if (qString.includes("emailNotValid")) {qStringErrors.registraionErrors.emailNotValid = true;}
      if (qString.includes("passwordNotSame")) {qStringErrors.registraionErrors.passwordNotConfirmed = true;}
      if (qString.includes("passwordTooShort")) {qStringErrors.registraionErrors.passwordTooShort = true;}
    }
    else if (qString.hasOwnProperty("verificationError"))
    {
      qString = qString.verificationError;
      //This runaround is due to the fact that PugJS's in-script syntax doesn't allow for more elegant checking. It basically wants bools. Will Refactor later.
      if (qString.includes("emailNotRegistered")) {qStringErrors.loginErrors.emailNotRegistered = true;}
      if (qString.includes("emailNotValid")) {qStringErrors.loginErrors.emailNotValid = true;}
      if (qString.includes("passwordIncorrect")) {qStringErrors.loginErrors.passwordIncorrect = true;}
    }

    masterInfoObject.linksBlocked = true;
    res.render(
      "loginorregister",
      {
        masterInfo: GetMasterInfo(masterInfoObject),
        formInfo: qStringErrors
      }
    );
  }
)

server.get(
  "/verify",
  function (req, res) {

    var qString = req.query;
    var queryErrors = {
      validation: {
        emailNotUsed: false,
        emailNotValid: false,
        passwordNotValid: false,
        codeNotCorrect: false
      }
    }

    if (qString.hasOwnProperty("verificationError"))
    {
      qString = qString.verificationError;
      if (qString.includes("emailNotRegistered")) {queryErrors.validation.emailNotUsed = true;}
      if (qString.includes("emailNotValid")) {queryErrors.validation.emailNotValid = true;}
      if (qString.includes("passwordIncorrect")) {queryErrors.validation.passwordNotValid = true;}
      if (qString.includes("wrongCode") || qString.includes("codeNotValid")) {queryErrors.validation.codeNotCorrect = true;}
    }
    res.render(
      "verify",
      {
        masterInfo: GetMasterInfo(),
        validationInfo: queryErrors.validation
      }
    );
  }
)

server.get(
  "/reverify",
  function (req, res) {

    var qString = req.query;
    var queryErrors = {
      validation: {
        emailNotUsed: false,
        emailNotValid: false,
      }
    }

    if (qString.hasOwnProperty("verificationError"))
    {
      qString = qString.verificationError;
      if (qString.includes("emailNotRegistered")) {queryErrors.validation.emailNotUsed = true;}
      if (qString.includes("emailNotValid")) {queryErrors.validation.emailNotValid = true;}
    }

    res.render(
      "reverify",
      {
        masterInfo: GetMasterInfo(),
        validationInfo: queryErrors
      }
    );
  }
)

server.get(
  "/profile",
  function (req, res) {
    if (SessionedUserCheck(req.session))
    {
      var user = logicLayer.GetUser(req.session.userID);
      var qString = req.query;
      var qMessages = {
        saved: false
      };
      var qErrors = {
        fnameInvalid: false,
        lnameInvalid: false,
        emailAlreadyExists: false,
        emailInvalid: false,
        notOldEnough: false,
      }

      if (qString.hasOwnProperty("validationError"))
      {
        qString = qString.validationError;
        if (qString.includes("emailAlreadyExists")) {qErrors.emailAlreadyExists = true;}
        if (qString.includes("emailNotValid")) {qErrors.emailNotValid = true;}
        if (qString.includes("lnameEmpty")) {qErrors.lnameInvalid = true;}
        if (qString.includes("fnameEmpty")) {qErrors.fnameInvalid = true;}
        if (qString.includes("ageNotEnough")) {qErrors.ageNotEnough = true;}
      }
      else if (qString.hasOwnProperty("message"))
      {
        qString = qString.message;
        if (qString.includes("saved")) {qMessages.saved = true;}
      }

      var userInfo = {
        fname: user.givenName,
        lname: user.surname,
        email: user.email,
        dob: user.dob
      }
      res.render(
        "profile",
        {
          masterInfo: GetMasterInfo({}),
          userInfo: userInfo,
          validationInfo: qErrors,
          messageInfo: qMessages
        }
      );
    }
    else
    {
      res.redirect("/");
    }
  }
)

server.get(
  "/resetpassword",
  function (req, res) {
    if (SessionedUserCheck(req.session)) {res.redirect("/");}
    else
    {
      var qString = req.query;
      var qErrors = {
        passwordNotValid: false,
        passwordsDoNotMatch: false,
        invalidLink: false
      }

      if (qString.hasOwnProperty("validationError"))
      {
        qString = qString.validationError;
        if (!qString.includes("miscError")) {qErrors.invalidLink = true;}
        if (!qString.includes("passwordTooShort")) {qErrors.passwordNotValid = true;}
        if (qString.includes("passwordNotSame")) {qErrors.passwordsDoNotMatch = true;}
      }

      if (qString.hasOwnProperty("token"))
      {
        var token = qString.token;
        req.session.token = token;
        var user = logicLayer.GetUser(logicLayer.GetUserKey({token: token}));
        if (user == null) {qErrors.invalidLink = true;}
      }
      else{qErrors.invalidLink = true;}

      res.render(
        "resetpassword",
        {
          masterInfo: GetMasterInfo({}),
          validationInfo: qErrors,
        }
      );
    }
  }
)

server.get(
  "/logout",
  function (req, res) {
    if (SessionedUserCheck(req.session)) {req.session.destroy();}
    res.redirect("/");
  }
)

server.get(
  "/forgot",
  function (req, res) {

    var qString = req.query;
    var qMessages = {
      resetSent: false
    };
    var qErrors = {
      emailDoesNotExists: false,
      emailNotValid: false,
    }

    if (qString.hasOwnProperty("validationError"))
    {
      qString = qString.validationError;
      if (qString.includes("emailDoesNotExists")) {qErrors.emailDoesNotExists = true;}
      if (qString.includes("emailNotValid")) {qErrors.emailNotValid = true;}
    }
    else if (qString.hasOwnProperty("message"))
    {
      qString = qString.message;
      if (qString.includes("sent")) {qMessages.resetSent = true;}
    }

    res.render(
      "forgot",
      {
        masterInfo: GetMasterInfo({}),
        validationInfo: qErrors,
        messageInfo: qMessages
      }
    );
  }
)

server.get(
  "/policy",
  function (req, res) {
    res.render(
      "policy",
      {
        masterInfo: GetMasterInfo({}),
      }
    );
  }
)

//Posts
server.post(
  "/register",
  function (req, res) {
    if (SessionedUserCheck(req.session))  {res.redirect("/");}  //Just incase users hit the URL
    else
    {
      //Down the validation chain, none of this is sanitized, this could come later, I'd say there are bigger issues in implementation like session storage first.
      //Not good still, if we are storing passwords as well.
      var errorReport = {flag: false, string: ""};
      errorReport = ValidateNewName(errorReport, req.body.givenName, req.body.surname);
      errorReport = ValidateNewEmail(errorReport, req.body.email);
      errorReport = ValidateAge(errorReport, CalculateAge(req.body.dob.split("-")));
      errorReport = ValidateNewPassword(errorReport, req.body.password, req.body.confirmPassword);
      //NODEJS has a big problem with checkboxes for some reason, this means that policy consent is checked on the client, only reason wouldn't be valid is if client was toying with the html.
      //This is the reason, that is, toying with the page on the client side, that validation is done server side.
      if (errorReport.flag)
      {
        errorReport.string = errorReport.string.substring(1, errorReport.string.length);  //Strip first ampersand
        errorReport.string = "?" + errorReport.string;
        res.redirect("/loginorregister"+errorReport.string);
      }
      else
      {
        logicLayer.AddUser({
          givenName: req.body.givenName,
          surname: req.body.surname,
          dob: req.body.dob,
          email: req.body.email,
          password: req.body.password
        });
        logicLayer.SendUserVerification(logicLayer.GetUserKey({email: req.body.email})); //Not sure of the async of this, may break if it takes time to add user to database.
        res.redirect("/verify");
      }
    }
  }
)

server.post(
  "/login",
  function (req, res) {
    if (SessionedUserCheck(req.session))  {res.redirect("/");}  //Just incase users hit the URL
    else
    {
      //Down the validation chain
      var errorReport = {flag: false, string: ""};
      errorReport = VerifyLogin(errorReport, req.body.email, req.body.password);
      if (errorReport.flag)
      {
        errorReport.string = errorReport.string.substring(1, errorReport.string.length);  //Strip first ampersand
        errorReport.string = "?" + errorReport.string;
        res.redirect("/loginorregister"+errorReport.string);
      }
      else
      {
        var key = logicLayer.GetUserKey({email:req.body.email});
        if (logicLayer.ConfirmVerified(key))
        {
          req.session.userID = key;
          res.redirect("/");
        }
        else { res.redirect("/verify"); }
      }
    }
  }
)

server.post(
  "/verify",
  function (req, res) {
    if (SessionedUserCheck(req.session))  {res.redirect("/");}  //Just incase users hit the URL
    else
    {
      //Down the validation chain
      var key = logicLayer.GetUserKey({email:req.body.email});
      var errorReport = {flag: false, string: ""};
      errorReport = VerifyLogin(errorReport, req.body.email, req.body.password);
      errorReport = VerifyVerification(errorReport, key, req.body.code)
      if (errorReport.flag)
      {
        errorReport.string = errorReport.string.substring(1, errorReport.string.length);  //Strip first ampersand
        errorReport.string = "?" + errorReport.string;
        res.redirect("/verify"+errorReport.string);
      }
      else
      {
        if (logicLayer.ConfirmUser(key, req.body.code))
        {
          req.session.userID = key;
          res.redirect("/");
        }
      }
    }
  }
)

server.post(
  "/saveprofile",
  function (req, res) {
    if (SessionedUserCheck(req.session))
    {
      //Down the validation chain, none of this is sanitized, this could come later, I'd say there are bigger issues in implementation like session storage first.
      var errorReport = {flag: false, string: ""};
      errorReport = ValidateNewName(errorReport, req.body.fname, req.body.lname);
      //TO DO: Check if old emaill is still in use...
      errorReport = ValidateNewEmail(errorReport, req.body.email);
      errorReport = ValidateAge(errorReport, CalculateAge(req.body.dob.split("-")));
      if (errorReport.flag)
      {
        errorReport.string = errorReport.string.substring(1, errorReport.string.length);  //Strip first ampersand
        errorReport.string = "?" + errorReport.string;
        res.redirect("/profile"+errorReport.string);
      }
      else
      {
        logicLayer.UpdateUser(req.session.userID, {fname:req.body.fname, lname:req.body.lname, dob:req.body.dob, email:req.body.email});
        res.redirect("/profile?message=saved");
      }
    }
    else {res.redirect("/");}
  }
)

server.post(
  "/reverify",
  function (req, res) {
    if (SessionedUserCheck(req.session))  {res.redirect("/");}  //Just incase users hit the URL
    else
    {
      var errorReport = {flag: false, string: ""};
      errorReport = VerifyEmail(errorReport, req.body.email);
      if (errorReport.flag)
      {
        errorReport.string = errorReport.string.substring(1, errorReport.string.length);  //Strip first ampersand
        errorReport.string = "?" + errorReport.string;
        res.redirect("/reverify"+errorReport.string);
      }
      else
      {
        logicLayer.SendUserVerification(logicLayer.GetUserKey({email: req.body.email}));
        res.redirect("/reverify");
      }
    }
  }
)

server.post(
  "/forgot",
  function (req, res) {
    if (SessionedUserCheck(req.session))
    {
      req.session.destroy();
      res.redirect("/");
    }  //Just incase users hit the URL
    else
    {
      var errorReport = {flag: false, string: ""};

      if (!CheckEmailExistance(req.body.email))
      {
        errorReport.flag = true;
        errorReport.string += "&validationError=emailDoesNotExists";  //Validation logic really needs refactoring, looking at a validation module later.
      }
      if (!CheckEmailValidity(req.body.email))
      {
        errorReport.flag = true;
        errorReport.string += "&validationError=emailNotValid";
      }
      if (errorReport.flag)
      {
        errorReport.string = errorReport.string.substring(1, errorReport.string.length);  //Strip first ampersand
        errorReport.string = "?" + errorReport.string;
        res.redirect("/forgot"+errorReport.string);
      }
      else
      {
        logicLayer.SendReset(logicLayer.GetUserKey({email: req.body.email}));
        res.redirect("/forgot?message=sent");
      }
    }
  }
)

server.post(
  "/resetpassword",
  function (req, res) {
    if (!SessionedUserCheck(req.session))
    {
      //Down the validation chain, none of this is sanitized, this could come later, I'd say there are bigger issues in implementation like session storage first.
      var errorReport = {flag: false, string: ""};
      errorReport = ValidateNewPassword(errorReport, req.body.password, req.body.confirmPassword);
      if (errorReport.flag)
      {
        errorReport.string = errorReport.string.substring(1, errorReport.string.length);  //Strip first ampersand
        errorReport.string = "?" + errorReport.string;
        res.redirect("/resetpassword"+errorReport.string);
      }
      else
      {
        if (req.session.token)
        {
          logicLayer.UpdateUser(logicLayer.GetUserKey({token: req.session.token}), {password: req.body.password, resetToken: {string: req.session.token, expiration: Date.now()}});
          req.session.destroy();
          res.redirect("/");
        }
        else
        {
          res.redirect("/forgot?validationError=miscError");  //Not elegant, but arriving here means there was user mischief ending up posting but not getting.
        }
      }
    }
    else {res.redirect("/");}
    }
)


//Functions-----------------------------------------------------
function SessionedUserCheck (session)
{
  if (!session.hasOwnProperty("userID")) {return false;}
  return true;
}

function GetDateString()
{
  var time = new Date();
  var year = time.getFullYear();
  var month = time.getMonth()+1;
  var day = time.getDate();
  var dateString = year + "-" + month + "-" + day;
  return dateString;
}

function CheckEmailExistance(email)
{
  if (logicLayer.GetUserKey({email:email}) != null) //If cant fetch key by email
  {
    return true;
  }
  return false;
}

function CheckEmailValidity(email)
{
  if (!email.includes("@") || !email.includes("."))
  {
    return false;
  }
  return true;
}

function CalculateAge(dob)
{
  var now = new Date();
  var nowString = now.getDate().toString();
  if (nowString.length == 1) {nowString = "0"+nowString;}
  nowString+= "/" + (now.getMonth()+1).toString();
  nowString+= "/" + now.getFullYear().toString();
  if (dob[1].length == 1) {dob[1] = "0"+dob[1]}
  var dobString = dob[1] + "/" + dob[2] + "/" + dob[0];

  var dobDate = new Date(dobString);
  var nowDate = new Date(nowString);

  return (((nowDate.getTime() - dobDate.getTime()) / (1000 * 3600 * 24)) /365.25);
}

function GetMasterInfo(masterInfoObject = {})
{
  var masterInfo = {};

  if (masterInfoObject.hasOwnProperty("anonSession")){masterInfo.anonSession = masterInfoObject.anonSession;}
  else {masterInfo.anonSession = true;}

  if (masterInfoObject.hasOwnProperty("linksBlocked")){masterInfo.linksBlocked = masterInfoObject.linksBlocked;}
  else {masterInfo.linksBlocked = false;}

  if (masterInfoObject.hasOwnProperty("pageTitle")){masterInfo.pageTitle = masterInfoObject.pageTitle;}
  else {masterInfo.pageTitle = "Real Est(ai)te | The good solution to real estate";}

  return (masterInfo);
}

function ValidateNewPassword(reportObject, newPassword, newPasswordConfirmation = newPassword)
{
  if (newPassword.length < 8) {
    reportObject.flag = true;
    reportObject.string += "&validationError=passwordTooShort";
  }
  if (newPassword != newPasswordConfirmation && newPasswordConfirmation!=null)
  {
    reportObject.flag = true;
    reportObject.string += "&validationError=passwordNotSame";
  }
  return reportObject;
}

function ValidateAge(reportObject, floatAge)
{
  if (floatAge < 18.0)
  {
    reportObject.flag = true;
    reportObject.string += "&validationError=ageNotEnough";
  }
  return reportObject;
}

function ValidateNewEmail(reportObject, newEmail)
{
  if (CheckEmailExistance(newEmail))
  {
    reportObject.flag = true;
    reportObject.string += "&validationError=emailAlreadyExists";
  }
  else if (CheckEmailValidity(newEmail))
  {
    reportObject.flag = true;
    reportObject.string += "&validationError=emailNotValid";
  }
  return reportObject;
}

function ValidateNewName(reportObject, newFname, newLname)
{
  if (newFname.length == "")
  {
    reportObject.flag = true;
    reportObject.string += "&validationError=fnameEmpty";
  }
  if (newLname.length == "")
  {
    reportObject.flag = true;
    reportObject.string += "&validationError=lnameEmpty";
  }
  return reportObject;
}

function VerifyLogin(reportObject, email, password)
{
  reportObject = VerifyEmail(reportObject, email);
  if (!reportObject.flag)
  {
    reportObject = VerifyPassword(reportObject, logicLayer.GetUserKey({email:email}), password);
  }
  return reportObject;
}

function VerifyPassword(reportObject, key, password)
{
  if (!logicLayer.ConfirmPassword(key, password))
  {
    reportObject.flag = true;
    reportObject.string += "&verificationError=passwordIncorrect";
  }
  return reportObject;
}

function VerifyEmail(reportObject, email)
{
  if (!email.includes("@") || !email.includes("."))
  {
    reportObject.flag = true;
    reportObject.string += "&verificationError=emailNotValid";
  }
  else
  {
    var key = logicLayer.GetUserKey({email:email});
    if (key == null)
    {
      reportObject.flag = true;
      reportObject.string += "&verificationError=emailNotRegistered";
    }
  }
  return reportObject;
}

function VerifyVerification(reportObject, key, code)
{
  if (code.length != 4)
  {
    reportObject.flag = true;
    reportObject.string += "&verificationError=codeNotValid";
  }
  else
  {
    if (!logicLayer.ConfirmCode(key, code))
    {
      reportObject.flag = true;
      reportObject.string += "&verificationError=wrongCode";
    }
  }
  return reportObject;
}

//Listeners-----------------------------------------------------
server.listen(
  statics.PORT,
  statics.SERVER_IP,
  function()
  {
    console.log("For http, go to " + statics.SERVER_IP + ":"+statics.PORT)
  }
)
