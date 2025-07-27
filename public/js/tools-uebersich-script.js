document.addEventListener('DOMContentLoaded', function() {
  // Funktion zum Angleichen der Kartenhöhen
  function adjustCardHeights() {
    // Nur im Desktop-Modus (mehrspaltiges Layout)
    if (window.innerWidth > 900) {
      const cards = Array.from(document.querySelectorAll('.tool-card'));
      let maxHeight = 0;
      
      // 1. Höhe aller Karten zurücksetzen und maximale Höhe ermitteln
      cards.forEach(card => {
        card.style.height = 'auto';
        if (!card.querySelector('.toggle-details.active')) {
          const height = card.getBoundingClientRect().height;
          if (height > maxHeight) maxHeight = height;
        }
      });
      
      // 2. Höhe für nicht-ausgeklappte Karten setzen
      cards.forEach(card => {
        if (!card.querySelector('.toggle-details.active')) {
          card.style.height = `${maxHeight}px`;
        }
      });
    } else {
      // Mobile Ansicht: Höhe zurücksetzen
      document.querySelectorAll('.tool-card').forEach(card => {
        card.style.height = 'auto';
      });
    }
  }

  // Funktion zum Umschalten der Detailansicht
  const toggleButtons = document.querySelectorAll('.toggle-details');
  
  toggleButtons.forEach(button => {
    button.addEventListener('click', function() {
      const card = this.closest('.tool-card');
      const detailsContainer = this.nextElementSibling;
      const isActive = this.classList.contains('active');
      
      if (isActive) {
        // Details ausblenden
        detailsContainer.style.display = 'none';
        this.classList.remove('active');
        this.textContent = 'Video ansehen';
        
        // Höhe anpassen
        adjustCardHeights();
      } else {
        // Details einblenden
        detailsContainer.style.display = 'flex';
        this.classList.add('active');
        this.textContent = 'Video schließen';
        
        // Höhe der ausgeklappten Karte auf auto setzen
        card.style.height = 'auto';
      }
    });
  });
  
  // Initiale Anpassung und bei Änderungen
  adjustCardHeights();
  window.addEventListener('resize', adjustCardHeights);
  window.addEventListener('load', adjustCardHeights);
});