document.addEventListener('DOMContentLoaded', function() {
  const cookieConsent = document.getElementById('cookie-consent');
  const privacyPopup = document.getElementById('privacy-popup');
  const acceptBtn = document.getElementById('cookie-accept');
  const declineBtn = document.getElementById('cookie-decline');
  const acceptNecessaryBtn = document.getElementById('privacy-accept-necessary');
  
  // Prüfen ob Zustimmung bereits gegeben wurde
  if (!getCookie('cookieConsent')) {
    setTimeout(() => {
      cookieConsent.style.display = 'block';
    }, 1500);
  }
  
  // Akzeptieren-Button
  acceptBtn.addEventListener('click', function() {
    setCookie('cookieConsent', 'accepted', 365);
    cookieConsent.style.display = 'none';
    // Hier können Sie zusätzliche Cookies laden
  });
  
  // Nicht akzeptieren-Button
  declineBtn.addEventListener('click', function() {
    setCookie('cookieConsent', 'declined', 365);
    cookieConsent.style.display = 'none';
    privacyPopup.style.display = 'block';
  });
  
  // Nur notwendige Cookies akzeptieren
  acceptNecessaryBtn.addEventListener('click', function() {
    setCookie('cookieConsent', 'declined', 365);
    privacyPopup.style.display = 'none';
  });
  
  // Cookie-Funktionen
  function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    
    // Bestimmen ob wir in der Produktionsumgebung sind
    const isProduction = window.location.hostname !== 'localhost' && 
                         window.location.hostname !== '127.0.0.1';
    
    // Cookie-String mit dynamischen Attributen
    let cookieString = `${name}=${value};${expires};path=/`;
    
    if (isProduction) {
      cookieString += ';SameSite=None;Secure';
    } else {
      cookieString += ';SameSite=Lax';
    }
    
    document.cookie = cookieString;
  }
  
  function getCookie(name) {
    const cookieName = name + "=";
    const cookies = decodeURIComponent(document.cookie).split(';');
    for(let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i].trim();
      if (cookie.indexOf(cookieName) === 0) {
        return cookie.substring(cookieName.length, cookie.length);
      }
    }
    return "";
  }
  
  // Schließen bei Klick außerhalb des Popups
  document.addEventListener('click', function(event) {
    if (cookieConsent.style.display === 'block' && 
        !cookieConsent.contains(event.target)) {
      cookieConsent.style.display = 'none';
    }
    if (privacyPopup.style.display === 'block' && 
        !privacyPopup.contains(event.target)) {
      privacyPopup.style.display = 'none';
    }
  });
});
