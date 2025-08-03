require('dotenv').config();
const express = require('express');
const session = require('express-session');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Proxy-Support für Render aktivieren
app.set('trust proxy', 1);

// CORS-Einstellungen für Produktion
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'https://interrogation-ai-3.onrender.com'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

// Session-Konfiguration für Produktion
app.use(session({
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  proxy: true, // Wichtig für Reverse-Proxy
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    httpOnly: true,
    path: '/'
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Google Strategy mit dynamischer Callback-URL
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.NODE_ENV === 'production' 
      ? 'https://interrogation-ai-3.onrender.com/auth/google/callback' 
      : process.env.GOOGLE_CALLBACK_URL,
    scope: ['profile', 'email'],
    state: true
  },
  (accessToken, refreshToken, profile, done) => {
    const users = readUsers();
    let user = users.find(u => u.googleId === profile.id || u.email === profile.emails[0].value);
    
    if (!user) {
      user = {
        id: crypto.randomBytes(16).toString('hex'),
        email: profile.emails[0].value,
        googleId: profile.id,
        name: profile.displayName,
        created: new Date().toISOString()
      };
      users.push(user);
      saveUsers(users);
    } else if (!user.googleId) {
      user.googleId = profile.id;
      saveUsers(users);
    }
    
    return done(null, user);
  }
));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  const user = readUsers().find(u => u.id === id);
  done(null, user);
});

app.get('/auth/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account' 
  })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/html/account.html',
    session: true 
  }),
  (req, res) => {
    // Flag für Willkommens-Popup setzen
    req.session.showWelcomePopup = true;
    // Weiterleitung zum Tools-Fragebogen
    res.redirect('/html/tools-fragebogen.html');
  }
);

app.get('/auth/logout', (req, res) => {
  req.logout(err => {
    if (err) return res.status(500).json({ error: 'Abmeldung fehlgeschlagen' });
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.redirect('/');
    });
  });
});

const USERS_FILE = path.join(__dirname, 'users.json');

function readUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Fehler beim Lesen der Benutzerdaten:', error);
  }
  return [];
}

function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (error) {
    console.error('Fehler beim Speichern der Benutzerdaten:', error);
  }
}

