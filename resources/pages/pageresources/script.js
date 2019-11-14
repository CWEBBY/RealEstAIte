//Script.js, cw.
//The main js file for the client side js.
//vars
var profileMenuActive = false;

//Mobile menu
function ToggleProfileMenu()
{
  if (profileMenuActive)
  {
    document.getElementById("profileSideMenu").style.display = "none";
    document.getElementById("navbarProfileOptionLink").style.borderTop = "0rem solid white";
    document.getElementById("navbarProfileOptionLink").style.marginBottom = "0rem;";
    profileMenuActive=false;
  }
  else
  {
    document.getElementById("profileSideMenu").style.display = "block";
    document.getElementById("navbarProfileOptionLink").style.borderTop = ".25rem solid white";
    document.getElementById("navbarProfileOptionLink").style.marginBottom = "-.25rem;";
    profileMenuActive=true;
  }
}

//Index search box
function UpdateSearchBarPlaceholder(selfID)
{
  var self = document.getElementById(selfID);
  var searchBars = document.getElementsByClassName("searchBar");
  for (var barIndex = 0; barIndex < searchBars.length; barIndex++)
  {
    searchBars[barIndex].placeholder = "Search by " + self.value.substring(0, 1).toUpperCase() + self.value.substring(1).toLowerCase();
  }
}

function SwitchSearch(newType)
{//String as param for any future types of listings, at the moment, just rent and buy.
  var searchBoxes =  document.getElementsByClassName("searchBox");
  for (var boxIndex = 0; boxIndex < searchBoxes.length; boxIndex++)
  {
    searchBoxes[boxIndex].style.display = "none";
  }

  if (newType == "rent")
  {
    var rentBox = document.getElementById("rentBox");
    rentBox.style.display = "block";
  }
  else if (newType == "buy")
  {
    var buyBox = document.getElementById("buyBox");
    buyBox.style.display = "block";
  }
}
