document.addEventListener('DOMContentLoaded', function() {
  // Aktiven Menüpunkt markieren
  const currentPage = window.location.pathname.split('/').pop();
  const navLinks = document.querySelectorAll('.nav-list a');
  
  navLinks.forEach(link => {
    if (link.getAttribute('href') === currentPage) {
      link.parentElement.classList.add('active');
    }
  });
  
  // Mobile Navigation
  const menuToggle = document.querySelector('.menu-toggle');
  const closeNav = document.querySelector('.close-nav');
  const mainNav = document.querySelector('.main-nav');
  
  if (menuToggle) {
    menuToggle.addEventListener('click', function() {
      mainNav.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  }
  
  if (closeNav) {
    closeNav.addEventListener('click', function() {
      mainNav.classList.remove('open');
      document.body.style.overflow = '';
    });
  }
  
  // Kontaktformular Handling
  const kontaktForm = document.getElementById('kontakt-form');
  const successModal = document.getElementById('successModal');
  const errorModal = document.getElementById('errorModal');
  const errorMessage = document.getElementById('errorMessage');
  const closeButtons = document.querySelectorAll('.modal-close-btn');

  // Event-Listener für Schließen-Buttons
  closeButtons.forEach(button => {
    button.addEventListener('click', () => {
      successModal.style.display = 'none';
      errorModal.style.display = 'none';
    });
  });

  // Modale schließen bei Klick außerhalb
  window.addEventListener('click', (event) => {
    if (event.target === successModal) {
      successModal.style.display = 'none';
    }
    if (event.target === errorModal) {
      errorModal.style.display = 'none';
    }
  });

  if (kontaktForm) {
    kontaktForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      // Button deaktivieren während der Verarbeitung
      const submitBtn = kontaktForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Wird gesendet...';
      submitBtn.classList.add('loading');
      
      const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        betreff: document.getElementById('betreff').value,
        nachricht: document.getElementById('nachricht').value
      };

      try {
        const response = await fetch('/api/kontakt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        const result = await response.json();
        
        if (response.ok) {
          // Erfolgsmodal anzeigen
          successModal.style.display = 'block';
          kontaktForm.reset();
        } else {
          // Fehlermodal mit spezifischer Nachricht anzeigen
          errorMessage.textContent = result.error || 'Ein unerwarteter Fehler ist aufgetreten';
          errorModal.style.display = 'block';
        }
      } catch (error) {
        // Netzwerkfehler behandeln
        errorMessage.textContent = 'Netzwerkfehler: ' + error.message;
        errorModal.style.display = 'block';
      } finally {
        // Button wieder aktivieren
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
        submitBtn.classList.remove('loading');
      }
    });
  }
});