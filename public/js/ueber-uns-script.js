// Einfaches JavaScript für die Über Uns Seite
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
});