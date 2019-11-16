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
function UpdateSearchBarPlaceholder(val)
{
  var searchBar = document.getElementById("searchBar");
  searchBar.placeholder = "🔍  Search by " + val.substring(0, 1).toUpperCase() + val.substring(1).toLowerCase();
}

//PPW
function UpdatePriceLabels(pricetype)
{
  var maxPrice = document.getElementById("maxPriceLabel");
  var minPrice = document.getElementById("minPriceLabel");
  if (pricetype == "rent")
  {
    maxPrice.innerHTML = "Price/Week (Max)";
    minPrice.innerHTML = "Price/Week (Min)";
  }
  else
  {
    maxPrice.innerHTML = "Price (Max)";
    minPrice.innerHTML = "Price (Min)";
  }
}
