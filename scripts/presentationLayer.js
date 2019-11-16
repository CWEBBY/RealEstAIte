//presentationLayer.js, cw.
//This script contains all needed functions pertaining to the presentation of the service.
//It provides the server logic involved in traffic routes as well as getting data from the logic layer to render the pages.
//Modules-----------------------------------------------------
//-Built in
const express = require("express"); //For the routes
const session = require("express-session"); //For the sessional stuff
const path = require("path"); //For the static path for page resources
const bodyParser = require('body-parser');  //For body data

//-Custom
const statics = require("./statics");
const logicLayer = require("./logicLayer");

//Instances
var server = express();
//var admin = express();
//'admin' would have been implemented if time permitted, a control portal for the database and AI maintanence.
//In the sample project, multiple systems are at play with user permissions allowing access to said systems depending on authority.
//This would have been that.

//Middleware-----------------------------------------------------
server.set("views", path.join(__dirname, "../resources/pages"));  //Sets static resources for client side stuff like css, imgs and js.
server.set("view engine", "pug"); //rendering middleware, PugJS.

//Misc-----------------------------------------------------
server.use(session({
  name: "sid",
  resave: false,
  secret: "01e91c96d838c66a56f4a60c77979628", //MD5 hash of "realestaite"... would be something less obvious normally.
  saveUninitialized: false,
  cookie: {
    sameSite: true,
    secure: false //Needs HTTPS for true. Don't have certificate. Didn't want to risk complications with browsers.
  },
}));
server.use(bodyParser.urlencoded({extended: true}));
server.use("/public", express.static(path.join(__dirname, statics.HTTP_PUBLIC_DIR)));

//Requests-----------------------------------------------------
//Get and Post reqs of pages.
//-General
server.get(
  "/",
  async (req, res) => {
    //A quick rundown of how these routes work as this is a basic route...

    //Firstly, I create an object I am sending in to the page of PugJS to render.
    //This contains materpage info, in this case, whether or not the session is anon.
    //In this case, this value is whatever is opposite whether a sessional user ID was found (whether a user was logged in).
    //This will be used to decide what 'profile menu' the viewer sees.
    //It can contain other properties like whether or not that menu shows at all, for example, I don't want you to have a 'log in / sign up' button on the same page you are doing just that on.
    //The function called from the logic layer just sets the defaults of whatever is not put in the object here.
    //The layer design I desided to follow was based off of research I did when I read the following article about n-tier in Node.
    //https://dev.to/santypk4/bulletproof-node-js-project-architecture-4epf
    var masterPageObject = logicLayer.MasterPageController({anonSession:  !logicLayer.UserSessionCheck(req.session.userID)});

    //Then I send the object to the rendering function, providing the 'index' view.
    //Render the page and then the response is complete.
    //There will be a seperate rundown on the first Post route further down.
    res.render("index", {masterInfo: masterPageObject,});
  }
)

server.get(
  "/logout",
  async (req, res) => {
    //Nothing much, just cookie destroy and redirect to main.
    if (req.session.userID) {req.session.destroy();}
    res.redirect("/");
  }
)

server.get(
  "/policy",
  async (req, res) => {
    //I made a suggestion of including policy in the scope document.
    //The page content should have been changed by sumbission to conform with AUS privacy policy.
    var masterPageObject = logicLayer.MasterPageController({anonSession:  !logicLayer.UserSessionCheck(req.session.userID)});
    var contactObject = {email: statics.EMAIL_ADDRESS};
    res.render("policy", {masterInfo: masterPageObject, contactObject});
  }
)

