var profileMenuActive = false;
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
