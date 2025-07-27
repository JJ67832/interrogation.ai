// public/js/bewertungen-script.js
document.addEventListener('DOMContentLoaded', () => {
  // Konfiguration
  const reviewsPerPage = 15;
  let currentPage = 1;
  let allReviews = [];
  let filteredReviews = [];
  
  // DOM-Elemente
  const reviewsGrid = document.getElementById('reviews-grid');
  const loadMoreBtn = document.getElementById('load-more-btn');
  const ratingFilter = document.getElementById('rating-filter');
  const sortBy = document.getElementById('sort-by');
  const searchAuthor = document.getElementById('search-author');
  const applyFiltersBtn = document.getElementById('apply-filters');
  const resetFiltersBtn = document.getElementById('reset-filters');
  const reviewForm = document.getElementById('review-form');
  const formMessage = document.getElementById('form-message');
  
  // Bewertungen laden
  async function loadReviews() {
    try {
      // Zeige Ladeanzeige an
      reviewsGrid.innerHTML = '<div class="loading">Bewertungen werden geladen...</div>';
      
      // Verwende die API-Route, um Bewertungen zu erhalten
      const response = await fetch('/api/bewertungen');
      if (!response.ok) throw new Error('Daten konnten nicht geladen werden');
      
      const data = await response.json();
      allReviews = data.reviews;  // Beachte: Die API gibt ein Objekt mit 'reviews' zurück
      filteredReviews = [...allReviews];
      
      applyFilters();
      displayReviews();
    } catch (error) {
      console.error('Fehler beim Laden der Bewertungen:', error);
      reviewsGrid.innerHTML = `<div class="error-message">Bewertungen konnten nicht geladen werden: ${error.message}</div>`;
    }
  }
  
  // Filter anwenden
  function applyFilters() {
    const ratingValue = parseInt(ratingFilter.value);
    const authorSearch = searchAuthor.value.toLowerCase();
    
    filteredReviews = allReviews.filter(review => {
      // Filter nach Bewertung
      if (ratingValue > 0 && review.rating !== ratingValue) return false;
      
      // Filter nach Autor
      if (authorSearch && !review.author.toLowerCase().includes(authorSearch)) {
        return false;
      }
      
      return true;
    });
    
    // Sortierung anwenden
    const sortValue = sortBy.value;
    switch (sortValue) {
      case 'newest':
        filteredReviews.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case 'oldest':
        filteredReviews.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case 'highest':
        filteredReviews.sort((a, b) => b.rating - a.rating);
        break;
      case 'lowest':
        filteredReviews.sort((a, b) => a.rating - b.rating);
        break;
    }
    
    currentPage = 1;
  }
  
  // Bewertungen anzeigen
  function displayReviews() {
    const startIndex = 0;
    const endIndex = currentPage * reviewsPerPage;
    const reviewsToShow = filteredReviews.slice(0, endIndex);
    
    reviewsGrid.innerHTML = '';
    
    if (reviewsToShow.length === 0) {
      reviewsGrid.innerHTML = '<p class="no-results">Keine Bewertungen gefunden, die den Filterkriterien entsprechen.</p>';
      loadMoreBtn.style.display = 'none';
      return;
    }
    
    reviewsToShow.forEach(review => {
      const reviewCard = document.createElement('div');
      reviewCard.className = 'review-card';
      
      // Sterne generieren
      let starsHtml = '';
      for (let i = 0; i < 5; i++) {
        starsHtml += `<span class="star">${i < review.rating ? '★' : '☆'}</span>`;
      }
      
      reviewCard.innerHTML = `
        <div class="review-header">
          <div class="review-author">${review.author}</div>
          <div class="review-date">${formatDate(review.date)}</div>
        </div>
        <div class="review-stars">${starsHtml}</div>
        <div class="review-comment">${review.comment}</div>
      `;
      
      reviewsGrid.appendChild(reviewCard);
    });
    
    // "Mehr anzeigen"-Button anpassen
    if (endIndex >= filteredReviews.length) {
      loadMoreBtn.disabled = true;
      loadMoreBtn.textContent = 'Alle Bewertungen angezeigt';
    } else {
      loadMoreBtn.disabled = false;
      loadMoreBtn.textContent = 'Mehr Bewertungen laden';
      loadMoreBtn.style.display = 'block';
    }
  }
  
  // Datum formatieren (TT.MM.JJJJ)
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  
  // Neue Bewertung absenden
  async function submitReview(event) {
    event.preventDefault();
    
    const author = document.getElementById('review-author').value;
    const rating = document.querySelector('input[name="rating"]:checked')?.value;
    const comment = document.getElementById('review-comment').value;
    
    // Validierung
    if (!author || !rating || !comment) {
      showMessage('Bitte fülle alle Felder aus', 'error');
      return;
    }
    
    const newReview = {
      author,
      rating: parseInt(rating),
      comment,
      date: new Date().toISOString().split('T')[0] // Aktuelles Datum im Format YYYY-MM-DD
    };
    
    try {
      // Formular deaktivieren während der Verarbeitung
      const submitBtn = reviewForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Wird gesendet...';
      
      // Bewertung zum Server senden
      const response = await fetch('/api/bewertungen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newReview)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Speichern der Bewertung');
      }
      
      // Erfolgsmeldung anzeigen
      showMessage('Vielen Dank für deine Bewertung! Sie wird nach Prüfung veröffentlicht.', 'success');
      
      // Formular zurücksetzen
      reviewForm.reset();
      
      // Bewertungen neu laden (nach kurzer Verzögerung)
      setTimeout(() => {
        loadReviews();
        submitBtn.disabled = false;
        submitBtn.textContent = 'Bewertung absenden';
      }, 2000);
      
    } catch (error) {
      console.error('Fehler:', error);
      showMessage(`Fehler: ${error.message}`, 'error');
      
      // Formular wieder aktivieren
      const submitBtn = reviewForm.querySelector('button[type="submit"]');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Bewertung absenden';
    }
  }
  
  // Formular-Nachricht anzeigen
  function showMessage(text, type) {
    formMessage.textContent = text;
    formMessage.className = `form-message ${type}`;
    formMessage.style.display = 'block';
    
    // Nachricht nach 5 Sekenden ausblenden
    setTimeout(() => {
      formMessage.style.display = 'none';
    }, 5000);
  }
  
  // Event Listener
  loadMoreBtn.addEventListener('click', () => {
    currentPage++;
    displayReviews();
  });
  
  applyFiltersBtn.addEventListener('click', () => {
    applyFilters();
    displayReviews();
  });
  
  resetFiltersBtn.addEventListener('click', () => {
    ratingFilter.value = '0';
    sortBy.value = 'newest';
    searchAuthor.value = '';
    applyFilters();
    displayReviews();
  });
  
  // Enter-Taste in Suchfeld
  searchAuthor.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
      applyFilters();
      displayReviews();
    }
  });
  
  reviewForm.addEventListener('submit', submitReview);
  
  // Initialisierung
  loadReviews();
});