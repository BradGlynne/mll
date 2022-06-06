const themeSwitch = document.querySelector('.darkToggle');
console.log(themeSwitch);
if(themeSwitch) {
  console.log("Is True");
}
else {
  console.log ("Is not true");
}
themeSwitch.addEventListener('change', () => {
  document.body.classList.toggle('dark-theme');
});