app.post('/api/auth/register', (req, res) => {
  const { email, password } = req.body;
  const users = readUsers();
  
  if (users.some(user => user.email === email)) {
    return res.status(400).json({ error: 'Benutzer existiert bereits' });
  }
  
  const newUser = {
    id: crypto.randomBytes(16).toString('hex'),
    email,
    password,
    created: new Date().toISOString()
  };
  
  users.push(newUser);
  saveUsers(users);
  
  req.session.user = { id: newUser.id, email: newUser.email };
  // Flag für Willkommens-Popup setzen
  req.session.showWelcomePopup = true;
  
  // Weiterleitung zum Tools-Fragebogen
  res.redirect('/html/tools-fragebogen.html');
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const users = readUsers();
  
  const user = users.find(u => u.email === email && u.password === password);
  
  if (user) {
    req.session.user = { id: user.id, email: user.email };
    // Flag für Willkommens-Popup setzen
    req.session.showWelcomePopup = true;
    // Weiterleitung zum Tools-Fragebogen
    res.redirect('/html/tools-fragebogen.html');
  } else {
    res.status(401).json({ error: 'Ungültige Anmeldedaten' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: 'Abmeldung fehlgeschlagen' });
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

app.get('/api/auth/status', (req, res) => {
  const user = req.user || req.session.user;
  // Flag für Willkommens-Popup aus der Session lesen
  const showWelcomePopup = req.session.showWelcomePopup || false;

  if (user) {
    const userData = {
      id: user.id,
      email: user.email,
      created: user.created || new Date().toISOString(),
      accountType: 'Kostenlos',
      googleId: user.googleId,
      name: user.name || user.email.split('@')[0],
      showWelcomePopup: showWelcomePopup // Flag an Frontend senden
    };
    
    // Flag SOFORT zurücksetzen nach dem Abruf
    if (req.session.showWelcomePopup) {
      delete req.session.showWelcomePopup;
    }
    
    res.json(userData);
  } else {
    res.status(401).json({ error: 'Nicht angemeldet' });
  }
});

app.post('/search', (req, res) => {
  const searchTerm = req.body.term.toLowerCase();
  if (!searchTerm) return res.json([]);

  const baseUrl = req.headers.referer && req.headers.referer.includes('/html/') 
    ? '' 
    : '/html/';

  const pages = [
    { 
      id: 1, 
      title: 'Coding Project Helper', 
      description: 'Löse technische Probleme, debugge Code und erhalte Lösungsansätze für deine Programmierprojekte.',
      url: baseUrl + 'code-helper.html',
      tags: [
        'coding', 'programmierung', 'debug', 'react', 'javascript', 'entwicklung',
        'technisches problem', 'code fehler', 'programm absturz', 'bug beheben',
        'algorithmus verbessern', 'performance problem', 'struktur problem',
        'wie debugge ich', 'warum funktioniert code nicht', 'technische frage',
        'programmierhilfe', 'code optimierung', 'fehlersuche',
        'software entwickeln', 'code struktur', 'architektur verbessern'
      ] 
    },
    { 
      id: 13, 
      title: 'Habit Helper', 
      description: 'Baue bessere Gewohnheiten auf, breche schlechte Angewohnheiten ab und erreiche deine persönlichen Ziele.',
      url: baseUrl + 'habit-helper.html',
      tags: [
        'gewohnheit', 'routine', 'selbstverbesserung', 'persönliche entwicklung', 'ziele',
        'gewohnheiten ändern', 'disziplin', 'zeitmanagement', 'produktivität',
        'schlechte gewohnheiten loswerden', 'routinen aufbauen', 'selbstoptimierung',
        'motivation', 'verhaltensänderung', 'tägliche routine', 'gewohnheitstracker',
        'gewohnheitsbildung', 'persönliches wachstum', 'lebensstil ändern'
      ] 
    },
    { 
      id: 14, 
      title: 'Situational Decider', 
      description: 'Treffe bessere Entscheidungen durch strukturierte Analyse deiner Optionen und Prioritäten.',
      url: baseUrl + 'situational-decider.html',
      tags: [
        'entscheidung', 'analyse', 'situation', 'priorisierung', 'wahl',
        'schwierige entscheidung', 'pro contra', 'optionen bewerten',
        'wie entscheide ich', 'lösungsfindung', 'abwägen', 
        'prioritäten setzen', 'konsequenzen abschätzen', 'entscheidungsfindung',
        'dilemma lösen', 'problemlösung', 'alternativen bewerten',
        'entscheidungshilfe', 'entscheidungsprozest', 'situation analysieren',
        'wahl treffen', 'optionen vergleichen', 'entscheidungsmatrix'
      ] 
    },
    { 
      id: 4, 
      title: 'Random Decider', 
      description: 'Lass den Zufall entscheiden oder generiere zufällige Optionen bei Entscheidungsblockaden.',
      url: baseUrl + 'glücksrad.html',
      tags: [
        'zufall', 'entscheidung', 'auswahl', 'glücksrad', 'wahl',
        'entscheidungshilfe', 'zufallsentscheidung', 'wahl treffen',
        'auswahlhilfe', 'blockade überwinden', 'kreative lösungen',
        'ideen finden', 'impuls geben', 'entscheidungsmüdigkeit',
        'wie wählen', 'optionen generieren', 'zufallsgenerator',
        'zufällige auswahl', 'entscheidung dem zufall überlassen', 'glücksrad entscheidung',
        'kreativitätsblockade', 'inspiration finden', 'zufallsprinzip'
      ] 
    },
    { 
      id: 5, 
      title: 'Account', 
      description: 'Anmelden oder Registrieren für dein Benutzerkonto',
      url: baseUrl + 'account.html',
      tags: ['login', 'anmeldung', 'registrierung', 'benutzer', 'konto'] 
    },
    { 
      id: 6, 
      title: 'Account Management', 
      description: 'Verwalte deine Kontoeinstellungen und persönlichen Daten',
      url: baseUrl + 'account-management.html',
      tags: ['account', 'profil', 'einstellungen', 'verwaltung', 'daten'] 
    },
    { 
      id: 7, 
      title: 'Datenschutzerklärung', 
      description: 'Informationen zum Umgang mit deinen Daten',
      url: baseUrl + 'datenschutz.html',
      tags: ['datenschutz', 'privacy', 'daten', 'gdpr', 'dsgvo', 'recht'] 
    },
    { 
      id: 8, 
      title: 'Impressum', 
      description: 'Rechtliche Informationen über interrogation.ai',
      url: baseUrl + 'impressum.html',
      tags: ['impressum', 'legal', 'kontakt', 'haftung', 'rechtlich'] 
    },
    { 
      id: 9, 
      title: 'Kontakt', 
      description: 'Kontaktiere unser Team für Fragen und Feedback',
      url: baseUrl + 'kontakt.html',
      tags: ['kontakt', 'support', 'fragen', 'feedback', 'hilfe', 'email'] 
    },
    { 
      id: 10, 
      title: 'Über Uns', 
      description: 'Lies unseren persönlichen Brief und erfahre mehr über die Mission von interrogation.ai',
      url: baseUrl + 'ueber-uns.html',
      tags: ['über uns', 'team', 'mission', 'vision', 'philosophie', 'brief', 'geschichte'] 
    },
    { 
      id: 11, 
      title: 'Tools Übersicht', 
      description: 'Entdecke alle KI-Tools von interrogation.ai auf einen Blick',
      url: baseUrl + 'tools-uebersicht.html',
      tags: ['tools', 'übersicht', 'alle', 'ki-tools', 'liste', 'katalog'] 
    },
    { 
      id: 12, 
      title: 'Startseite', 
      description: 'Willkommen bei interrogation.ai',
      url: baseUrl + '../index.html',
      tags: ['start', 'home', 'willkommen', 'hauptseite', 'übersicht'] 
    }
  ];

  const results = pages.filter(page => {
    return page.title.toLowerCase().includes(searchTerm) ||
           page.description.toLowerCase().includes(searchTerm) ||
           page.tags.some(tag => tag.includes(searchTerm));
  });

  res.json(results);
});

app.post('/api/ask', async (req, res) => {
  try {
    if (!req.session.requestCount) req.session.requestCount = 0;

    if (!req.session.user && req.session.requestCount >= 5) {
      return res.status(429).json({ 
        error: 'Anfragelimit erreicht',
        cooldown: 5 * 60 * 60
      });
    }

    const { projekt, problem, erwartung, bisheriges } = req.body;
    if (!projekt || !problem || !erwartung || !bisheriges) {
      return res.status(400).json({ error: 'Alle Felder sind erforderlich.' });
    }

    const systemPrompt = `Du bist "Coding Project Helper" - ein technischer Frage-Coach für Programmierprojekte. 
Generiere ausschließlich klärende FRAGEN zu folgenden Aspekten:
1. Code-Struktur und Architektur
2. Algorithmen und Logik
3. Spezifische Technologien/Frameworks
4. Debugging-Strategien
5. Performance-Optimierung
6. Fehleranalyse

Halte dich an diese Regeln:
- Stelle nur Fragen, keine Lösungen oder Hinweise
- Formuliere präzise technische Fragen
- Vermeide Wiederholungen des Benutzerinputs
- Maximal 6 Fragen generieren
- Fragen nummeriert als Liste ausgeben
- Antwort ausschließlich auf Deutsch
`;

    const userPrompt = `
Projekt-Typ: ${projekt}
Technisches Problem: ${problem}
Gewünschte Lösung: ${erwartung}
Bereits versucht: ${bisheriges}
`.trim();

    const apiKey = process.env.MISTRAL_API_KEY;
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'mistral-tiny',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Mistral API-Fehler:', errText);
      return res.status(502).json({ error: 'Fehler bei der Mistral-API.' });
    }

    const data = await response.json();
    const outputText = data.choices?.[0]?.message?.content?.trim() || 
                      'Leider konnte ich keine Antwort generieren.';

    req.session.requestCount++;
    const remaining = 5 - req.session.requestCount;
    
    res.json({ fragen: outputText, remaining });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler.' });
  }
});

app.post('/api/habit-helper', async (req, res) => {
  try {
    if (!req.session.requestCount) req.session.requestCount = 0;

    if (!req.session.user && req.session.requestCount >= 5) {
      return res.status(429).json({ 
        error: 'Anfragelimit erreicht',
        cooldown: 5 * 60 * 60
      });
    }

    const { gewohnheit, motivation, herausforderungen, bisheriges } = req.body;
    if (!gewohnheit || !motivation || !herausforderungen || !bisheriges) {
      return res.status(400).json({ error: 'Alle Felder sind erforderlich.' });
    }

    const systemPrompt = `Du bist "Habit Helper" - ein Coach für Gewohnheitsbildung und persönliche Entwicklung. 
Generiere ausschließlich klärende FRAGEN zu folgenden Aspekten:
1. Zielklarheit und Motivation
2. Konkrete Umsetzungsstrategien
3. Hindernisse und Lösungsansätze
4. Fortschrittsmessung
5. Umgebungsgestaltung
6. Belohnungssysteme

Halte dich an diese Regeln:
- Stelle nur Fragen, keine Ratschläge oder Lösungen
- Formuliere empathisch und persönlich
- Maximal 6 Fragen generieren
- Fragen nummeriert als Liste ausgeben
- Antwort ausschließlich auf Deutsch
`;

    const userPrompt = `
Gewohnheit: ${gewohnheit}
Motivation: ${motivation}
Herausforderungen: ${herausforderungen}
Bereits versucht: ${bisheriges}
`.trim();

    const apiKey = process.env.MISTRAL_API_KEY;
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'mistral-tiny',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 350,
        temperature: 0.65,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Mistral API-Fehler:', errText);
      return res.status(502).json({ error: 'Fehler bei der Mistral-API.' });
    }

    const data = await response.json();
    const outputText = data.choices?.[0]?.message?.content?.trim() || 
                      'Leider konnte ich keine Antwort generieren.';

    req.session.requestCount++;
    const remaining = 5 - req.session.requestCount;
    
    res.json({ fragen: outputText, remaining });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler.' });
  }
});

app.post('/api/situational-decider', async (req, res) => {
  try {
    if (!req.session.requestCount) req.session.requestCount = 0;

    if (!req.session.user && req.session.requestCount >= 5) {
      return res.status(429).json({ 
        error: 'Anfragelimit erreicht',
        cooldown: 5 * 60 * 60
      });
    }

    const { entscheidung, optionen, kriterien, unsicherheiten } = req.body;
    if (!entscheidung || !optionen || !kriterien || !unsicherheiten) {
      return res.status(400).json({ error: 'Alle Felder sind erforderlich.' });
    }

    const systemPrompt = `Du bist "Situational Decider" - ein Coach für strukturierte Entscheidungsfindung. 
Generiere ausschließlich klärende FRAGEN zu folgenden Aspekten:
1. Klärung des Entscheidungsziels
2. Bewertung der Optionen
3. Priorisierung der Kriterien
4. Umgang mit Unsicherheiten
5. Langfristige vs. kurzfristige Auswirkungen
6. Emotionale und rationale Abwägung

Halte dich an diese Regeln:
- Stelle nur Fragen, keine Ratschläge oder Lösungen
- Formuliere präzise und erkenntnisfördernd
- Maximal 6 Fragen generieren
- Fragen nummeriert als Liste ausgeben
- Antwort ausschließlich auf Deutsch
`;

    const userPrompt = `
Entscheidung: ${entscheidung}
Optionen: ${optionen}
Kriterien: ${kriterien}
Unsicherheiten: ${unsicherheiten}
`.trim();

    const apiKey = process.env.MISTRAL_API_KEY;
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'mistral-tiny',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 350,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Mistral API-Fehler:', errText);
      return res.status(502).json({ error: 'Fehler bei der Mistral-API.' });
    }

    const data = await response.json();
    const outputText = data.choices?.[0]?.message?.content?.trim() || 
                      'Leider konnte ich keine Antwort generieren.';

    req.session.requestCount++;
    const remaining = 5 - req.session.requestCount;
    
    res.json({ fragen: outputText, remaining });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler.' });
  }
});

