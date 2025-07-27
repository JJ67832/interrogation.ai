// Einfache Suchfunktionalität für die Startseite
document.addEventListener('DOMContentLoaded', () => {
  // Session-Status beim Laden prüfen
  checkSession();
  
  const searchBtn = document.getElementById('search-btn');
  const mainSearch = document.getElementById('main-search');
  const searchResults = document.getElementById('search-results');
  
  // Suchfunktion
  searchBtn.addEventListener('click', performSearch);
  
  // Enter-Taste in Suchfeld
  mainSearch.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  });
  
  // Beispielkarten interaktiv machen
  document.querySelectorAll('.example-card').forEach(card => {
    card.addEventListener('click', () => {
      const problemText = card.querySelector('.problem').textContent;
      mainSearch.value = problemText;
      performSearch();
    });
  });

  // Neue Elemente für die Anmeldung
  const loginForm = document.getElementById('login-form');
  const togglePassword = document.querySelector('.toggle-password');
  const passwordInput = document.getElementById('login-password');
  const googleLoginBtn = document.getElementById('google-login-btn');

  // Passwort-Sichtbarkeit umschalten
  if (togglePassword) {
    togglePassword.addEventListener('click', function() {
      const icon = this.querySelector('.eye-icon');
      
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.innerHTML = '<path d="M12 6.5c2.76 0 5 2.24 5 5 0 .51-.1 1-.24 1.46l3.06 3.06c1.39-1.23 2.49-2.77 3.18-4.53C21.27 7.11 17 4 12 4c-1.27 0-2.49.2-3.64.57l2.17 2.17c.47-.14.96-.24 1.47-.24zM2.71 3.16c-.39.39-.39 1.02 0 1.41l1.97 1.97C3.06 7.83 1.77 9.53 1 11.5 2.73 15.89 7 19 12 19c1.52 0 2.97-.3 4.31-.82l2.72 2.72c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L4.13 3.16c-.39-.39-1.03-.39-1.42 0zM12 16.5c-2.76 0-5-2.24-5-5 0-.77.18-1.5.5-2.14l1.57 1.57c-.03.18-.06.37-.06.57 0 1.66 1.34 3 3 3 .2 0 .38-.03.57-.07L13.14 14c-.64.32-1.37.5-2.14.5zm2.97-5.33c-.15-1.4-1.25-2.49-2.64-2.64l2.64 2.64z"/>';
      } else {
        passwordInput.type = 'password';
        icon.innerHTML = '<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>';
      }
    });
  }

  // Anmeldeformular
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  // Google Login mit Popup und Nachrichten-Handling
  if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleGoogleLogin();
    });
  }
  
  // Funktion zum Ausführen der Suche
  async function performSearch() {
    const searchTerm = mainSearch.value.trim().toLowerCase();
    if (!searchTerm) {
      searchResults.innerHTML = '';
      searchResults.style.display = 'none';
      return;
    }

    try {
      const response = await fetch('/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ term: searchTerm })
      });
      
      const results = await response.json();
      displaySearchResults(results);
    } catch (error) {
      console.error('Fehler bei der Suche:', error);
      searchResults.innerHTML = '<div class="search-result-item"><div class="tool-title">Fehler bei der Suche</div><div class="tool-description">Bitte versuchen Sie es später erneut</div></div>';
      searchResults.style.display = 'block';
    }
  }

  // Funktion zum Anzeigen der Suchergebnisse
  function displaySearchResults(results) {
    searchResults.innerHTML = '';
    
    if (results.length === 0) {
      searchResults.innerHTML = '<div class="search-result-item"><div class="tool-title">Keine Ergebnisse gefunden</div><div class="tool-description">Versuchen Sie einen anderen Suchbegriff</div></div>';
      searchResults.style.display = 'block';
      return;
    }
    
    results.forEach(tool => {
      const resultItem = document.createElement('div');
      resultItem.className = 'search-result-item';
      
      const titleElement = document.createElement('div');
      titleElement.className = 'tool-title';
      titleElement.textContent = tool.title;
      
      const descriptionElement = document.createElement('div');
      descriptionElement.className = 'tool-description';
      descriptionElement.textContent = tool.description;
      
      resultItem.appendChild(titleElement);
      resultItem.appendChild(descriptionElement);
      
      resultItem.addEventListener('click', () => {
        window.location.href = tool.url;
      });
      
      searchResults.appendChild(resultItem);
    });
    
    searchResults.style.display = 'block';
  }

  // Klick außerhalb schließt die Suchergebnisse
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.hero-search')) {
      searchResults.style.display = 'none';
    }
  });
  
  // Bewertungen laden
  loadReviews();
});

