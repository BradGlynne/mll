const themeSwitch = document.querySelector('.darkToggle');
console.log(themeSwitch);
themeSwitch.addEventListener('change', () => {
  document.body.classList.toggle('dark-theme');
});