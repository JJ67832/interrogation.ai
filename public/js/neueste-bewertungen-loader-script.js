document.addEventListener('DOMContentLoaded', () => {
      // Funktion zum Laden der Bewertungen
      function loadReviews() {
        fetch('/api/bewertungen')
          .then(res => res.json())
          .then(data => {
            const reviewsContainer = document.getElementById('reviews-list');
            if (!reviewsContainer) return;
            
            // Sortiere Bewertungen nach Datum (neueste zuerst)
            const sortedReviews = [...data.reviews].sort((a, b) => 
              new Date(b.date) - new Date(a.date)
            );
            
            // Nur 3 Bewertungen anzeigen
            const reviewsToShow = sortedReviews.slice(0, 3);
            
            reviewsContainer.innerHTML = reviewsToShow.map(review => `
              <div class="review-item">
                <div class="review-header">
                  <span class="review-author">${review.author}</span>
                  <span class="review-rating">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</span>
                  <span class="review-date">${review.date}</span>
                </div>
                <div class="review-comment">${review.comment}</div>
              </div>
            `).join('');
          })
          .catch(err => console.error('Fehler beim Laden der Bewertungen:', err));
      }
      
      // Funktion zum Aktualisieren der Bewertungsdaten
      function updateRatingData() {
        // Aggregierte Bewertung aktualisieren
        fetch('/api/structured-data')
          .then(res => res.json())
          .then(data => {
            // Aktualisiere die UI-Anzeige
            const aggregateRating = document.getElementById('aggregate-rating');
            if (aggregateRating) {
              aggregateRating.textContent = 
                `★ ${data.aggregateRating.ratingValue} · ${data.aggregateRating.reviewCount} Bewertungen`;
            }
          })
          .catch(err => console.error('Fehler beim Aktualisieren der Bewertungsdaten:', err));
      }
      
      // Bewertungen und aggregierte Daten laden
      loadReviews();
      updateRatingData();
    });