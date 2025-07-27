// UI-Elemente
const logoutBtn = document.getElementById('logout-btn');
const editProfileBtn = document.getElementById('edit-profile-btn');
const changePasswordBtn = document.getElementById('change-password-btn');
const deleteAccountBtn = document.getElementById('delete-account-btn');
const saveEmailBtn = document.getElementById('save-email-btn');
const cancelEmailBtn = document.getElementById('cancel-email-btn');
const savePasswordBtn = document.getElementById('save-password-btn');
const cancelPasswordBtn = document.getElementById('cancel-password-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const editProfilePicBtn = document.getElementById('editProfilePic');

// Popup-Elemente
const logoutPopup = document.getElementById('logoutPopup');
const deleteConfirmPopup = document.getElementById('deleteConfirmPopup');
const closeLogoutPopup = document.getElementById('closeLogoutPopup');
const profilePicPopup = document.getElementById('profilePicOptionsPopup');
const deleteProfilePicBtn = document.getElementById('deleteProfilePicBtn');
const selectNewProfilePicBtn = document.getElementById('selectNewProfilePicBtn');
const cancelProfilePicBtn = document.getElementById('cancelProfilePicBtn');

// Formulare
const emailEditForm = document.getElementById('email-edit-form');
const passwordEditForm = document.getElementById('password-edit-form');

// Benutzerdaten laden
document.addEventListener('DOMContentLoaded', loadUserData);

// Event-Listener
logoutBtn.addEventListener('click', handleLogout);
closeLogoutPopup.addEventListener('click', closeLogoutPopupHandler);

editProfileBtn.addEventListener('click', () => {
  emailEditForm.style.display = 'block';
});

changePasswordBtn.addEventListener('click', () => {
  passwordEditForm.style.display = 'block';
});

deleteAccountBtn.addEventListener('click', () => {
  deleteConfirmPopup.style.display = 'block';
});

cancelEmailBtn.addEventListener('click', () => {
  emailEditForm.style.display = 'none';
});

cancelPasswordBtn.addEventListener('click', () => {
  passwordEditForm.style.display = 'none';
});

cancelDeleteBtn.addEventListener('click', () => {
  deleteConfirmPopup.style.display = 'none';
});

saveEmailBtn.addEventListener('click', saveEmailChanges);
savePasswordBtn.addEventListener('click', savePasswordChanges);
confirmDeleteBtn.addEventListener('click', deleteAccount);
editProfilePicBtn.addEventListener('click', showProfilePicPopup);

// Profilbild-Popup Buttons
deleteProfilePicBtn.addEventListener('click', deleteProfilePicture);
selectNewProfilePicBtn.addEventListener('click', selectNewProfilePicture);
cancelProfilePicBtn.addEventListener('click', closeProfilePicPopup);

// Editable Fields
document.querySelectorAll('.editable').forEach(item => {
  item.addEventListener('click', function() {
    const field = this.getAttribute('data-field');
    if (field === 'email') {
      emailEditForm.style.display = 'block';
    }
  });
});

// Funktionen
async function loadUserData() {
  try {
    const response = await fetch('/api/auth/status', {
      method: 'GET',
      credentials: 'include'
    });
    
    if (response.ok) {
      const user = await response.json();
      updateUserUI(user);
    } else {
      window.location.href = '/html/account.html';
    }
  } catch (error) {
    console.error('Fehler beim Laden der Benutzerdaten:', error);
    window.location.href = '/html/account.html';
  }
}

function updateUserUI(user) {
  // Verwende Anzeigename falls vorhanden, sonst E-Mail
  const displayName = user.name || user.email;
  
  document.getElementById('account-email').textContent = displayName;
  document.getElementById('detail-email').textContent = user.email;
  document.getElementById('detail-join-date').textContent = new Date(user.created).toLocaleDateString('de-DE');
  document.getElementById('detail-last-login').textContent = new Date().toLocaleDateString('de-DE');
  document.getElementById('detail-account-type').textContent = user.accountType || 'Kostenlos';
  
  // Profilbild für Google-Benutzer
  if (user.googleId) {
    const googleImage = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`;
    document.getElementById('profile-image').src = googleImage;
  } else if (user.profileImage) {
    document.getElementById('profile-image').src = user.profileImage;
  }
}

async function handleLogout() {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    
    if (response.ok) {
      logoutPopup.classList.add('active');
      setTimeout(() => {
        logoutPopup.classList.remove('active');
        window.location.href = '/html/account.html';
      }, 3000);
    } else {
      console.error('Abmeldung fehlgeschlagen');
    }
  } catch (error) {
    console.error('Fehler bei der Abmeldung:', error);
  }
}

function closeLogoutPopupHandler() {
  logoutPopup.classList.remove('active');
  window.location.href = '/html/account.html';
}

async function saveEmailChanges() {
  // Hier würde die Logik zum Ändern der E-Mail implementiert werden
  console.log('E-Mail-Änderung wurde angefordert');
}

async function savePasswordChanges() {
  // Hier würde die Logik zum Ändern des Passworts implementiert werden
  console.log('Passwortänderung wurde angefordert');
}

async function deleteAccount() {
  // Hier würde die Logik zum Löschen des Kontos implementiert werden
  console.log('Kontolöschung wurde angefordert');
}

// Profilbild-Funktionen
function showProfilePicPopup() {
  profilePicPopup.style.display = 'flex';
}

function closeProfilePicPopup() {
  profilePicPopup.style.display = 'none';
}

function deleteProfilePicture() {
  // Standardbild setzen
  const defaultImage = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><circle cx='12' cy='8' r='4' fill='%234f46e5'/><path d='M20 19v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6z' fill='%234f46e5'/></svg>";
  document.getElementById('profile-image').src = defaultImage;
  
  // API-Aufruf zum Löschen des Profilbilds (in echtem Projekt)
  // fetch('/api/user/delete-profile-pic', { method: 'POST' })
  
  // Popup schließen
  closeProfilePicPopup();
}

function selectNewProfilePicture() {
  // Popup schließen
  closeProfilePicPopup();
  
  // Dateiauswahldialog öffnen
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  
  fileInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        // Bildvorschau anzeigen
        const reader = new FileReader();
        reader.onload = (event) => {
          document.getElementById('profile-image').src = event.target.result;
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Fehler beim Hochladen des Profilbilds:', error);
      }
    }
  };
  
  fileInput.click();
}