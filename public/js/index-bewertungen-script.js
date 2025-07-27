document.addEventListener('DOMContentLoaded', function() {
  // Bewertungsdaten
  const reviewsData = {
    "ratingValue": 4.4,
    "reviewCount": 9,
    "reviews": [
      {
        "author": "Lena",
        "date": "2025-06-15",
        "rating": 5,
        "comment": "Die KI-Tools von interrogation.ai haben mir in verschiedenen Lebensbereichen geholfen. Besonders der Habit Helper und Situational Decider sind meine Favoriten!"
      },
      {
        "author": "Felix",
        "date": "2025-06-18",
        "rating": 3,
        "comment": "Nützlich, aber die Ergebnisse sind nicht immer treffsicher. Manchmal bekomme ich irrelevante Fragen, egal welches Tool ich nutze."
      },
      {
        "author": "Sophie",
        "date": "2025-06-20",
        "rating": 4,
        "comment": "Die Kombination aus technischen und persönlichen Tools macht interrogation.ai einzigartig. Mein Favorit ist der Situational Decider!"
      },
      {
        "author": "Tobias",
        "date": "2025-06-25",
        "rating": 5,
        "comment": "Absolut unverzichtbar für meinen Alltag! Die Tools helfen mir sowohl bei beruflichen als auch privaten Entscheidungen."
      },
      {
        "author": "Jan",
        "date": "2025-06-26",
        "rating": 4,
        "comment": "Solide Plattform für verschiedene Herausforderungen. Besonders nützlich für komplexe Probleme, die strukturiertes Denken erfordern."
      },
      {
        "author": "Mira",
        "date": "2025-06-27",
        "rating": 5,
        "comment": "Hat mir geholfen, sowohl technische als auch persönliche Blockaden zu überwinden. Die präzisen Fragen führen immer zum Kern des Problems!"
      },
      {
        "author": "Niklas",
        "date": "2025-06-28",
        "rating": 5,
        "comment": "Habe innerhalb von Minuten Lösungen für verschiedene Problemtypen gefunden. Die Plattform ist mein erster Anlaufpunkt geworden!"
      },
      {
        "author": "Emilia",
        "date": "2025-06-29",
        "rating": 5,
        "comment": "Die Vielfalt der Tools ist beeindruckend. Egal ob Coding, Gewohnheiten oder Entscheidungen - interrogation.ai hat für alles eine Lösung."
      },
      {
        "author": "Marc",
        "date": "2025-06-30",
        "rating": 4,
        "comment": "Gute Hilfe bei verschiedenen Herausforderungen. Die Antworten sind immer gut durchdacht und helfen mir, klarer zu denken."
      },
      {
        "author": "Laura",
        "date": "2025-07-01",
        "rating": 4,
        "comment": "Tolles Konzept mit unterschiedlichen Tools, die alle nahtlos zusammenarbeiten. Hat mir schon in vielen Situationen geholfen!"
      }
    ]
  };

  // Funktion zur Erstellung von Sternen
  function createStars(rating, container, size = 32) {
    container.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      
      star.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="${i <= rating ? 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z' : 'M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z'}"/>
        </svg>
      `;
      container.appendChild(star);
    }
  }

  // Gesamtbewertung anzeigen
  const starsContainer = document.querySelector('.overall-rating .stars');
  createStars(Math.round(reviewsData.ratingValue), starsContainer, 36);

  // Verteilung der Bewertungen berechnen
  const distribution = [0, 0, 0, 0, 0];
  reviewsData.reviews.forEach(review => {
    distribution[5 - review.rating]++;
  });

  // Balken animieren
  setTimeout(() => {
    document.querySelectorAll('.bar-fill').forEach((bar, index) => {
      const percent = distribution[index] / reviewsData.reviewCount * 100;
      bar.style.width = `${percent}%`;
    });
  }, 300);

  // Zufällige Bewertungen auswählen und anzeigen
  function showRandomReviews() {
    const reviewsContainer = document.querySelector('.random-reviews');
    reviewsContainer.innerHTML = '';
    
    // Bewertungen mischen
    const shuffledReviews = [...reviewsData.reviews].sort(() => 0.5 - Math.random());
    
    // 3 zufällige Bewertungen auswählen
    const selectedReviews = shuffledReviews.slice(0, 3);
    
    selectedReviews.forEach(review => {
      const reviewCard = document.createElement('div');
      reviewCard.className = 'review-card';
      
      // Datum formatieren
      const dateObj = new Date(review.date);
      const formattedDate = dateObj.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      
      reviewCard.innerHTML = `
        <div class="review-header">
          <div class="review-author">${review.author}</div>
          <div class="review-date">${formattedDate}</div>
        </div>
        <div class="review-stars"></div>
        <div class="review-comment">${review.comment}</div>
      `;
      
      reviewsContainer.appendChild(reviewCard);
      
      // Sterne für diese Bewertung erstellen
      const starsContainer = reviewCard.querySelector('.review-stars');
      createStars(review.rating, starsContainer, 20);
    });
  }

  showRandomReviews();
  
  // Event-Listener für zufällige Neuauswahl (optional)
  document.querySelector('.reviews-section').addEventListener('click', function(e) {
    if (e.target.closest('.refresh-reviews')) {
      showRandomReviews();
    }
  });
});