// Funktion zum Laden und Anzeigen der Bewertungen
async function loadReviews() {
  try {
    const response = await fetch('/api/bewertungen');
    if (!response.ok) {
      throw new Error('Bewertungen konnten nicht geladen werden');
    }
    const reviewData = await response.json();
    updateReviewSection(reviewData);
  } catch (error) {
    console.error('Fehler beim Laden der Bewertungen:', error);
  }
}

// Funktion zum Aktualisieren der Bewertungssektion
function updateReviewSection(reviewData) {
  // Gesamtbewertung
  const averageRating = reviewData.ratingValue;
  const totalReviews = reviewData.reviewCount;
  
  // Durchschnittliche Bewertung anzeigen
  const averageRatingElement = document.getElementById('average-rating');
  if (averageRatingElement) {
    averageRatingElement.textContent = averageRating.toFixed(1);
  }
  
  // Anzahl der Bewertungen anzeigen
  const totalReviewsElement = document.getElementById('review-count');
  if (totalReviewsElement) {
    totalReviewsElement.textContent = totalReviews;
  }
  
  // Sterne für die Gesamtbewertung
  const starsContainer = document.getElementById('overall-stars');
  if (starsContainer) {
    starsContainer.innerHTML = '';
    const fullStars = Math.floor(averageRating);
    const halfStar = averageRating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      const star = document.createElement('span');
      star.classList.add('star');
      if (i < fullStars) {
        star.textContent = '★';
      } else if (i === fullStars && halfStar) {
        star.textContent = '★';
      } else {
        star.textContent = '☆';
      }
      starsContainer.appendChild(star);
    }
  }
  
  // Bewertungsverteilung
  const distribution = [0, 0, 0, 0, 0]; // Index 0: 5 Sterne, 1: 4 Sterne, ... 4: 1 Stern
  reviewData.reviews.forEach(review => {
    const rating = Math.floor(review.rating);
    if (rating >= 1 && rating <= 5) {
      distribution[5 - rating]++; // 5 Sterne -> Index 0, 4 Sterne -> Index 1, etc.
    }
  });
  
  // Verteilungsbalken aktualisieren
  const distributionContainer = document.getElementById('distribution-bars');
  if (distributionContainer) {
    distributionContainer.innerHTML = '';
    
    distribution.forEach((count, index) => {
      const stars = 5 - index;
      const percent = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
      
      const barContainer = document.createElement('div');
      barContainer.className = 'bar-container';
      
      barContainer.innerHTML = `
        <span>${stars} Sterne</span>
        <div class="bar-bg">
          <div class="bar-fill" style="width: ${percent}%"></div>
        </div>
        <span class="count">${count}</span>
      `;
      
      distributionContainer.appendChild(barContainer);
    });
  }
  
  // Zufällige Bewertungen auswählen (max. 3)
  const randomReviews = [...reviewData.reviews].sort(() => 0.5 - Math.random()).slice(0, 3);
  const randomReviewsContainer = document.getElementById('random-reviews');
  if (randomReviewsContainer) {
    randomReviewsContainer.innerHTML = '';
    
    randomReviews.forEach(review => {
      const reviewCard = document.createElement('div');
      reviewCard.className = 'review-card';
      
      // Sterne für diese Bewertung
      let starsHtml = '';
      for (let i = 1; i <= 5; i++) {
        starsHtml += i <= review.rating ? '★' : '☆';
      }
      
      reviewCard.innerHTML = `
        <div class="review-header">
          <div class="review-author">${review.author}</div>
          <div class="review-date">${review.date}</div>
        </div>
        <div class="review-stars">${starsHtml}</div>
        <div class="review-content">${review.comment}</div>
      `;
      
      randomReviewsContainer.appendChild(reviewCard);
    });
  }
}

