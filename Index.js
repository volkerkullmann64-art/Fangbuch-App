// Supabase initialisieren
const SUPABASE_URL = "https://eadleysrezkhxxbhqbdx.supabase.co";
const SUPABASE_KEY = "sb_publishable_Y0g8anBpKs3bsC85iado6w_rYske-SZ";
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Hilfsfunktion: Generiert eine zufällige Kennung (z.B. ASV-4829)
function generiereKennung() {
    const zufallsZahl = Math.floor(1000 + Math.random() * 9000); // 4-stellige Zahl
    return `ASV-${zufallsZahl}`;
}

// Zeige die Auswahl-Buttons
function showDashboard() {
    document.getElementById('app').innerHTML = `
        <h2>Willkommen</h2>
        <button class="btn" onclick="location.href='fang-eintragen.html'">🐟 Fang eintragen</button>
        <button class="btn" onclick="location.href='auswertung.html'">📊 Auswertung</button>
        <button class="btn" onclick="location.href='galerie.html'">📸 Galerie</button>
        <button class="btn" onclick="location.href='partner.html'">🤝 Partner</button>
        <button class="btn" style="background-color: #757575; margin-top: 25px;" onclick="beendeProgramm()">❌ Programm beenden</button>
    `;
}

// Zeige das Login-Formular (Schritt 1: Nur E-Mail)
function showLogin() {
    document.getElementById('app').innerHTML = `
        <h2>ASV Fangbuch</h2>
        <input type="email" id="email" placeholder="Deine E-Mail Adresse">
        <button class="btn" onclick="pruefeEmailUndWeiter()">Weiter</button>
    `;
}

// SCHRITT 1: Prüfen, ob die E-Mail existiert
async function pruefeEmailUndWeiter() {
    const emailInput = document.getElementById('email').value.trim().toLowerCase();
    
    if(emailInput !== "") {
        if (!navigator.onLine) {
            alert("Für den ersten Login wird eine Internetverbindung benötigt.");
            return;
        }

        // Suchen in der Supabase-Tabelle "mitglieder"
        const { data, error } = await _supabase
            .from('mitglieder')
            .select('email, kennung')
            .eq('email', emailInput)
            .maybeSingle(); // Verhindert Fehler, wenn kein Eintrag gefunden wird

        if (error) {
            alert("Fehler bei der Datenbankabfrage: " + error.message);
            return;
        }

        if (data) {
            // FALL A: E-Mail existiert bereits -> Direkt einloggen
            if (data.kennung === "0000") {
                alert("Dieses Konto wurde zurückgesetzt. Bitte wende dich an den Admin.");
                return;
            }

            localStorage.setItem('userKennung', String(data.kennung));
            localStorage.setItem('userEmailCache', String(emailInput));
            sessionStorage.setItem('userEmail', emailInput);
            sessionStorage.setItem('angemeldet', 'ja');
            showDashboard();
        } else {
            // FALL B: E-Mail existiert NICHT -> Felder für Registrierung einblenden
            zeigeRegistrierung(emailInput);
        }
    } else {
        alert("Bitte E-Mail eingeben");
    }
}

// SCHRITT 2: Neue Eingabemaske für Vorname und Name anzeigen
function zeigeRegistrierung(email) {
    document.getElementById('app').innerHTML = `
        <h2>Neu registrieren</h2>
        <p style="color: #666; font-size: 14px; margin-bottom: 20px;">
            Deine E-Mail <b>${email}</b> ist noch nicht registriert. Bitte trage deine Daten ein:
        </p>
        <input type="text" id="vorname" placeholder="Vorname">
        <input type="text" id="nachname" placeholder="Nachname / Name">
        <button class="btn" onclick="performRegistrierung('${email}')">Registrieren & Anmelden</button>
        <button class="btn" style="background-color: #757575; margin-top: 10px;" onclick="showLogin()">Abbrechen</button>
    `;
}

