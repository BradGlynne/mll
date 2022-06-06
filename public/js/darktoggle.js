// Select the theme preference from localStorage
$(document).ready(function () {
const currentTheme = localStorage.getItem("theme");

// If the current theme in localStorage is "dark"...
if (currentTheme == "dark") {
  // ...then use the .dark-theme class
  document.body.classList.add("dark-theme");
  document.getElementById("darkToggle").checked = true;
}
});
function themeToggle() {
  let theme = "light";
  if (document.getElementById("darkToggle").checked) {
    document.body.classList.toggle("dark-theme");
    theme = "dark";
  }
  else {
    theme = "light";
    document.body.classList.toggle("dark-theme");
    // if (document.body.classList.contains("dark-theme")) {
    //       // ...then let's make the theme dark
    //       theme = "dark";
    //     } 
  }
  localStorage.setItem("theme", theme);
}