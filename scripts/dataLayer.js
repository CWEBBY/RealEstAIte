//dataLayer.js, cw.
//The following module acts as a data access layer using CRUD conventions.
//Modules
//-Built in
const mysql = require("mysql");

//-Custom
const statics = require("./statics");

//Instances
const dbConnection = mysql.createConnection({
  host: statics.SERVER_IP,
  user: statics.DATABASE_USER,
  password: statics.DATABASE_PASSWORD,
  database: statics.DATABASE_NAME
});

//Tables
//-Users
function CreateUser(fName, lName, email, password, dob, tokenString, tokenExpiration, verificationCode, verified)
{
  var command = "INSERT INTO users (fName, lName, email, userPassword, dob, tokenString, tokenExpiration, latestVerificationCode, verified) "+
  "VALUES (" +
    "'" + fName.toString().toLowerCase() + "'," +
    "'" + lName.toString().toLowerCase() + "'," +
    "'" + email.toString().toLowerCase() + "'," +
    "'" + password.toString() + "'," +
    "'" + dob.toString() + "'," +
    "'" + tokenString.toString() + "'," +
    "'" + tokenExpiration.toString() + "'," +
    "'" + verificationCode.toString() + "'," +
          verified.toString() + ");";
    return QueryDatabase(command);
}

function ReadUser(userKey, fields = [])
{
  if (userKey != null)
  {
    //This function is designed to be flexible throughout development, but here is where an incoming object of whatever data has to be funnelled down to meet the fields of a relational db.
    //Update this as fields are added to the table.


    var fieldsString;
    if (fields.length == 0) {fieldsString = "*"}
    else
    {
      //Improvement: below really is just here for clarity. Incase keywords, var names, etc interfere, create a custom string switching terms.
      if (fields.includes("fName"))  {fieldsString += ", fName";}
      if (fields.includes("lName")) {fieldsString += ", lName";}
      if (fields.includes("email")) {fieldsString += ", email";}
      if (fields.includes("password")) {fieldsString += ", userPassword";}  //password == sql keyword
      if (fields.includes("dob")) {fieldsString += ", dob";}
      if (fields.includes("tokenString")) {fieldsString += ", tokenString" ;}
      if (fields.includes("tokenExpiration")) {fieldsString += ", tokenExpiration" ;}
      if (fields.includes("latestVerificationCode")) {fieldsString += ", latestVerificationCode";}
      if (fields.includes("verified")) {fieldsString += ", verified";}

      fieldsString = fieldsString.substring(1); //Remove first comma.
    }

    var command = "SELECT " + fieldsString + " FROM users WHERE userID="+key.toString();
    return QueryDatabase(command);
  }
  else {return null;}
}

function UpdateUser(userKey, userObject = {})
{
  if (userKey != null)
  {
    //This function is designed to be flexible throughout development, but here is where an incoming object of whatever data has to be funnelled down to meet the fields of a relational db.
    //Update this as fields are added to the table.
    var command = "";

    //Building the query.
    //toString everything, just to be safe.
    if (userObject.includes("fName"))  {command += ", fName='" + userObject.fName.toString() + "'";}
    if (userObject.includes("lName")) {command += ", lName='" + userObject.lName.toString() + "'";}
    if (userObject.includes("email")) {command += ", email='" + userObject.email.toString() + "'";}
    if (userObject.includes("password")) {command += ", userPassword='" + userObject.password.toString() + "'";}
    if (userObject.includes("dob")) {command += ", dob='" + userObject.dob.toString() + "'";}
    if (userObject.includes("tokenString")) {command += ", tokenString='" + userObject.tokenString.toString() + "'";}
    if (userObject.includes("tokenExpiration")) {command += ", tokenExpiration='" + userObject.tokenExpiration.toString() + "'";}
    if (userObject.includes("latestVerificationCode")) {command += ", latestVerificationCode='" + userObject.latestVerificationCode.toString() + "'";}
    if (userObject.includes("verified")) {command += ", verified='" + userObject.verified.toString() + "'";}

    command = "UPDATE users Set " + command.substring(1) + " WHERE userID='" + userKey.toString() + "'";

    return QueryDatabase(command);
  }
}

function DeleteUser(userKey)
{
  if (userKey != null)
  {
    var command = "DELETE FROM user WHERE userID='" + userKey.toString() + "';";
    return QueryDatabase(command);
  }
}

function GetUserKey(searchTerms = {})
{
  //Needs nulling if key is not found
  var command;
  if (searchTerms.hasOwnProperty("id")) {command = "SELECT * FROM users WHERE userID=" + searchTerms.id.toString();}
  else if (searchTerms.hasOwnProperty("token")) {command = "SELECT * FROM users WHERE tokenString=" + searchTerms.tokenString;}
  else if (searchTerms.hasOwnProperty("email")) {command = "SELECT * FROM users WHERE email=" + searchTerms.email;}
  else {return null;}
  return QueryDatabase(command);
}

//-Listings

//Functions
function QueryDatabase(command)
{
  dbConnection.query(command, (result) => {return result;});
}

module.exports = {CreateUser, ReadUser, UpdateUser, DeleteUser, GetUserKey};