// Google Login Funktion für beide Seiten
function handleGoogleLogin() {
  const googleLoginWindow = window.open(
    '/auth/google',
    'GoogleLogin',
    'width=600,height=600'
  );
  
  window.addEventListener('message', (event) => {
    if (event.data === 'google-auth-success') {
      // Unterschiedliches Verhalten basierend auf aktueller Seite
      if (window.location.pathname.includes('account.html')) {
        window.location.reload();
      } else {
        checkSession();
      }
    }
  });
  
  // Überprüfe regelmäßig, ob das Fenster geschlossen wurde
  const checkWindowClosed = setInterval(() => {
    if (googleLoginWindow.closed) {
      clearInterval(checkWindowClosed);
      // Unterschiedliches Verhalten basierend auf aktueller Seite
      if (window.location.pathname.includes('account.html')) {
        window.location.reload();
      } else {
        setTimeout(checkSession, 500);
      }
    }
  }, 500);
}

// Session-Status prüfen
async function checkSession() {
  try {
    const response = await fetch('/api/auth/status', {
      method: 'GET',
      credentials: 'include'
    });
    
    if (response.ok) {
      const user = await response.json();
      updateNavigation(user);
    }
  } catch (error) {
    console.error('Session-Check fehlgeschlagen:', error);
  }
}

// Anmeldefunktion
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
      updateNavigation(user);
      showSuccessPopup('Anmeldung erfolgreich', `Willkommen zurück, ${user.email}!`);
      
      // Formular ersetzen mit zentrierter Willkommensnachricht
      document.querySelector('.signup-card').innerHTML = `
        <div class="welcome-message">
          <h3>Erfolgreich angemeldet!</h3>
          <p>Sie sind jetzt eingeloggt als ${user.email}</p>
          <a href="/html/account-management.html" class="tool-btn">Account verwalten</a>
        </div>
      `;
    } else {
      const errorData = await response.json();
      showError(`Anmeldung fehlgeschlagen: ${errorData.error}`);
    }
  } catch (error) {
    console.error('Fehler bei der Anmeldung:', error);
    showError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
  }
}

// Benutzernavigation aktualisieren
function updateNavigation(user) {
  const accountNavItem = document.getElementById('account-nav-item');
  
  if (!accountNavItem) return; // Sicherheitscheck

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

// Erfolgsmeldung anzeigen
function showSuccessPopup(title, message) {
  const popupBackdrop = document.getElementById('popupBackdrop');
  const successPopup = document.getElementById('successPopup');
  const popupTitle = document.getElementById('popupTitle');
  const popupMessage = document.getElementById('popupMessage');
  
  if (popupTitle && popupMessage && successPopup && popupBackdrop) {
    popupTitle.textContent = title;
    popupMessage.textContent = message;
    
    popupBackdrop.style.display = 'block';
    successPopup.classList.add('active');
    
    // Popup nach 3 Sekunden automatisch schließen
    setTimeout(() => {
      successPopup.classList.remove('active');
      popupBackdrop.style.display = 'none';
    }, 3000);
  }
}

// Fehlermeldung anzeigen
function showError(message) {
  const popupBackdrop = document.getElementById('popupBackdrop');
  const errorPopup = document.getElementById('errorPopup');
  const errorMessage = document.getElementById('errorMessage');
  
  if (errorMessage && errorPopup && popupBackdrop) {
    errorMessage.textContent = message;
    popupBackdrop.style.display = 'block';
    errorPopup.classList.add('active');
  }
}