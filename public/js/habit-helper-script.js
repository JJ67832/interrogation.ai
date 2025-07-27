document.addEventListener('DOMContentLoaded', () => {
  // Funktion zum Aktualisieren der Bewertungsdaten
  function updateRatingData() {
    fetch('/api/structured-data')
      .then(res => res.json())
      .then(data => {
        const scriptElement = document.querySelector('script[type="application/ld+json"]');
        if (scriptElement) {
          scriptElement.textContent = JSON.stringify(data);
        }
        
        const aggregateRating = document.getElementById('aggregate-rating');
        if (aggregateRating) {
          aggregateRating.textContent = 
            `★ ${data.aggregateRating.ratingValue} · ${data.aggregateRating.reviewCount} Bewertungen`;
        }
      })
      .catch(err => console.error('Fehler beim Aktualisieren der Bewertungsdaten:', err));
  }

  // Funktion zum Laden der Bewertungen
  function loadReviews() {
    fetch('/api/bewertungen')
      .then(res => res.json())
      .then(data => {
        const reviewsContainer = document.getElementById('reviews-list');
        if (!reviewsContainer) return;

        const sortedReviews = [...data.reviews].sort((a, b) => 
          new Date(b.date) - new Date(a.date)
        );

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

  // Funktionen für Verlauf
  function saveToHistory(gewohnheit, questions) {
    const entry = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      gewohnheit,
      questions
    };

    let history = JSON.parse(localStorage.getItem('habitHelperHistory')) || [];
    history.unshift(entry);
    if (history.length > 10) history = history.slice(0, 10);
    localStorage.setItem('habitHelperHistory', JSON.stringify(history));
    
    renderHistory();
  }

  function renderHistory() {
    const container = document.getElementById('history-container');
    const history = JSON.parse(localStorage.getItem('habitHelperHistory')) || [];
    const historySection = document.getElementById('history-section');

    container.innerHTML = '';

    if (history.length === 0) {
      container.innerHTML = '<p class="empty-history">Keine vorherigen Ergebnisse</p>';
      historySection.classList.add('hidden');
      return;
    }

    historySection.classList.remove('hidden');
    
    history.forEach(entry => {
      const entryElement = document.createElement('div');
      entryElement.className = 'history-entry';
      entryElement.dataset.id = entry.id;
      entryElement.innerHTML = `
        <div class="history-header">
          <span class="history-date">${entry.date}</span>
          <span class="history-project">${entry.gewohnheit}</span>
        </div>
        <div class="history-questions">
          ${entry.questions.slice(0, 3).map(q => `<p>${q}</p>`).join('')}
          ${entry.questions.length > 3 ? `<p>... und ${entry.questions.length - 3} weitere</p>` : ''}
        </div>
        <button class="load-history">Laden</button>
      `;
      container.appendChild(entryElement);
    });
  }

  // Formularelemente
  const form = document.getElementById('habit-form');
  const loadingDiv = document.getElementById('loading');
  const responseContainer = document.getElementById('response-container');
  
  // Reset Button
  document.getElementById('reset-btn').addEventListener('click', () => {
    form.reset();
    responseContainer.classList.add('hidden');
  });
  
  // Regenerate Button
  document.getElementById('regen-btn').addEventListener('click', () => {
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    submitForm();
  });
  
  // Form Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitForm();
  });
  
  // Funktion zum Aktualisieren des Anfragezählers
  function updateRequestCounter(remaining) {
    const counter = document.querySelector('.request-counter');
    const remainingEl = document.getElementById('remaining-requests');
    
    remainingEl.textContent = 5 - remaining;
    
    if (remaining <= 0) {
      counter.classList.add('limit-reached');
    } else {
      counter.classList.remove('limit-reached');
    }
  }
  
  // Funktion für Limit-Popup
  function showLimitPopup(cooldownSeconds) {
    const popup = document.getElementById('limit-popup');
    const countdownEl = document.getElementById('countdown');
    popup.classList.remove('hidden');

    let remaining = cooldownSeconds;
    
    function updateCountdown() {
      const hours = Math.floor(remaining / 3600);
      const minutes = Math.floor((remaining % 3600) / 60);
      const seconds = remaining % 60;
      
      countdownEl.textContent = 
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      if (remaining <= 0) {
        clearInterval(interval);
        popup.classList.add('hidden');
        location.reload();
      } else {
        remaining--;
      }
    }
    
    const interval = setInterval(updateCountdown, 1000);
    updateCountdown();
    
    document.getElementById('register-btn').addEventListener('click', () => {
      window.location.href = 'account.html';
    });
    
    document.getElementById('close-popup').addEventListener('click', () => {
      popup.classList.add('hidden');
      clearInterval(interval);
    });
  }
  
  // Formular-Submit Funktion
  async function submitForm() {
    const gewohnheit = document.getElementById('gewohnheit').value.trim();
    const motivation = document.getElementById('motivation').value.trim();
    const herausforderungen = document.getElementById('herausforderungen').value.trim();
    const bisheriges = document.getElementById('bisheriges').value.trim();

    responseContainer.classList.add('hidden');
    loadingDiv.classList.remove('hidden');

    try {
      const res = await fetch('/api/habit-helper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ gewohnheit, motivation, herausforderungen, bisheriges })
      });

      if (res.status === 429) {
        const data = await res.json();
        showLimitPopup(data.cooldown);
        loadingDiv.classList.add('hidden');
        return;
      }

      if (!res.ok) {
        throw new Error('Fehler beim Server-Request');
      }

      const data = await res.json();
      let fragenText = data.fragen
        .replace(/^\s*\d+\.\s*/gm, '')
        .replace(/^\s*[-*]\s*/gm, '')
        .trim();
      
      loadingDiv.classList.add('hidden');
      const outputContainer = document.querySelector('.questions-output');
      outputContainer.innerHTML = '';
      
      let fragenArray = fragenText.split('\n')
        .filter(frage => frage.trim() !== '')
        .map(frage => frage.replace(/^\s+/, ''));

      fragenArray.forEach((frage, index) => {
        const frageElement = document.createElement('div');
        frageElement.className = 'question-item';
        frageElement.innerHTML = `
          <div class="question-number">${index + 1}</div>
          <div class="question-text">${frage}</div>
        `;
        outputContainer.appendChild(frageElement);
      });

      responseContainer.classList.remove('hidden');

      if (fragenArray.length > 0) {
        saveToHistory(gewohnheit, fragenArray);
      }

      if (data.remaining !== undefined) {
        updateRequestCounter(data.remaining);
      }

      document.getElementById('copy-btn').addEventListener('click', () => {
        navigator.clipboard.writeText(fragenArray.join('\n'));
        alert('Fragen kopiert!');
      });

      document.getElementById('new-btn').addEventListener('click', () => {
        form.reset();
        responseContainer.classList.add('hidden');
      });

    } catch (err) {
      console.error(err);
      loadingDiv.classList.add('hidden');
      const outputContainer = document.querySelector('.questions-output');
      outputContainer.innerHTML = '<div class="error">Beim Laden der Daten ist ein Fehler aufgetreten.</div>';
      responseContainer.classList.remove('hidden');
    }
  }

  // Verlauf löschen
  document.getElementById('clear-history').addEventListener('click', () => {
    localStorage.removeItem('habitHelperHistory');
    renderHistory();
  });

  // Verlauf laden
  document.getElementById('history-container').addEventListener('click', (e) => {
    if (e.target.classList.contains('load-history')) {
      const entryId = e.target.closest('.history-entry').dataset.id;
      const history = JSON.parse(localStorage.getItem('habitHelperHistory')) || [];
      const entry = history.find(item => item.id == entryId);
      
      if (entry) {
        document.querySelector('.questions-output').innerHTML = '';
        
        entry.questions.forEach((frage, index) => {
          const frageElement = document.createElement('div');
          frageElement.className = 'question-item';
          frageElement.innerHTML = `
            <div class="question-number">${index + 1}</div>
            <div class="question-text">${frage}</div>
          `;
          document.querySelector('.questions-output').appendChild(frageElement);
        });
        
        document.getElementById('response-container').classList.remove('hidden');
        window.scrollTo({
          top: document.getElementById('response-container').offsetTop - 100,
          behavior: 'smooth'
        });
      }
    }
  });

  // Prüfe Benutzerstatus
  fetch('/api/auth/status')
    .then(res => res.json())
    .then(user => {
      if (user && !user.error) {
        document.querySelector('.request-counter').classList.add('hidden');
      }
    })
    .catch(err => console.error('Fehler beim Abrufen des Benutzerstatus:', err));

  // Initialisiere Anfragezähler
  updateRequestCounter(5);

  // Initialen Verlauf rendern
  renderHistory();

  // Bewertungen laden
  loadReviews();
  
  // Strukturierte Daten aktualisieren
  updateRatingData();
});