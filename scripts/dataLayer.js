//dataLayer.js, cw.
//The following module acts as a data access layer using CRUD conventions.
//Modules
//-Built in
const mysql = require("mysql2/promise");
const bluebird = require('bluebird');
//-Custom
const statics = require("./statics");

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

async function ReadUser(userKey, fields = [])
{
  if (userKey != null)
  {
    //This function is designed to be flexible throughout development, but here is where an incoming object of whatever data has to be funnelled down to meet the fields of a relational db.
    //Update this as fields are added to the table.
    //This could get slow quickly as abstraction from other layers means that if I am looping throughout multiple users, I am hitting the DB a lot in comparison to once, gathering an array, but this function is intended to be used for single user getting.

    var fieldsString = "";

    //Improvement: below really is just here for clarity. Incase keywords, var names, etc interfere, create a custom string switching terms.
    //Also, below is meant to be an abstracted version of data access, but JS allows for versitility, as a result, there is a slightly loose take on this abstraction in this layer.
    //The logic layer will name by field name in the database what it wants here this is because JS can hand back flexible objects, in comparison to the inflexible languages that employers of n-tier usually use like C# asp.
    //I think personally that the MOST important aspect here is that these keywords are hidden from presentationLayer which is still on the server side anyway.

    for (var keywordIndex = 0; keywordIndex < fields.length; keywordIndex++)
    {
      if (fields.includes(fields[keywordIndex]))  {fieldsString += ", "+fields[keywordIndex];}
      else {console.log("Rogue keyword somewhere in the logic layer: " + fields[keywordIndex]);}
    }

    if (fieldsString == "") {fieldsString = "*";}
    else {fieldsString = fieldsString.substring(1);} //Remove first comma.

    var command = "SELECT " + fieldsString + " FROM users WHERE userID="+userKey.toString();
    var query = await QueryDatabase(command);

    if (query.records.length == 1) {return query.records[0];}
    //Do not allow key hanfling of error prone users.
    else if (query.records.length > 1) {console.log("There is a validation error somewhere as '" + query.records[0].email + "' was able to make dual accounts.");}
    return null;
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
    if (userObject.hasOwnProperty("fName"))  {command += ", fName='" + userObject.fName.toString() + "'";}
    if (userObject.hasOwnProperty("lName")) {command += ", lName='" + userObject.lName.toString() + "'";}
    if (userObject.hasOwnProperty("email")) {command += ", email='" + userObject.email.toString() + "'";}
    if (userObject.hasOwnProperty("password")) {command += ", userPassword='" + userObject.password.toString() + "'";}
    if (userObject.hasOwnProperty("dob")) {command += ", dob='" + userObject.dob.toString() + "'";}
    if (userObject.hasOwnProperty("tokenString")) {command += ", tokenString='" + userObject.tokenString.toString() + "'";}
    if (userObject.hasOwnProperty("tokenExpiration")) {command += ", tokenExpiration='" + userObject.tokenExpiration.toString() + "'";}
    if (userObject.hasOwnProperty("latestVerificationCode")) {command += ", latestVerificationCode='" + userObject.latestVerificationCode.toString() + "'";}
    if (userObject.hasOwnProperty("verified")) {command += ", verified='" + userObject.verified.toString() + "'";}

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

async function GetUserKey(searchTerms = {})
{
  //This method of DB access, namely, hitting it twice, once for the key and then again for whatever has the downside of a maximum of double the reads per hit.
  //It allows for a more secure method of accessing data however.
  //Nothing gets to the data without the key from this.
  var command;
  var query = null;
  if (searchTerms.hasOwnProperty("id")) {command = "SELECT * FROM users WHERE userID=" + searchTerms.id.toString();}
  else if (searchTerms.hasOwnProperty("token")) {command = "SELECT * FROM users WHERE tokenString=" + searchTerms.tokenString;}
  else if (searchTerms.hasOwnProperty("email")) {command = "SELECT * FROM users WHERE email='" + searchTerms.email + "';";}
  else {return null;}
  var query = await QueryDatabase(command);
  query = query.records;
  if (query.length >= 1)
  {
    if (query.length > 1) {console.log("There is a validation error somewhere as '" + query[0].email + "' was able to make dual accounts.");}
    query = query[0].userID;
  }
  else {query = null;}
  return query;
}

//-Listings

//Functions
async function QueryDatabase(command)
{//Given more time, a fully async system would be implemented, actually hitting the DB will have to do for now.
  var dbConnection = await mysql.createConnection({
    host: statics.SERVER_IP,
    user: statics.DATABASE_USER,
    password: statics.DATABASE_PASSWORD,
    database: statics.DATABASE_NAME,
    Promise: bluebird
  });
  var queryResult = await dbConnection.query(command);
  dbConnection.end();
  var records = queryResult[0];
  var fields = queryResult[1];
  return {records: records, fields: fields};
}

module.exports = {CreateUser, ReadUser, UpdateUser, DeleteUser, GetUserKey};
