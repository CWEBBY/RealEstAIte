const dataLayer = require("./dataLayer");


function GetUsers()
{
  return dataLayer.DEBUGGetUsers();
}


module.exports = {GetUsers}
