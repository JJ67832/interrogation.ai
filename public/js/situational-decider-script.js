document.addEventListener('DOMContentLoaded', () => {
  function updateRatingData() {
    fetch('/api/structured-data')
      .then(res => res.json())
      .then(data => {
        const scriptElement = document.querySelector('script[type="application/ld+json"]');
        if (scriptElement) scriptElement.textContent = JSON.stringify(data);
        
        const aggregateRating = document.getElementById('aggregate-rating');
        if (aggregateRating) aggregateRating.textContent = `★ ${data.aggregateRating.ratingValue} · ${data.aggregateRating.reviewCount} Bewertungen`;
      })
      .catch(err => console.error('Fehler beim Aktualisieren der Bewertungsdaten:', err));
  }

  function loadReviews() {
    fetch('/api/bewertungen')
      .then(res => res.json())
      .then(data => {
        const reviewsContainer = document.getElementById('reviews-list');
        if (!reviewsContainer) return;

        const reviewsToShow = [...data.reviews]
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 3);

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

  function saveToHistory(entscheidung, questions) {
    const entry = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      entscheidung,
      questions
    };

    let history = JSON.parse(localStorage.getItem('situationalDeciderHistory')) || [];
    history.unshift(entry);
    if (history.length > 10) history = history.slice(0, 10);
    localStorage.setItem('situationalDeciderHistory', JSON.stringify(history));
    
    renderHistory();
  }

  function renderHistory() {
    const container = document.getElementById('history-container');
    const history = JSON.parse(localStorage.getItem('situationalDeciderHistory')) || [];
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
          <span class="history-project">${entry.entscheidung}</span>
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

  const form = document.getElementById('situation-form');
  const loadingDiv = document.getElementById('loading');
  const responseContainer = document.getElementById('response-container');
  
  document.getElementById('reset-btn').addEventListener('click', () => {
    form.reset();
    responseContainer.classList.add('hidden');
  });
  
  document.getElementById('regen-btn').addEventListener('click', () => {
    if (!form.checkValidity()) return form.reportValidity();
    submitForm();
  });
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitForm();
  });
  
  function updateRequestCounter(remaining) {
    const counter = document.querySelector('.request-counter');
    const remainingEl = document.getElementById('remaining-requests');
    
    remainingEl.textContent = 5 - remaining;
    remaining <= 0 
      ? counter.classList.add('limit-reached') 
      : counter.classList.remove('limit-reached');
  }
  
  function showLimitPopup(cooldownSeconds) {
    const popup = document.getElementById('limit-popup');
    const countdownEl = document.getElementById('countdown');
    popup.classList.remove('hidden');

    let remaining = cooldownSeconds;
    
    function updateCountdown() {
      const hours = Math.floor(remaining / 3600).toString().padStart(2, '0');
      const minutes = Math.floor((remaining % 3600) / 60).toString().padStart(2, '0');
      const seconds = (remaining % 60).toString().padStart(2, '0');
      
      countdownEl.textContent = `${hours}:${minutes}:${seconds}`;
      
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
  
  async function submitForm() {
    const entscheidung = document.getElementById('entscheidung').value.trim();
    const optionen = document.getElementById('optionen').value.trim();
    const kriterien = document.getElementById('kriterien').value.trim();
    const unsicherheiten = document.getElementById('unsicherheiten').value.trim();

    responseContainer.classList.add('hidden');
    loadingDiv.classList.remove('hidden');

    try {
      const res = await fetch('/api/situational-decider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entscheidung, optionen, kriterien, unsicherheiten })
      });

      if (res.status === 429) {
        const data = await res.json();
        showLimitPopup(data.cooldown);
        loadingDiv.classList.add('hidden');
        return;
      }

      if (!res.ok) throw new Error('Fehler beim Server-Request');

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

      if (fragenArray.length > 0) saveToHistory(entscheidung, fragenArray);
      if (data.remaining !== undefined) updateRequestCounter(data.remaining);

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

  document.getElementById('clear-history').addEventListener('click', () => {
    localStorage.removeItem('situationalDeciderHistory');
    renderHistory();
  });

  document.getElementById('history-container').addEventListener('click', (e) => {
    if (e.target.classList.contains('load-history')) {
      const entryId = e.target.closest('.history-entry').dataset.id;
      const history = JSON.parse(localStorage.getItem('situationalDeciderHistory')) || [];
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

  fetch('/api/auth/status')
    .then(res => res.json())
    .then(user => {
      if (user && !user.error) {
        document.querySelector('.request-counter').classList.add('hidden');
      }
    })
    .catch(err => console.error('Fehler beim Abrufen des Benutzerstatus:', err));

  updateRequestCounter(5);
  renderHistory();
  loadReviews();
  updateRatingData();
});