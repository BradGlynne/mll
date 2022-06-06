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
