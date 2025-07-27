document.addEventListener('DOMContentLoaded', function() {
  const canvas = document.getElementById('wheel-canvas');
  const ctx = canvas.getContext('2d');
  const spinBtn = document.getElementById('spin-btn');
  const wheelForm = document.getElementById('wheel-form');
  const resultContainer = document.getElementById('result-container');
  const resultValue = document.getElementById('result-value');
  const resetBtn = document.getElementById('reset-btn');
  const optionsContainer = document.getElementById('options-container');
  const addOptionBtn = document.getElementById('add-option');

  let options = ['Option 1', 'Option 2'];
  let spinning = false;
  let rotation = 0;
  let selectedOption = null;
  let optionCount = 2;
  let spinCount = 0;
  const MAX_SPINS = 5;
  let history = JSON.parse(localStorage.getItem('wheelHistory')) || [];
  let isLoggedIn = false;

  function setCanvasSize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    drawWheel();
  }

  const colors = ['#4f46e5', '#818cf8', '#c7d2fe', '#a5b4fc', '#8b5cf6', '#7c3aed'];

  function drawWheel() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);

    const segmentAngle = (2 * Math.PI) / options.length;

    for (let i = 0; i < options.length; i++) {
      const startAngle = i * segmentAngle;
      const endAngle = (i + 1) * segmentAngle;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();

      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.rotate(startAngle + segmentAngle / 2);

      const fontSize = Math.min(20, Math.max(14, 20 - Math.floor(options[i].length / 5)));
      ctx.font = `bold ${fontSize}px Arial`;

      let displayText = options[i];
      const maxLength = 15;
      if (displayText.length > maxLength) {
        displayText = displayText.substring(0, maxLength - 3) + '...';
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';

      const textRadius = radius * 0.65;
      ctx.fillText(displayText, textRadius, 0);
      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.1, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  function spinWheel() {
    if (spinning) return;

    if (isLoggedIn) {
      spinning = true;
      spinBtn.disabled = true;
      resultContainer.style.display = 'none';

      const targetRotation = rotation + (Math.PI * 2 * 3) + (Math.random() * Math.PI * 2);
      const duration = 3000;

      const startTime = Date.now();

      function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = (1 - Math.cos(progress * Math.PI)) / 2;
        rotation = (targetRotation - rotation) * easeProgress;

        drawWheel();

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          finishSpin();
        }
      }

      animate();
    } else {
      checkSpinLimit()
        .then(limitOk => {
          if (!limitOk) {
            return;
          }

          spinning = true;
          spinBtn.disabled = true;
          resultContainer.style.display = 'none';

          const targetRotation = rotation + (Math.PI * 2 * 3) + (Math.random() * Math.PI * 2);
          const duration = 3000;

          const startTime = Date.now();

          function animate() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = (1 - Math.cos(progress * Math.PI)) / 2;
            rotation = (targetRotation - rotation) * easeProgress;

            drawWheel();

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              finishSpin();
            }
          }

          animate();
        })
        .catch(err => {
          console.error('Fehler bei der Limitprüfung:', err);
        });
    }
  }

  function finishSpin() {
    spinning = false;

    const normalizedRotation = rotation % (2 * Math.PI);
    const arrowAngle = 3 * Math.PI / 2;
    let theta = (arrowAngle - normalizedRotation) % (2 * Math.PI);
    if (theta < 0) theta += 2 * Math.PI;
    const segmentAngle = (2 * Math.PI) / options.length;
    const selectedIndex = Math.floor(theta / segmentAngle);
    selectedOption = options[selectedIndex];

    resultValue.textContent = selectedOption;
    resultContainer.style.display = 'block';

    spinBtn.disabled = false;

    saveToHistory(selectedOption);

    if (!isLoggedIn) {
      spinCount++;
      updateSpinCounter();

      if (spinCount >= MAX_SPINS) {
        setTimeout(() => {
          showLimitPopup();
          spinBtn.disabled = true;
        }, 1000);
      }
    }
  }

  addOptionBtn.addEventListener('click', () => {
    if (optionCount >= 6) return;

    optionCount++;
    const newIndex = optionCount - 1;

    const optionGroup = document.createElement('div');
    optionGroup.className = 'input-group';
    optionGroup.innerHTML = `
      <label>Option ${optionCount}</label>
      <input type="text" data-index="${newIndex}" placeholder="z.B. Option ${optionCount}" required>
      <button type="button" class="remove-option">×</button>
    `;

    optionsContainer.appendChild(optionGroup);
  });

  optionsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-option') && optionCount > 2) {
      e.target.closest('.input-group').remove();
      optionCount--;

      document.querySelectorAll('.input-group label').forEach((label, index) => {
        label.textContent = `Option ${index + 1}`;
      });
    }
  });

  wheelForm.addEventListener('submit', function(e) {
    e.preventDefault();

    options = [];
    document.querySelectorAll('#options-container input').forEach(input => {
      if (input.value.trim()) {
        options.push(input.value.trim());
      }
    });

    if (options.length >= 2) {
      setCanvasSize();
      spinBtn.disabled = false;
    }
  });

  spinBtn.addEventListener('click', spinWheel);

  resetBtn.addEventListener('click', function() {
    while (optionsContainer.children.length > 2) {
      optionsContainer.removeChild(optionsContainer.lastChild);
    }

    document.querySelectorAll('#options-container input').forEach((input, index) => {
      input.value = '';
      if (index === 0) {
        input.placeholder = 'z.B. Pizza';
      } else if (index === 1) {
        input.placeholder = 'z.B. Burger';
      }
    });

    options = ['Option 1', 'Option 2'];
    setCanvasSize();
    resultContainer.style.display = 'none';
    spinBtn.disabled = true;

    optionCount = 2;
    document.querySelectorAll('.input-group label').forEach((label, index) => {
      label.textContent = `Option ${index + 1}`;
    });
  });

  setCanvasSize();

  window.addEventListener('resize', setCanvasSize);

  function saveToHistory(selectedOption) {
    const entry = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      options: [...options],
      result: selectedOption
    };

    history.unshift(entry);
    if (history.length > 10) history = history.slice(0, 10);
    localStorage.setItem('wheelHistory', JSON.stringify(history));

    renderHistory();
  }

  function renderHistory() {
    const container = document.getElementById('history-container');
    const historySection = document.getElementById('history-section');

    container.innerHTML = '';

    if (history.length === 0) {
      container.innerHTML = '<p class="empty-history">Keine vorherigen Entscheidungen</p>';
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
        </div>
        <div class="history-result-container">
          <div class="history-label">Ergebnis:</div>
          <div class="history-result">${entry.result}</div>
        </div>
        <div class="history-options">
          <span>Optionen:</span> ${entry.options.join(', ')}
        </div>
      `;
      container.appendChild(entryElement);
    });
  }

  function showLimitPopup() {
    if (isLoggedIn) return;

    const popup = document.getElementById('limit-popup');
    const countdownEl = document.getElementById('countdown');
    popup.classList.remove('hidden');

    let remaining = 24 * 60 * 60;

    function updateCountdown() {
      const hours = Math.floor(remaining / 3600);
      const minutes = Math.floor((remaining % 3600) / 60);
      const seconds = remaining % 60;

      countdownEl.textContent = 
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

      if (remaining <= 0) {
        clearInterval(interval);
        popup.classList.add('hidden');
        spinCount = 0;
        updateSpinCounter();
        spinBtn.disabled = false;
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

  function updateSpinCounter() {
    const remainingEl = document.getElementById('remaining-spins');
    remainingEl.textContent = MAX_SPINS - spinCount;
  }

  document.getElementById('clear-history').addEventListener('click', () => {
    localStorage.removeItem('wheelHistory');
    history = [];
    renderHistory();
  });

  function checkSpinLimit() {
    return fetch('/api/check-spin-limit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin'
    })
    .then(res => {
      if (res.status === 429) {
        return res.json().then(data => {
          showLimitPopup();
          spinBtn.disabled = true;
          return false;
        });
      } else if (res.ok) {
        return res.json().then(data => {
          if (data.unlimited) {
            return true;
          } else {
            spinCount = MAX_SPINS - data.remaining;
            updateSpinCounter();
            return true;
          }
        });
      } else {
        throw new Error('Fehler bei der Limitprüfung');
      }
    });
  }

  renderHistory();

  fetch('/api/auth/status')
    .then(res => res.json())
    .then(user => {
      const userStatusEl = document.getElementById('user-status');
      const userEmailEl = document.getElementById('user-email');
      
      if (user && !user.error) {
        isLoggedIn = true;
        document.querySelector('.usage-counter').classList.add('hidden');
        spinCount = 0;
        spinBtn.disabled = false;
        
        // Benutzerstatus anzeigen
        userStatusEl.classList.remove('hidden');
        userEmailEl.textContent = user.email;
      } else {
        isLoggedIn = false;
        updateSpinCounter();
        
        // Benutzerstatus verstecken
        userStatusEl.classList.add('hidden');
      }
    })
    .catch(err => console.error('Fehler beim Abrufen des Benutzerstatus:', err));

  const wheelSection = document.querySelector('.wheel-section');
  const historySection = document.getElementById('history-section');

  function adjustHistoryWidth() {
    if (wheelSection && historySection) {
      historySection.style.width = window.getComputedStyle(wheelSection).width;
      historySection.style.maxWidth = window.getComputedStyle(wheelSection).maxWidth;
      historySection.style.margin = '3rem auto';
    }
  }

  adjustHistoryWidth();
  window.addEventListener('resize', adjustHistoryWidth);
});