//-User stuff
//Gets
server.get(
  "/loginorregister",
  //This one.... was not fun.
  async (req, res) => {
    //First case of using the 'linksBlocked' property of the masterpage, with the anon check in case anything went wrong rendering.
    var masterPageObject = logicLayer.MasterPageController({
        anonSession: !logicLayer.UserSessionCheck(req.session.userID),
        linksBlocked: true
    });

    //This.... needs explaination...
    //Due to the manner in which I had to quickly build this site, the order I built it in was in such a certain way that meant I needed to rush some needed functionality.
    //This is the case with validation.
    //There is a module (known as express-validator) that quite easily validates AND SANITIZES input.
    //A learning experience for me was to use more of NodeJS's capabilites to maximise the value of this site, but with rushed circumstances, I needed to improvise without taking the time to learn about new tools.
    //With this being done so early in the rushed timeline of things, it was improvised. As a result, it could be better, could be easier to read and less cumbersome and could be more useful as it does not really sanatize.
    //Ultimately, had I have had the time, I would have implemented express-validator.
    //So, the rundown.
    //I have a object that I am filling with keys, these are relevant to page rendering and are instanciated as blank, it will be evident why soon..
    var messagesObject = {
      register : {email: [], fname: [], lname: [], dob: [], password: []},
      login: {email: [], password: []}
    };

    //Here, I'd like to mention that, during development, there was a difference in meanings between validation and verification.
    //In my head, validation meant 'is the form correct' and verification meant 'this needs to go back to existing data to be checked'
    //Hence why, below, there is the two different terms...
    //Also, there, only on this page, is a complication in readabilty as there are two forms on the same page.
    //This is the get route of the login / sign up, so there are three reasons this route would be used.
    //1. A fresh page get, eg, a new viewer wants to make an account.
    //2. A form error on the login form that redirects here
    //3. A form error on the register form that redirects here.
    //The above error object contains objects for each form, each of which has a key for each input on the page, important in page rendering.
    //These keys are set to empty as if to suggest that, upon creation, there are no errors.

    //So, to figure out what is what, amongst more forms per page than nodejs likes, I check several things.
    //This next thing is somthing I'd do differently if I had the time. It is reccomended to not use query strings for anything but querys, instead, maybe handling errors internally or via ajax.
    //But with no time, and that I knew I wasn't using qstrings on this page anyway, I used qstrings as a means to convey errors.

    //First, using async await to halt until result (this becomes an annoying repetition of async await as I didn't have the time to implement a proper async solution).
    //The logic layer function is a deparser, THIS GETS COMPLICATED AND WILL BE EXPLAINED THERE.
    //Basically, the function returns an object that will, in this case, have a special message containing which form the error is for, along with keys for the any LATER SPECIFIED errors.
    //A key to the qstring errors is the idea of  the message key. If the error is a validation error, it will be the string 'validationError', same with a verification error as well as any other messages to the rendering, like successes.
    messagesObject.register = await Object.assign(messagesObject.register, await logicLayer.GetMessagesFromString(["validationError", "verificationError"], req.query));
    messagesObject.login = await Object.assign(messagesObject.login, await logicLayer.GetMessagesFromString(["validationError", "verificationError"], req.query));

    //Because of that, I can structure if/else if/else statements to order these error test results in the order they should be shown.
    //After that, render
    res.render("loginorregister", {masterInfo: masterPageObject, messagesInfo: messagesObject});
  }
)

server.get(
  "/profile",
  async (req, res) => {
    if (!logicLayer.UserSessionCheck(req.session.userID))  {res.redirect("/loginorregister");}
    {
      //What is not commented on here is as above.
      var masterPageObject = logicLayer.MasterPageController({anonSession: !logicLayer.UserSessionCheck(req.session.userID)});

      //Input fields are for the settings changable in the profile page.
      var messagesObject = {email: [], fname: [], lname: [], dob: [], message: []};
      messagesObject = await Object.assign(messagesObject, await logicLayer.GetMessagesFromString(["validationError", "verificationError", "saved"], req.query));

      //Getting the user info to set the values of the form elements to them.
      var userObject = await logicLayer.GetProfileDetails(req.session.userID);

      res.render(
        "profile",
        {
          masterInfo: masterPageObject,
          messagesInfo: messagesObject,
          userInfo: profileInfoObject
        }
      );
    }
  }
)

server.get(
  "/forgot",
  async (req, res) => {
    var masterPageObject = logicLayer.MasterPageController({
        anonSession: !logicLayer.UserSessionCheck(req.session.userID),
        linksBlocked: true
    });

    //Input fields are for the the sending of an email.
    var messagesObject = {email: [], message: []};
    messagesObject = await Object.assign(messagesObject, await logicLayer.GetMessagesFromString(["validationError", "verificationError", "resent"], req.query));

    res.render(
      "forgot",
      {
        masterInfo: masterPageObject,
        messagesInfo: messagesObject,
      }
    );
  }
)

