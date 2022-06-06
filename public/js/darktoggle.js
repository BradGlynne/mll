		(function () {
			if (localStorage) {
				var theme = localStorage.getItem('stylemanager.theme');
				if (!theme && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
					theme = 'dark';
				}
				if (theme === 'dark') {
					document.body.classList.add('dark');
				}
			}
		})();


    // Select the button
    const btn = document.querySelector('.darkToggle');

    // Listen for a click on the button
    btn.addEventListener('click', function() {
      // Then toggle (add/remove) the .dark-theme class to the body
      document.body.classList.toggle('dark-theme');
    })