app.get('/api/cookies/accept', (req, res) => {
  res.cookie('cookieConsent', 'accepted', { 
    maxAge: 365 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'none',
    secure: true
  });
  res.json({ status: 'success' });
});

app.get('/api/cookies/decline', (req, res) => {
  res.cookie('cookieConsent', 'declined', { 
    maxAge: 365 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'none',
    secure: true
  });
  res.json({ status: 'success' });
});

app.post('/api/kontakt', (req, res) => {
  const { name, email, betreff, nachricht } = req.body;
  
  if (!name || !email || !betreff || !nachricht) {
    return res.status(400).json({ error: 'Alle Felder sind erforderlich' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: `${name} <${email}>`,
    to: process.env.EMAIL_USER || 'atmospheric.oasis@gmail.com',
    subject: `Kontaktanfrage: ${betreff}`,
    text: `Neue Nachricht von ${name} (${email}):\n\n${nachricht}`
  };

  transporter.sendMail(mailOptions, (error) => {
    if (error) {
      console.error('E-Mail Fehler:', error);
      return res.status(500).json({ error: 'Nachricht konnte nicht gesendet werden' });
    }
    res.json({ success: true });
  });
});

app.post('/api/check-spin-limit', (req, res) => {
  if (req.user || req.session.user) return res.json({ unlimited: true });

  if (!req.session.spinCount) req.session.spinCount = 0;

  if (req.session.spinCount >= 5) {
    return res.status(429).json({ 
      error: 'Entscheidungslimit erreicht',
      cooldown: 24 * 60 * 60
    });
  }

  req.session.spinCount++;
  res.json({ remaining: 5 - req.session.spinCount });
});

const BEWERTUNGEN_FILE = path.join(__dirname, 'bewertungen.json');

function getAggregatedReviews() {
  try {
    const data = fs.readFileSync(BEWERTUNGEN_FILE, 'utf8');
    const bewertungen = JSON.parse(data);
    
    bewertungen.reviewCount = bewertungen.reviews.length;
    
    const totalRating = bewertungen.reviews.reduce((sum, review) => sum + review.rating, 0);
    bewertungen.ratingValue = Math.round((totalRating / bewertungen.reviewCount) * 10) / 10;
    
    return bewertungen;
  } catch (error) {
    console.error('Fehler beim Lesen der Bewertungen:', error);
    return {
      ratingValue: 0,
      reviewCount: 0,
      reviews: []
    };
  }
}

app.get('/api/bewertungen', (req, res) => {
  try {
    const bewertungen = getAggregatedReviews();
    res.json(bewertungen);
  } catch (error) {
    console.error('Fehler beim Lesen der Bewertungen:', error);
    res.status(500).json({ error: 'Bewertungen konnten nicht geladen werden' });
  }
});

app.post('/api/bewertungen', (req, res) => {
  try {
    const newReview = req.body;
    
    if (!newReview.author || !newReview.rating || !newReview.comment) {
      return res.status(400).json({ error: 'Ungültige Bewertungsdaten' });
    }
    
    newReview.date = newReview.date || new Date().toISOString().split('T')[0];
    
    const bewertungen = getAggregatedReviews();
    
    bewertungen.reviews.push(newReview);
    
    fs.writeFileSync(BEWERTUNGEN_FILE, JSON.stringify(bewertungen, null, 2), 'utf8');
    
    res.json({ 
      success: true, 
      review: newReview,
      aggregated: {
        ratingValue: bewertungen.ratingValue,
        reviewCount: bewertungen.reviewCount
      }
    });
  } catch (error) {
    console.error('Fehler beim Speichern der Bewertung:', error);
    res.status(500).json({ error: 'Bewertung konnte nicht gespeichert werden' });
  }
});

app.get('/api/structured-data', (req, res) => {
  try {
    const bewertungen = getAggregatedReviews();
    
    const latestReviews = [...bewertungen.reviews]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3);
    
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Coding Project Helper",
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": bewertungen.ratingValue,
        "reviewCount": bewertungen.reviewCount,
        "bestRating": 5
      },
      "review": latestReviews.map(review => ({
        "@type": "Review",
        "author": review.author,
        "datePublished": review.date,
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": review.rating
        },
        "reviewBody": review.comment
      }))
    };
    
    res.json(structuredData);
  } catch (error) {
    console.error('Fehler beim Generieren der strukturierten Daten:', error);
    res.status(500).json({ error: 'Strukturierte Daten konnten nicht generiert werden' });
  }
});

app.use((req, res) => {
  if (req.originalUrl.startsWith('/api/')) {
    res.status(404).json({ error: 'API-Route nicht gefunden' });
  } else {
    res.status(404).sendFile(path.join(__dirname, 'public', 'html', '404.html'));
  }
});

app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