server.get(
  "/resetpassword",
  async (req, res) => {
    var masterPageObject = logicLayer.MasterPageController({
        anonSession: true,
        linksBlocked: true
    });

    //This get is slightly more complicated.
    //It uses a token sent via email to verify who you are.
    //You can only get it by registering and then using the like with the token included within to get here, so it must be able to check and tell if a token is valid.
    //I felt like it was more elegant to using parameter strings but I had already implemented the query string system, so I used it.
    var messagesObject = {password: [], token: []};
    messagesObject = await Object.assign(messagesObject, await logicLayer.GetMessagesFromString(["validationError", "verificationError"], req.query));

    //Below is here because people could hit this url without any thing else, so, without a token, you will get an error.
    //If you do, the token becomes the session token so you can reset your password.
    if (req.session.hasOwnProperty("token")) {messagesObject.token = true;}
    else if (req.query.hasOwnProperty("token"))
    {
      req.session.token=req.query.token
      messagesObject.token = true;
    }
    else{messagesObject.token = false;}
    res.render(
      "resetpassword",
      {
        masterInfo: masterPageObject,
        messagesInfo: messagesObject,
      }
    );
  }
)

server.get(
  "/verify",
  async (req, res) => {
    var masterPageObject = logicLayer.MasterPageController({
        anonSession: !logicLayer.UserSessionCheck(req.session.userID),
        linksBlocked: true
    });

    //Input fields are for the logging in but with the entry of a verification code.
    var messagesObject = {email: [], password: [], code: []};
    messagesObject = await Object.assign(messagesObject, await logicLayer.GetMessagesFromString(["validationError", "verificationError"], req.query));

    res.render(
      "verify",
      {
        masterInfo: masterPageObject,
        messagesInfo: messagesObject
      }
    );
  }
)

server.get(
  "/reverify",
  async (req, res) => {
    var masterPageObject = logicLayer.MasterPageController({
        anonSession: !logicLayer.UserSessionCheck(req.session.userID),
        linksBlocked: true
    });

    //Input field is just for the sending of an email.
    var messagesObject = {email: []};
    messagesObject = await Object.assign(messagesObject, await logicLayer.GetMessagesFromString(["validationError", "verificationError"], req.query));

    res.render(
      "reverify",
      {
        masterInfo: masterPageObject,
        messagesInfo: messagesObject
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
      //This is a bit complicated at first. The way this works is to give the validation check function an object of inputs, these input keys are the values of the actual input, this will be explained why in the logic layer.
      //For the values, you set an object that has keys called type and checks, maybe params.
      //In order, type if to let the check function know what type if it needs it, this is in case there is a 'secret' which is data that doesn't actually need parsing, in this case with 'poster'.
      //Type also shows up in the qstring error as it is not a good idea to show personal data in url format.
      //Then, checks. Checks is an array of 'subscribed' checks that you wish to put the key under.
      //So, an email of 1234567@uon.edu would be checked by whatever function is on the other end of the 'validEmail' check, explained in the logic layer.
      //Optionally, params. As mentioned above, there is a contextual difference between validation and verification and for verification, data must be compared. Params handles that and will attempt to give the checks the params.
      var errorReport = await logicLayer.ValidationCheck({
        //Input: {{type}, [subscribedChecks]}
        [req.body.email]: {type: "email", checks: ["validEmail"]},
        [req.body.givenName]: {type: "fname", checks: ["notEmpty"]},
        [req.body.surname]: {type: "lname", checks: ["notEmpty"]},
        [req.body.dob]:{type: "dob", checks: ["validAge"]},
        [req.body.password]: {type: "password", checks: ["validPassword"]},
        poster: {type: "register"}
      });
      //All of this outputs an object containing information about the results of the checks and then underneath it is put into a query string for sending.
      //I check the validation stuff first and redirect if an error is found because they are ordered to be shown first.
      errorReport = await logicLayer.QueryBuilder("validationError", errorReport);
      //What comes out of the above function is an object that contains a flag key and string key.
      //The flag key will be true if an error is found and the check has an error to return.

      //If the flag for validation has been set, send the string, else, run the same check for validation
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
          //If all is well and it is valid and new information, the user is added and redirected to verify for a one time code input.
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
      //Checks are as above.
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
          [req.body.password]: {type: "password", checks: ["correctPassword"], params: {email: req.body.email}},//first use of params
          poster: {type: "login"}
        });
        errorReport = await logicLayer.QueryBuilder("verificationError", errorReport);
        if (errorReport.flag) {res.redirect("/loginorregister"+errorReport.string);}
        else
        {
          //CHECK IF THE USER IS VERIFIED.
          //They may not have since registering.
          var verificationCheck = await logicLayer.IsVerifiedAccount(req.body.email);
          if (verificationCheck)
          {
            //If all is valid, set the session user ID to the primary key of the user in the DB, aka, the user key.
            //This is done because the log in function returns the key on success.
            var sessionID = await logicLayer.LogUserIn(req.body.email);
            req.session.userID = sessionID;
            res.redirect("/");
          }
          //If they are not verified, redirect to verify.
          else {res.redirect("/verify");}
        }
      }
    }
  }
)

