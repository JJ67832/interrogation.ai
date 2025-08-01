document.addEventListener('DOMContentLoaded', () => {
  // UI-Elemente
  const loginSection = document.getElementById('login-section');
  const registerSection = document.getElementById('register-section');
  const accountSection = document.getElementById('account-section');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const logoutBtn = document.getElementById('logout-btn');
  const switchToRegister = document.getElementById('switch-to-register');
  const switchToLogin = document.getElementById('switch-to-login');
  
  // Popup-Elemente
  const popupBackdrop = document.getElementById('popupBackdrop');
  const successPopup = document.getElementById('successPopup');
  const errorPopup = document.getElementById('errorPopup');
  const goToAccountBtn = document.getElementById('goToAccountBtn');
  const popupTitle = document.getElementById('popupTitle');
  const popupMessage = document.getElementById('popupMessage');
  const errorMessage = document.getElementById('errorMessage');
  
  // Logout-Popup Elemente
  const logoutPopup = document.getElementById('logoutPopup');
  const closeLogoutPopup = document.getElementById('closeLogoutPopup');

  // Google Login Button
  const googleLoginBtnAccount = document.getElementById('google-login-btn-account');

  // Benutzerstatus prüfen
  checkAuthStatus();

  // Event-Listener
  if (switchToRegister) {
    switchToRegister.addEventListener('click', (e) => {
      e.preventDefault();
      showRegister();
    });
  }

  if (switchToLogin) {
    switchToLogin.addEventListener('click', (e) => {
      e.preventDefault();
      showLogin();
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  // Google Login Handler für Account-Seite
  if (googleLoginBtnAccount) {
    googleLoginBtnAccount.addEventListener('click', (e) => {
      e.preventDefault();
      handleGoogleLogin();
    });
  }

  // Passwort-Sichtbarkeit umschalten
  document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', function() {
      const input = this.parentElement.querySelector('input');
      const icon = this.querySelector('.eye-icon');
      
      if (input.type === 'password') {
        input.type = 'text';
        icon.innerHTML = '<path d="M12 6.5c2.76 0 5 2.24 5 5 0 .51-.1 1-.24 1.46l3.06 3.06c1.39-1.23 2.49-2.77 3.18-4.53C21.27 7.11 17 4 12 4c-1.27 0-2.49.2-3.64.57l2.17 2.17c.47-.14.96-.24 1.47-.24zM2.71 3.16c-.39.39-.39 1.02 0 1.41l1.97 1.97C3.06 7.83 1.77 9.53 1 11.5 2.73 15.89 7 19 12 19c1.52 0 2.97-.3 4.31-.82l2.72 2.72c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L4.13 3.16c-.39-.39-1.03-.39-1.42 0zM12 16.5c-2.76 0-5-2.24-5-5 0-.77.18-1.5.5-2.14l1.57 1.57c-.03.18-.06.37-.06.57 0 1.66 1.34 3 3 3 .2 0 .38-.03.57-.07L13.14 14c-.64.32-1.37.5-2.14.5zm2.97-5.33c-.15-1.4-1.25-2.49-2.64-2.64l2.64 2.64z"/>';
      } else {
        input.type = 'password';
        icon.innerHTML = '<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>';
      }
    });
  });

  // Popup-Buttons
  if (popupBackdrop) {
    popupBackdrop.addEventListener('click', () => {
      successPopup.classList.remove('active');
      errorPopup.classList.remove('active');
      popupBackdrop.style.display = 'none';
    });
  }

  if (goToAccountBtn) {
    goToAccountBtn.addEventListener('click', () => {
      successPopup.classList.remove('active');
      popupBackdrop.style.display = 'none';
      window.location.href = '/html/account-management.html';
    });
  }

  // NEU HINZUGEFÜGT: Schließen-Button für Erfolgs-Popup
  const closePopupBtn = document.getElementById('closePopupBtn');
  if (closePopupBtn) {
    closePopupBtn.addEventListener('click', () => {
      successPopup.classList.remove('active');
      popupBackdrop.style.display = 'none';
    });
  }

  // Eventuell fehlender Listener für Fehler-Popup (falls benötigt)
  const closeErrorBtn = document.getElementById('closeErrorBtn');
  if (closeErrorBtn) {
    closeErrorBtn.addEventListener('click', () => {
      errorPopup.classList.remove('active');
      popupBackdrop.style.display = 'none';
    });
  }

  if (closeLogoutPopup) {
    closeLogoutPopup.addEventListener('click', () => {
      logoutPopup.classList.remove('active');
      window.location.href = '/html/account.html';
    });
  }

  // Funktionen
  function showLogin() {
    if (registerSection) registerSection.classList.add('hidden');
    if (accountSection) accountSection.classList.add('hidden');
    if (loginSection) loginSection.classList.remove('hidden');
  }

  function showRegister() {
    if (loginSection) loginSection.classList.add('hidden');
    if (accountSection) accountSection.classList.add('hidden');
    if (registerSection) registerSection.classList.remove('hidden');
  }

  function showAccount(user) {
    if (loginSection) loginSection.classList.add('hidden');
    if (registerSection) registerSection.classList.add('hidden');
    if (accountSection) accountSection.classList.remove('hidden');
    
    document.getElementById('account-email').textContent = user.email;
    document.getElementById('join-date').textContent = new Date(user.created).toLocaleDateString('de-DE');
    document.getElementById('last-login').textContent = new Date().toLocaleDateString('de-DE');
  }

  function showSuccessPopup(title, message) {
    popupTitle.textContent = title;
    popupMessage.textContent = message;
    
    popupBackdrop.style.display = 'block';
    successPopup.classList.add('active');
  }
  
  function showError(message) {
    errorMessage.textContent = message;
    popupBackdrop.style.display = 'block';
    errorPopup.classList.add('active');
  }
  
  function clearForm(form) {
    form.querySelectorAll('input').forEach(input => {
      input.value = '';
    });
  }

  // Google Login Funktion
  function handleGoogleLogin() {
    // In der Produktion verwenden wir keine Popups, sondern direkte Navigation
    if (window.location.hostname !== 'localhost') {
      window.location.href = '/auth/google';
      return;
    }
    
    // Lokal: Popup
    const googleLoginWindow = window.open(
      '/auth/google',
      'GoogleLogin',
      'width=600,height=600'
    );
    
    window.addEventListener('message', (event) => {
      if (event.data === 'google-auth-success') {
        checkAuthStatus();
      }
    });
    
    const checkWindowClosed = setInterval(() => {
      if (googleLoginWindow.closed) {
        clearInterval(checkWindowClosed);
        setTimeout(checkAuthStatus, 500);
      }
    }, 500);
  }

  async function checkAuthStatus() {
    try {
      const response = await fetch('/api/auth/status', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        const user = await response.json();
        showAccount(user);
        updateNavigation(user);
        
        // Session-Status auch für die Startseite setzen
        if (window.parent && window.parent.updateNavigation) {
          window.parent.updateNavigation(user);
        }
      } else {
        showLogin();
      }
    } catch (error) {
      console.error('Fehler beim Überprüfen des Authentifizierungsstatus:', error);
      showLogin();
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });
      
      if (response.ok) {
        const user = await response.json();
        showAccount(user);
        updateNavigation(user);
        showSuccessPopup('Anmeldung erfolgreich', `Willkommen zurück, ${user.email}!`);
      } else {
        const errorData = await response.json();
        showError(`Anmeldung fehlgeschlagen: ${errorData.error}`);
        clearForm(loginForm);
      }
    } catch (error) {
      console.error('Fehler bei der Anmeldung:', error);
      showError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
      clearForm(loginForm);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm').value;
    
    if (password !== confirmPassword) {
      showError('Passwörter stimmen nicht überein!');
      return;
    }
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });
      
      if (response.ok) {
        const user = await response.json();
        showAccount(user);
        updateNavigation(user);
        showSuccessPopup('Registrierung erfolgreich', 'Dein Konto wurde erfolgreich erstellt!');
      } else {
        const errorData = await response.json();
        showError(`Registrierung fehlgeschlagen: ${errorData.error}`);
        clearForm(registerForm);
      }
    } catch (error) {
      console.error('Fehler bei der Registrierung:', error);
      showError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
      clearForm(registerForm);
    }
  }

  async function handleLogout() {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        logoutPopup.classList.add('active');
        updateNavigation(null);
        
        // Automatisch nach 3 Sekunden schließen
        setTimeout(() => {
          logoutPopup.classList.remove('active');
          window.location.href = '/html/account.html';
        }, 3000);
      } else {
        showError('Abmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.');
      }
    } catch (error) {
      console.error('Fehler bei der Abmeldung:', error);
      showError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
    }
  }

  function updateNavigation(user) {
    const accountNavItem = document.getElementById('account-nav-item');
    
    if (accountNavItem) {
      if (user) {
        accountNavItem.innerHTML = `
          <a href="/html/account-management.html" class="account-link">
            <div class="nav-account">
              <div class="nav-profile-pic">
                <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><circle cx='12' cy='8' r='4' fill='%234f46e5'/><path d='M20 19v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6z' fill='%234f46e5'/></svg>" alt="Profil">
              </div>
              <span>${user.email}</span>
            </div>
          </a>
        `;
      } else {
        accountNavItem.innerHTML = `
          <a href="/html/account.html" class="account-link">
            <div class="nav-account">
              <div class="nav-profile-pic">
                <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><circle cx='12' cy='12' r='3.2' fill='%23757575'/><path d='M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z' fill='%23757575'/></svg>" alt="Anmelden">
              </div>
              <span>Anmelden</span>
            </div>
          </a>
        `;
      }
    }
  }
});