// SCHRITT 3: Neuen User in Supabase speichern
async function performRegistrierung(email) {
    const vornameInput = document.getElementById('vorname').value.trim();
    const nachnameInput = document.getElementById('nachname').value.trim();

    if (vornameInput === "" || nachnameInput === "") {
        alert("Bitte Vorname und Nachname ausfüllen.");
        return;
    }

    // Kurze Sicherheitsabfrage
    const bestaetigung = confirm(`Sind diese Daten korrekt?\n\nVorname: ${vornameInput}\nName: ${nachnameInput}\nE-Mail: ${email}`);
    if (!bestaetigung) return;

    // Generiere neue Kennung
    const neueKennung = generiereKennung();

    // In Supabase eintragen (Spalten klein: vorname, name, email, kennung)
    const { error } = await _supabase
        .from('mitglieder')
        .insert([
            { 
                vorname: vornameInput, 
                name: nachnameInput, 
                email: email, 
                kennung: neueKennung 
            }
        ]);

    if (error) {
        alert("Registrierung fehlgeschlagen: " + error.message);
    } else {
        // Erfolgreich eingetragen -> Lokal sichern und ab ins Dashboard
        localStorage.setItem('userKennung', neueKennung);
        localStorage.setItem('userEmailCache', email);
        sessionStorage.setItem('userEmail', email);
        sessionStorage.setItem('angemeldet', 'ja');
        
        alert(`Willkommen beim ASV Langschede!\nDeine persönliche Kennung lautet: ${neueKennung}`);
        showDashboard();
    }
}

// Funktion zum Beenden des Programms
function beendeProgramm() {
    sessionStorage.clear();
    window.close();
    document.getElementById('app').innerHTML = `
        <h2>Auf Wiedersehen!</h2>
        <p style="color: #666; margin-top: 20px;">Das Programm wurde sicher beendet.</p>
        <p style="color: #999; font-size: 14px;">Du kannst diesen Browser-Tab jetzt schließen.</p>
    `;
}

// Beim Starten der Seite prüfen
window.onload = async function() {
    const gespeicherteKennung = localStorage.getItem('userKennung');
    const gecachteEmail = localStorage.getItem('userEmailCache');

    trySyncOfflineFange();
    window.addEventListener('online', trySyncOfflineFange);

    if (!navigator.onLine) {
        if (gecachteEmail || gespeicherteKennung) {
            console.log("Offline-Modus aktiv. Verwende gecachte Sitzung.");
            sessionStorage.setItem('userEmail', gecachteEmail || "offline@user.de");
            sessionStorage.setItem('angemeldet', 'ja');
            showDashboard();
            return;
        } else {
            showLogin();
            return;
        }
    }

    if (gespeicherteKennung) {
        try {
            const { data, error } = await _supabase
                .from('mitglieder')
                .select('email, kennung')
                .eq('kennung', gespeicherteKennung)
                .maybeSingle();

            if (error || !data || data.kennung === "0000") {
                localStorage.clear();
                sessionStorage.clear();
                showLogin();
            } else {
                localStorage.setItem('userEmailCache', data.email);
                localStorage.setItem('userKennung', data.kennung);
                sessionStorage.setItem('userEmail', data.email);
                sessionStorage.setItem('angemeldet', 'ja');
                showDashboard();
            }
        } catch (e) {
            if (gecachteEmail) {
                sessionStorage.setItem('userEmail', gecachteEmail);
                sessionStorage.setItem('angemeldet', 'ja');
                showDashboard();
            } else {
                showLogin();
            }
        }
    } else {
        showLogin();
    }
};

// Offline-Synchronisation
async function trySyncOfflineFange() {
    const syncStatusBadge = document.getElementById('sync-status');
    let q = [];
    try { q = JSON.parse(localStorage.getItem('offlineFange')) || []; } catch(e){}

    if (!q || q.length === 0) {
        if(syncStatusBadge) syncStatusBadge.style.display = 'none';
        return;
    }

    if(syncStatusBadge) {
        syncStatusBadge.style.display = 'block';
        syncStatusBadge.textContent = `${q.length} Fang/Fänge im Funkloch gespeichert. Automatische Synchronisation läuft, sobald Internet da ist...`;
    }

    if (navigator.onLine) {
        if(syncStatusBadge) syncStatusBadge.textContent = `🔄 Synchronisiere ${q.length} Fänge mit der Datenbank...`;
        
        let erfolgreicheIndizes = [];
        for (let i = 0; i < q.length; i++) {
            try {
                const { error } = await _supabase.from('fangbuch-asv-langschede').insert([q[i]]);
                if (!error) erfolgreicheIndizes.push(i);
            } catch(e) {
                console.error("Netzwerkfehler beim automatischen Sync:", e);
            }
        }

        q = q.filter((item, index) => !erfolgreicheIndizes.includes(index));
        localStorage.setItem('offlineFange', JSON.stringify(q));

        if (q.length === 0) {
            if(syncStatusBadge) syncStatusBadge.style.display = 'none';
            alert("🎉 Deine Offline-Fänge wurden erfolgreich im Hintergrund hochgeladen!");
        } else {
            if(syncStatusBadge) syncStatusBadge.textContent = `⚠️ ${q.length} Fänge warten auf stabilere Verbindung.`;
        }
    }
}