server.post(
  "/verify",
  async (req, res) => {
    if (logicLayer.UserSessionCheck(req.session.userID))  {res.redirect("/");}  //Just incase session users hit the URL randomly
    else
    {
      //Checks are as above.
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

server.post(
  "/resetpassword",
  async (req, res) => {
    if (logicLayer.UserSessionCheck(req.session.userID))  {res.redirect("/");}  //Just incase session users hit the URL randomly
    else
    {
      //Checks are as above.
      var errorReport = await logicLayer.ValidationCheck({
        //Input: {{type}, [subscribedChecks]}
        [req.body.password]: {type: "password", checks: ["validPassword"]},
      });

      errorReport = await logicLayer.QueryBuilder("validationError", errorReport);
      if (errorReport.flag) {res.redirect("/resetpassword"+errorReport.string);}
      else
      {
        if (req.session.token != null)
        {
          var userKey = await logicLayer.SearchToken(req.session.token);
          if (userKey == null)
          {
            req.session.destroy();
            res.redirect("/");
          }
          else
          {
            var setPassword = await logicLayer.SetNewPassword(userKey, req.body.password);
            req.session.destroy();
          }
          res.redirect("/");
        }
        else {res.redirect("/");}
      }
    }
  }
)

server.post(
  "/reverify",
  async (req, res) => {
    if (logicLayer.UserSessionCheck(req.session.userID))  {res.redirect("/");}  //Just incase session users hit the URL randomly
    else
    {
      //Checks are as above.
      var errorReport = await logicLayer.ValidationCheck({
        //Input: {{type}, [subscribedChecks]}
        [req.body.email]: {type: "email", checks: ["validEmail"]}
      });

      errorReport = await logicLayer.QueryBuilder("validationError", errorReport);
      if (errorReport.flag) {res.redirect("/reverify"+errorReport.string);}
      else
      {
        errorReport = await logicLayer.VerificationCheck({
          [req.body.email]: {type: "email", checks: ["newEmail"]},
        });
        errorReport = await logicLayer.QueryBuilder("verificationError", errorReport);

        if (errorReport.flag) {res.redirect("/reverify"+errorReport.string);}
        else
        {
          var resetSent = await logicLayer.RegenerateVerificationCode(req.body.email);
          res.redirect("/reverify"+"?message=resent");
        }
      }
    }
  }
)

server.post(
  "/forgot",
  async (req, res) => {
    if (logicLayer.UserSessionCheck(req.session.userID))  {req.session.destroy();}  //No redirecting this time, just destroy any session info.
    //Checks are as above.
    var errorReport = await logicLayer.ValidationCheck({
      //Input: {{type}, [subscribedChecks]}
      [req.body.email]: {type: "email", checks: ["validEmail"]}
    });

    errorReport = await logicLayer.QueryBuilder("validationError", errorReport);
    if (errorReport.flag) {res.redirect("/forgot"+errorReport.string);}
    else
    {
      errorReport = await logicLayer.VerificationCheck({
        [req.body.email]: {type: "email", checks: ["newEmail"]},
      });
      errorReport = await logicLayer.QueryBuilder("verificationError", errorReport);

      if (errorReport.flag) {res.redirect("/forgot"+errorReport.string);}
      else
      {
        var resetSent = await logicLayer.SendResetLink(req.body.email);
        res.redirect("/forgot"+"?message=resent");
      }
    }
  }
)

server.post(
  "/saveprofile",
  async (req, res) => {
    if (logicLayer.UserSessionCheck(req.session.userID))
    {
      //Checks are as above.
      var errorReport = await logicLayer.ValidationCheck({
        //Input: {{type}, [subscribedChecks]}
        [req.body.fname]: {type: "fname", checks: ["notEmpty"]},
        [req.body.lname]: {type: "lname", checks: ["notEmpty"]},
        [req.body.email]: {type: "email", checks: ["validEmail"]},
        [req.body.dob]: {type: "dob", checks: ["validAge"]}
      });

      errorReport = await logicLayer.QueryBuilder("validationError", errorReport);
      if (errorReport.flag) {res.redirect("/reverify"+errorReport.string);}
      else
      {
        errorReport = await logicLayer.VerificationCheck({
          [req.body.email]: {type: "email", checks: ["existingEmail"], params: {userID: req.session.userID}}
        });
        errorReport = await logicLayer.QueryBuilder("verificationError", errorReport);

        if (errorReport.flag) {res.redirect("/profile"+errorReport.string);}
        else
        {
          var updated = await logicLayer.SetProfileDetails(req.session.userID, req.body.fname, req.body.lname, req.body.email, req.body.dob);
          res.redirect("/profile"+"?message=saved");
        }
      }
    }
    else {res.redirect("/loginorregister");}
  }
)

//-Listings
//IN DEVELOPMENT
server.get(
  "/listings",
  async function (req, res) {
    //
    var masterPageObject = logicLayer.MasterPageController({
        anonSession:  !logicLayer.UserSessionCheck(req.session.userID)
    });

    var listingsObject = await logicLayer.GetListings(req.query);

    //pageinfo

    res.render(
      "listings",
      {
        masterInfo: masterPageObject,
        listingsInfo: listingsObject,

      }
    );
  }
)

server.get(
  "/listing/:id",
  async function (req, res) {
    //
    var masterPageObject = logicLayer.MasterPageController({
        anonSession:  !logicLayer.UserSessionCheck(req.session.userID)
    });

    var listingObject = {};
    var pageObject = {listingExists: false};

    if (req.params.id)
    {
      listingObject = await logicLayer.GetListing(req.params.id);
      if (listingObject)
      {
        pageObject.listingExists = true;
      }
    }

    res.render(
      "listing",
      {
        masterInfo: masterPageObject,
        listingInfo: listingObject,
        pageInfo: pageObject
      }
    );
  }
)

server.post(
  "/",
  async (req, res) => {
    if (logicLayer.UserSessionCheck(req.session.userID))
    {
      //If there is time, this is to link the query to some cool inner workings like a recommender or even just a committing to the database of some sort.
      //Custom user data from searches would be added from here. The point of input.
    }
    //This is a simple redirect with a query string added.
    var string = "?type=" + req.body.category +
    "&searchBy=" + req.body.searchBy +
    "&minBeds=" + req.body.minBeds +
    "&maxBeds=" + req.body.maxBeds +
    "&minPrice=" + req.body.minPrice +
    "&maxPrice=" + req.body.maxPrice +
    "&searchTerm=" + req.body.search;
    res.redirect("/listings"+string);
  }
)
//IN DEVELOPMENT

//Listeners-----------------------------------------------------
server.listen(
  //Pretty simple, make the server listen for requests.
  statics.PORT,
  statics.SERVER_IP,
  function()
  {
    var ipString;
    if (statics.DEV_MODE)
    {
      console.log("This server is in development mode, please change this in the statics.js config file along with any other needed tweaks to credentials, addresses, etc.")
      ipString = statics.SERVER_IP;
    }
    else {ipString = "[WHATEVER THIS MACHINE'S IP ADDRESS IS]";}
    console.log("For http, go to " + ipString + ":"+statics.PORT)
  }
)
