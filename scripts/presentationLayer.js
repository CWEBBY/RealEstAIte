//presentationLayer.js, cw.
//Modules-----------------------------------------------------
//-Built in
//An effort has been made to keep these includes interface level.
const express = require("express");
const session = require("express-session");
const path = require("path");
const bodyParser = require('body-parser');
//-Custom
const statics = require("./statics");
const logicLayer = require("./logicLayer");
//-Instances
var server = express();
//A dashboard for database admin. PENDING WHERE ELIZABETH+CHRIS DECIDE TO HOST.VVV
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
    secure: false//Needs HTTPS.
  },
}));
server.use(bodyParser.urlencoded(
  {
    extended: true
  }
));
server.use("/public", express.static(path.join(__dirname, statics.HTTP_PUBLIC_DIR)));

//Requests-----------------------------------------------------
//-General
function SessionUsersName(key)
{
  return logicLayer.GetUserByID(key);
}

server.get(
  "/",
  function (req, res) {
    //
    var masterPageObject = {};
    if (SessionedUserCheck(req.session)) {masterPageObject.accountButtonTitle= SessionUsersName(req.session.userID).givenName;}

    res.render(
      "index",
      {
        masterInfo: GetMasterInfo(masterPageObject),
      }
    );
  }
)

//-User stuff
server.get(
  "/loginorregister",
  function (req, res) {

    res.render(
      "loginorregister",
      {
        masterInfo: GetMasterInfo(),
      }
    );
  }
)

server.post(
  "/registered",
  function (req, res) {
    if (SessionedUserCheck(req.session))  {res.redirect("/");}  //Just incase users hit the URL
    //else if (!RegisterValidationCheck(req.body.email, req.body.password, req.body.dob)) {res.redirect("/register?");}//Qstring needed
    else
    {
      logicLayer.AddUser(req.body.givenName, req.body.surname, req.body.dob, req.body.email, req.body.password);
      res.redirect("/verify");
      console.log("Worked")
    }
  }
)

server.get(
  "/verify",
  function (req, res) {
    res.render(
      "verify",
      {
        masterInfo: GetMasterInfo(),
      }
    );
  }
)

//CONFIRM PASSWORD
/*server.post(
  "/loginorregister",
  function (req, res) {
    if (SessionedUserCheck(req.session))  {res.redirect("/");}  //Just incase users hit the URL
    //else if (!RegisterValidationCheck(req.body.email, req.body.password, req.body.dob)) {res.redirect("/register?");}//Qstring needed
    else
    {
      logicLayer.AddUser(req.body.givenName, req.body.surname, req.body.dob, req.body.email, req.body.password);
      res.redirect("/verify");
      console.log("Worked")
    }
  }
)*/

server.post(
  "/verify",
  function (req, res) {
    if (SessionedUserCheck(req.session))  {res.redirect("/");}  //Just incase users hit the URL
    //else if (!RegisterValidationCheck(req.body.email, req.body.password, req.body.dob)) {res.redirect("/register?");}//Qstring needed
    else
    {
      logicLayer.AddUser(req.body.givenName, req.body.surname, req.body.dob, req.body.email, req.body.password);
      res.redirect("/verify");
    }
  }
)

//Move these
function SessionedUserCheck (session)
{
  if (!session.userID) {return false;}
  return true;
}

function RegisterValidationCheck ()
{
    //Form validation and check for account prior
  return true;
}

//Functions-----------------------------------------------------
var GetMasterInfo = function(masterInfoObject = {})
{
  return (
    {
      pageTitle: masterInfoObject.pageTitle || "Real Est(ai)te | The good solution to real estate",
      accountButtonTitle: masterInfoObject.accountButtonTitle || "Log in / Register",
    }
  );
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
