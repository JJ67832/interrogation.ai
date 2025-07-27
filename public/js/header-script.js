document.addEventListener('DOMContentLoaded', () => {
  // Menü-Toggle
  const menuToggle = document.querySelector('.menu-toggle');
  const closeNav = document.querySelector('.close-nav');
  const mainNav = document.querySelector('.main-nav');
  
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      mainNav.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  }
  
  if (closeNav) {
    closeNav.addEventListener('click', () => {
      mainNav.classList.remove('open');
      document.body.style.overflow = '';
    });
  }
  
  // Schließen bei Klick außerhalb
  if (mainNav) {
    mainNav.addEventListener('click', (e) => {
      if (e.target === mainNav) {
        mainNav.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }

  // Untermenü-Toggle
  const submenuToggles = document.querySelectorAll('.submenu-toggle');
  
  submenuToggles.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      toggle.classList.toggle('active');
    });
  });
  
  // Suchfunktion initialisieren
  setupSearch();
  
  // Navigation aktualisieren
  updateNavigation();
});

// Suchfunktion
function setupSearch() {
  const headerSearchForm = document.querySelector('.header-search-form');
  const mainSearchForm = document.querySelector('.main-search-form');
  const mobileSearchForm = document.querySelector('.mobile-search-form');
  
  // Ergebnisse-UI Elemente
  const resultsContainer = document.getElementById('searchResults');
  const resultsList = document.getElementById('resultsList');
  const resultsTitle = document.getElementById('resultsTitle');
  const closeResults = document.getElementById('closeResults');
  const resultsBackdrop = document.getElementById('resultsBackdrop');
  
  if (closeResults && resultsContainer && resultsBackdrop) {
    closeResults.addEventListener('click', () => {
      resultsContainer.style.display = 'none';
      resultsBackdrop.style.display = 'none';
      document.body.style.overflow = '';
    });
  }
  
  if (resultsBackdrop) {
    resultsBackdrop.addEventListener('click', () => {
      if (resultsContainer) resultsContainer.style.display = 'none';
      resultsBackdrop.style.display = 'none';
      document.body.style.overflow = '';
    });
  }
  
  // Formulare verarbeiten
  const forms = [];
  if (headerSearchForm) forms.push(headerSearchForm);
  if (mainSearchForm) forms.push(mainSearchForm);
  if (mobileSearchForm) forms.push(mobileSearchForm);
  
  forms.forEach(form => {
    form.addEventListener('submit', handleSearch);
  });
}

async function handleSearch(e) {
  e.preventDefault();
  const form = e.target;
  const searchInput = form.querySelector('.search-input');
  const searchTerm = searchInput.value.trim();
  
  if (searchTerm) {
    try {
      // Ergebnisse-UI anzeigen
      const resultsContainer = document.getElementById('searchResults');
      const resultsList = document.getElementById('resultsList');
      const resultsTitle = document.getElementById('resultsTitle');
      const resultsBackdrop = document.getElementById('resultsBackdrop');
      
      // Bei mobiler Suche Menü schließen
      if (form.classList.contains('mobile-search-form')) {
        const mainNav = document.querySelector('.main-nav');
        if (mainNav) mainNav.classList.remove('open');
        document.body.style.overflow = '';
      }
      
      // Ladeanzeige anzeigen
      if (resultsList) resultsList.innerHTML = '<div class="no-results">Suche läuft...</div>';
      if (resultsTitle) resultsTitle.textContent = `Suche: "${searchTerm}"`;
      if (resultsContainer) resultsContainer.style.display = 'block';
      if (resultsBackdrop) resultsBackdrop.style.display = 'block';
      document.body.style.overflow = 'hidden';
      
      // Suche durchführen
      const response = await fetch('/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ term: searchTerm })
      });
      
      const results = await response.json();
      displaySearchResults(results, searchTerm);
    } catch (error) {
      console.error('Fehler bei der Suche:', error);
      displaySearchResults([], searchTerm, true);
    }
  }
}

function displaySearchResults(results, searchTerm, isError = false) {
  const resultsList = document.getElementById('resultsList');
  const resultsTitle = document.getElementById('resultsTitle');
  
  if (!resultsList || !resultsTitle) return;
  
  if (isError) {
    resultsList.innerHTML = `
      <div class="no-results">
        <p>Fehler bei der Suche. Bitte versuchen Sie es später erneut.</p>
      </div>
    `;
    return;
  }
  
  if (results.length === 0) {
    resultsList.innerHTML = `
      <div class="no-results">
        <p>Keine Ergebnisse gefunden für "${searchTerm}"</p>
        <p>Versuchen Sie andere Suchbegriffe</p>
      </div>
    `;
    return;
  }
  
  resultsTitle.textContent = `Suchergebnisse für "${searchTerm}"`;
  
  // Ergebnisse rendern
  resultsList.innerHTML = '';
  results.forEach(result => {
    const resultElement = document.createElement('div');
    resultElement.className = 'result-item';
    resultElement.innerHTML = `
      <h4 class="result-title">${result.title}</h4>
      <p class="result-description">${result.description}</p>
    `;
    
    // Klick-Event für Ergebnis
    resultElement.addEventListener('click', () => {
      if (result.url) window.location.href = result.url;
    });
    
    resultsList.appendChild(resultElement);
  });
}

// Funktion zur Aktualisierung der Navigation
async function updateNavigation() {
  try {
    const response = await fetch('/api/auth/status', {
      method: 'GET',
      credentials: 'include'
    });
    
    const accountNavItem = document.getElementById('account-nav-item');
    if (!accountNavItem) return;
    
    if (response.ok) {
      const user = await response.json();
      // Verwende Anzeigename falls vorhanden
      const displayName = user.name || user.email;
      
      accountNavItem.innerHTML = `
        <a href="/html/account-management.html" class="account-link">
          <div class="nav-account">
            <div class="nav-profile-pic">
              <img src="${user.googleId ? 
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}` : 
                "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><circle cx='12' cy='8' r='4' fill='%234f46e5'/><path d='M20 19v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6z' fill='%234f46e5'/></svg>"
              }" alt="Profil">
            </div>
            <span>${displayName}</span>
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
  } catch (error) {
    console.error('Fehler beim Abrufen des Benutzerstatus:', error);
  }
}