document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('fragebogen-form');
  const ergebnisDiv = document.getElementById('tool-ergebnis');
  const toolName = document.getElementById('tool-name');
  const toolBeschreibung = document.getElementById('tool-beschreibung');
  const toolLink = document.getElementById('tool-link');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Antworten sammeln
    const antworten = {
      q1: form.querySelector('input[name="q1"]:checked').value,
      q2: form.querySelector('input[name="q2"]:checked').value,
      q3: form.querySelector('input[name="q3"]:checked').value
    };
    
    // Tool basierend auf Antworten zuweisen
    let empfehlung;
    
    if (antworten.q1 === 'code' || antworten.q2 === 'komplex') {
      empfehlung = {
        name: 'Coding Project Helper',
        beschreibung: 'Perfekt für technische Probleme und Programmierherausforderungen',
        url: './code-helper.html'
      };
    } 
    else if (antworten.q1 === 'gewohnheit' || antworten.q3 === 'routine') {
      empfehlung = {
        name: 'Habit Helper',
        beschreibung: 'Ideal zum Aufbau neuer Routinen und Veränderung von Gewohnheiten',
        url: './habit-helper.html'
      };
    } 
    else if (antworten.q1 === 'entscheidung' || antworten.q3 === 'entscheidung-treffen') {
      empfehlung = {
        name: 'Situational Decider',
        beschreibung: 'Optimal für strukturierte Entscheidungsfindung bei mehreren Optionen',
        url: './situational-decider.html'
      };
    } 
    else {
      empfehlung = {
        name: 'Random Decider',
        beschreibung: 'Perfekt bei Entscheidungsblockaden oder für kreative Impulse',
        url: './glücksrad.html'
      };
    }
    
    // Ergebnis anzeigen
    toolName.textContent = empfehlung.name;
    toolBeschreibung.textContent = empfehlung.beschreibung;
    toolLink.href = empfehlung.url;
    ergebnisDiv.style.display = 'block';
    
    // Nach unten scrollen, damit das Ergebnis sichtbar ist
    ergebnisDiv.scrollIntoView({ behavior: 'smooth' });
  });
});
