// public/js/bewertungen-loader.js
document.addEventListener('DOMContentLoaded', () => {
  fetch('/bewertungen.json')
    .then(response => {
      console.log('Response Status:', response.status);
      console.log('Content-Type:', response.headers.get('content-type'));
      
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new TypeError("Received non-JSON response");
      }
      
      return response.json();
    })
    .then(data => {
      console.log('Successfully loaded reviews:', data);
      // Aktualisiere Schema.org-Daten (mit allen Bewertungen)
      updateSchemaMarkup(data);
      
      // Aktualisiere UI mit maximal 3 Bewertungen
      updateRatingUI({
        ...data,
        reviews: data.reviews.slice(0, 3)
      });
    })
    .catch(error => {
      console.error('Fehler beim Laden der Bewertungen:', error);
      // Fallback-Werte (maximal 3 Bewertungen)
      updateRatingUI({
        ratingValue: 4.4,
        reviewCount: 10,
        reviews: [
          {
            author: "Lena",
            date: "2025-06-15",
            rating: 5,
            comment: "Die KI-Tools von interrogation.ai haben mir in verschiedenen Lebensbereichen geholfen. Besonders der Habit Helper und Situational Decider sind meine Favoriten!"
          },
          {
            author: "Felix",
            date: "2025-06-18",
            rating: 3,
            comment: "Nützlich, aber die Ergebnisse sind nicht immer treffsicher. Manchmal bekomme ich irrelevante Fragen, egal welches Tool ich nutze."
          },
          {
            author: "Sophie",
            date: "2025-06-20",
            rating: 4,
            comment: "Die Kombination aus technischen und persönlichen Tools macht interrogation.ai einzigartig. Mein Favorit ist der Situational Decider!"
          }
        ]
      });
    });
});

function updateSchemaMarkup(data) {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Coding Project Helper",
    "description": "Hilft Entwicklern bei der Lösung technischer Probleme",
    "applicationCategory": "Developer Tools",
    "operatingSystem": "Windows, macOS, Linux, Android, iOS",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "EUR"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": data.ratingValue.toString(),
      "reviewCount": data.reviewCount.toString()
    },
    "review": data.reviews.map(review => ({
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": review.author
      },
      "datePublished": review.date,
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": review.rating.toString()
      },
      "reviewBody": review.comment
    }))
  };

  // Entferne vorhandenes Schema-Markup
  const existingSchema = document.querySelector('script[type="application/ld+json"]');
  if (existingSchema) {
    existingSchema.remove();
  }
  
  // Füge neues Schema-Markup hinzu
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schemaData);
  document.head.appendChild(script);
}

function updateRatingUI(data) {
  // Aggregierte Bewertung
  const ratingElement = document.getElementById('aggregate-rating');
  if (ratingElement) {
    ratingElement.innerHTML = `★ ${data.ratingValue} · ${data.reviewCount} Bewertungen`;
  }
  
  // Einzelne Bewertungen (maximal 3)
  const reviewsContainer = document.getElementById('reviews-list');
  if (reviewsContainer) {
    reviewsContainer.innerHTML = data.reviews.slice(0, 3).map(review => `
      <div class="review-item">
        <div class="review-header">
          <span class="review-author">${review.author}</span>
          <span class="review-date">${review.date}</span>
        </div>
        <div class="review-rating">${'★'.repeat(review.rating)}</div>
        <div class="review-comment">${review.comment}</div>
      </div>
    `).join('');
  }
}