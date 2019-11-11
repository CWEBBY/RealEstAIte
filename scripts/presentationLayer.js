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
async function SessionUsersName(session)
{
  if (session.userID) {return "My Account";}
  else {return "Log In / Register";}
}

server.get(
  "/",
  async function (req, res) {
    //
    var masterPageObject = logicLayer.MasterPageController({
        anonSession:  !logicLayer.UserSessionCheck(req.session.userID)
    });

    res.render(
      "index",
      {
        masterInfo: masterPageObject,
      }
    );
  }
)

//-User stuff
//Gets
server.get(
  "/loginorregister",
  async function (req, res) {
    var masterPageObject = logicLayer.MasterPageController({
        anonSession: !logicLayer.UserSessionCheck(req.session.userID),
        linksBlocked: true
    });

    var formErrorsObject = {
      register : {email: [], fname: [], lname: [], dob: [], password: [], passwordConfirm: []},
      login: {email: [], password: []}
    };

    //Not sure if it will be mentioned anywhere else, validation in this project means validating data to make sense, verification means checking the database for verification.
    var errorReport = logicLayer.QueryReader("validationError", req.query);
    if (errorReport.hasOwnProperty("poster"))  //In this case, this will either have an error where this property is set, or it won't have an error.
    {//Validation, general parsing.
      if (errorReport.poster == "register") {formErrorsObject.register = Object.assign(formErrorsObject.register, errorReport);}
      else if (errorReport.poster == "login") {formErrorsObject.login = Object.assign(formErrorsObject.login, errorReport);}
    }
    else //If it doesn't have an error.
    {//Verification, checking details from the database.
      errorReport = logicLayer.QueryReader("verificationError",req.query);
      if (errorReport.poster == "register") {formErrorsObject.register = Object.assign(formErrorsObject.register, errorReport);}
      else if (errorReport.poster == "login") {formErrorsObject.login = Object.assign(formErrorsObject.login, errorReport);}
    }
    //Ordered the way above as verification from the database is irrelevant if the data is not valid in general. (eg, no point hitting the database for an email if it is missing its "@")
    res.render(
      "loginorregister",
      {
        masterInfo: masterPageObject,
        formErrors: formErrorsObject
      }
    );
  }
)

server.get(
  "/verify",
  async function (req, res) {
    var masterPageObject = logicLayer.MasterPageController({
        anonSession: !logicLayer.UserSessionCheck(req.session.userID),
        linksBlocked: true
    });
    var validationErrorsObject = {
      email: [],
      fname: [],
      lname: [],
      dob: [],
      password: []
    };
    validationErrorsObject = await Object.assign(validationErrorsObject, await logicLayer.QueryReader("validationError", await req.query));
    res.render(
      "verify",
      {
        masterInfo: masterPageObject,
        validationInfo: validationErrorsObject
      }
    );
  }
)

//Posts
server.post(
  "/register",
  async (req, res) => {
    if (logicLayer.UserSessionCheck(req.session.userID))  {res.redirect("/");}  //Just incase users hit the URL randomly
    else
    {
      var errorReport = await logicLayer.ValidationCheck({
        //Input: {{type}, [subscribedChecks]}
        [req.body.email]: {type: "email", checks: ["validEmail"]},
        [req.body.givenName]: {type: "fname", checks: ["notEmpty"]},
        [req.body.surname]: {type: "lname", checks: ["notEmpty"]},
        [req.body.dob]:{type: "dob", checks: ["validAge"]},
        [req.body.password]: {type: "password", checks: ["validPassword"]},
        poster: {type: "register"}
      });
      errorReport = await logicLayer.QueryBuilder("validationError", errorReport);
      if (errorReport.flag) {res.redirect("/loginorregister"+errorReport.string);}
      else
      {
        errorReport = await logicLayer.VerificationCheck({
          [req.body.email]: {type: "email", checks: ["existingEmail"]},
          poster: {type: "register"}
        });
        errorReport = await logicLayer.QueryBuilder("verificationError", errorReport);

        if (errorReport.flag) {res.redirect("/loginorregister"+errorReport.string);}
        else
        {
          logicLayer.RegisterUser({fName: req.body.givenName, lName: req.body.surname, email: req.body.email, password: req.body.password,dob: req.body.dob})
          res.redirect("/verify");
        }
      }
    }
  }
)

server.post(
  "/login",
  async (req, res) => {
    if (logicLayer.UserSessionCheck(req.session.userID))  {res.redirect("/");}  //Just incase users hit the URL randomly
    else
    {
      var errorReport = await logicLayer.ValidationCheck({
        //Input: {{type}, [subscribedChecks]}
        [req.body.email]: {type: "email", checks: ["validEmail"]},
        [req.body.password]: {type: "password", checks: ["validPassword"]},
        poster: {type: "login"}
      });
      errorReport = await logicLayer.QueryBuilder("validationError", errorReport);
      if (errorReport.flag) {res.redirect("/loginorregister"+errorReport.string);}
      else
      {
        errorReport = await logicLayer.VerificationCheck({
          [req.body.email]: {type: "email", checks: ["newEmail"]},
          [req.body.password]: {type: "password", checks: ["correctPassword"], params: {email: req.body.email}},
          poster: {type: "login"}
        });
        errorReport = await logicLayer.QueryBuilder("verificationError", errorReport);
        if (errorReport.flag) {res.redirect("/loginorregister"+errorReport.string);}
        else
        {
          var verificationCheck = await logicLayer.IsVerifiedAccount(req.body.email);
          if (verificationCheck)
          {
            var sessionID = await logicLayer.LogUserIn(req.body.email);
            req.session.userID = sessionID;
            res.redirect("/");
          }
          else {res.redirect("/verify");}
        }
      }
    }
  }
)

server.post(
  "/verify",
  async (req, res) => {
    if (logicLayer.UserSessionCheck(req.session.userID))  {res.redirect("/");}  //Just incase users hit the URL randomly
    else
    {
      var errorReport = await logicLayer.ValidationCheck({
        //Input: {{type}, [subscribedChecks]}
        [req.body.email]: {type: "email", checks: ["validEmail"]},
        [req.body.password]: {type: "password", checks: ["validPassword"]},
        [req.body.code]: {type: "code", checks: ["validCode"]}
      });

      errorReport = await logicLayer.QueryBuilder("validationError", errorReport);
      if (errorReport.flag) {res.redirect("/verify"+errorReport.string);}
      else
      {
        errorReport = await logicLayer.VerificationCheck({
          [req.body.email]: {type: "email", checks: ["newEmail"]},
          [req.body.password]: {type: "password", checks: ["correctPassword"], params: {email: req.body.email}},
          [req.body.code]: {type: "code", checks: ["correctCode"], params: {email: req.body.email}}
        });
        errorReport = await logicLayer.QueryBuilder("verificationError", errorReport);
        if (errorReport.flag) {res.redirect("/verify"+errorReport.string);}
        else
        {
          var sessionID = await logicLayer.LogUserIn(req.body.email);
          req.session.userID = sessionID;
          res.redirect("/");
        }
      }
    }
  }
)

//Listeners-----------------------------------------------------
server.listen(
  statics.PORT,
  statics.SERVER_IP,  //FIX THIS STUPID 0.0.0.0 THING
  function()
  {
    console.log("For http, go to " + statics.SERVER_IP + ":"+statics.PORT)
  }
)
