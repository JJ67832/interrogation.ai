
document.addEventListener('DOMContentLoaded', () => {
  async function checkAuthStatus() {
    try {
      const response = await fetch('/api/auth/status', {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const user = await response.json();
        
        // Zeige Popup nur auf Startseite
        if (window.location.pathname.endsWith('/index.html') || 
            window.location.pathname === '/') {
          if (user.showWelcomePopup) {
            showSuccessPopup(
              'Anmeldung erfolgreich', 
              `Willkommen zurück, ${user.email}!`
            );
          }
        }
      }
    } catch (error) {
      console.error('Fehler:', error);
    }
  }

  // Popup-Funktion
  function showSuccessPopup(title, message) {
    const popupBackdrop = document.createElement('div');
    popupBackdrop.id = 'popupBackdrop';
    popupBackdrop.className = 'popup-backdrop';
    
    const popup = document.createElement('div');
    popup.className = 'popup';
    popup.innerHTML = `
      <div class="popup-content">
        <div class="popup-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path fill="#4CAF50" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <h2 class="popup-title">${title}</h2>
        <p class="popup-message">${message}</p>
        <div class="popup-buttons">
          <button id="closePopupBtn" class="btn-secondary">Schließen</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(popupBackdrop);
    document.body.appendChild(popup);
    
    document.getElementById('closePopupBtn').addEventListener('click', () => {
      document.body.removeChild(popupBackdrop);
      document.body.removeChild(popup);
    });
  }

  // Status prüfen
  checkAuthStatus();
});
