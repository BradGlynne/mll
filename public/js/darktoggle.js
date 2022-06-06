const themeSwitch = document.querySelector('.darkToggle');

themeSwitch.addEventListener('change', () => {
  document.body.classList.toggle('dark-theme');
});