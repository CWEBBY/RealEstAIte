const dataLayer = require("./dataLayer");

const AddUser = function(givenName, surname, dob, email, password)
{
  dataLayer.AddUser(givenName, surname, dob, email, password)
}

const GetUsers = dataLayer.GetUsers;

const GetListings = dataLayer.listings;

function GetUserByID(key)
{
  return dataLayer.GetUserByID(key);
}

module.exports = {AddUser, GetUsers, GetListings, GetUserByID}
