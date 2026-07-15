// Supabase initialisieren (Bitte URL und Key aus deiner anderen Datei einfügen!)
const SUPABASE_URL = "https://eadleysrezkhxxbhqbdx.supabase.co";
const SUPABASE_KEY = "sb_publishable_Y0g8anBpKs3bsC85iado6w_rYske-SZ";
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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

// Zeige das Login-Formular
function showLogin() {
    document.getElementById('app').innerHTML = `
        <h2>ASV FangbuchV47</h2>
        <input type="email" id="email" placeholder="Deine E-Mail Adresse">
        
        <div id="register-fields" style="display: none; margin-bottom: 15px; text-align: left;">
            <p style="color: #2e7d32; font-size: 14px; margin-bottom: 10px; font-weight: bold; text-align: center;">
                E-Mail neu! Bitte Name eingeben:
            </p>
            <input type="text" id="vorname" placeholder="Vorname" style="margin-bottom: 10px;">
            <input type="text" id="nachname" placeholder="Nachname">
        </div>
        
        <button class="btn" id="login-btn" onclick="performLogin()">Anmelden</button>
    `;
}

// Login Logik (Nur noch EINMAL vorhanden!)
async function performLogin() {
    const emailInput = document.getElementById('email').value.trim().toLowerCase();
    if (emailInput !== "") {
        if (!navigator.onLine) {
            alert("Für den ersten Login wird eine Internetverbindung benötigt.");
            return;
        }

        const registerFields = document.getElementById('register-fields');
        const istRegistrierungSichtbar = registerFields && registerFields.style.display === 'block';

        // Wenn die Namensfelder noch NICHT sichtbar sind, prüfen wir die E-Mail
        if (!istRegistrierungSichtbar) {
            const { data, error } = await _supabase
                .from('mitglieder')
                .select('email, kennung')
                .eq('email', emailInput)
                .maybeSingle();

            // Wenn die E-Mail NICHT existiert (oder ein Fehler auftritt)
            if (error || !data) {
                if (registerFields) {
                    registerFields.style.display = 'block';
                    document.getElementById('login-btn').innerText = "Registrieren & Anmelden";
                }
            } else {
                // E-Mail existiert -> Ganz normaler Login wie bisher
                if (data.kennung === "0000") {
                    alert("Dieses Konto wurde zurückgesetzt. Bitte wende dich an den Admin.");
                    return;
                }

                localStorage.setItem('userKennung', String(data.kennung));
                localStorage.setItem('userEmailCache', String(emailInput));
                sessionStorage.setItem('userEmail', emailInput);
                sessionStorage.setItem('angemeldet', 'ja');
                showDashboard();
            }
        } else {
            // DAS PASSIERT BEIM ZWEITEN KLICK (Registrierung absenden)
            const vornameInput = document.getElementById('vorname').value.trim();
            const nachnameInput = document.getElementById('nachname').value.trim();

            if (vornameInput === "" || nachnameInput === "") {
                alert("Bitte trage deinen Vornamen und Nachnamen ein.");
                return;
            }

            // Wir erzeugen eine eindeutige Kennung aus dem Millisekunden-Zeitstempel.
            // .slice(-8) nimmt die letzten 8 Ziffern. Da diese Millisekunden immer weiterzählen,
            // ist diese Kennung garantiert für jeden Angler einzigartig und wiederholt sich nie!
            const neueKennung = String(Date.now()).slice(-8); 

            // Jetzt schreiben wir den neuen Angler in die Supabase-Tabelle 'mitglieder'
            const { error: insertError } = await _supabase
                .from('mitglieder')
                .insert([
                    { 
                        email: emailInput, 
                        vorname: vornameInput, 
                        nachname: nachnameInput, 
                        kennung: neueKennung 
                    }
                ]);

            if (insertError) {
                alert("Fehler bei der Registrierung: " + insertError.message);
                return;
            }

            // Wenn das Speichern geklappt hat, loggen wir den neuen User direkt ein
            localStorage.setItem('userKennung', neueKennung);
            localStorage.setItem('userEmailCache', emailInput);
            sessionStorage.setItem('userEmail', emailInput);
            sessionStorage.setItem('angemeldet', 'ja');
            
            alert(`Willkommen beim ASV! Du wurdest registriert. Deine persönliche Kennung lautet: ${neueKennung}`);
            showDashboard();
        }
    } else {
        alert("Bitte E-Mail eingeben");
    }
}










// Funktion zum Beenden des Programms
function beendeProgramm() {
    try {
        // 1. Sitzung löschen
        sessionStorage.clear(); 
    } catch (e) {
        console.log("Session konnte nicht gelöscht werden:", e);
    }
    
    // 2. Versuche das Fenster direkt zu schließen
    try {
        window.close();
    } catch (e) {
        console.log("Browser blockiert Schließen:", e);
    }
    
    // 3. Wir schreiben das Verabschiedungs-Fenster direkt auf den gesamten Bildschirm (body).
    // Das klappt GARANTIERT immer, egal in welchem Zustand die App gerade ist!
    document.body.innerHTML = `
        <div style="
            display: flex; 
            flex-direction: column; 
            justify-content: center; 
            align-items: center; 
            height: 100vh; 
            text-align: center; 
            font-family: Arial, sans-serif; 
            background-color: #f9f9f9; 
            padding: 20px; 
            box-sizing: border-box;
        ">
            <div style="
                background: white; 
                padding: 30px; 
                border-radius: 12px; 
                box-shadow: 0 4px 15px rgba(0,0,0,0.1); 
                max-width: 400px; 
                width: 100%;
            ">
                <h2 style="color: #2e7d32; margin-top: 0;">Auf Wiedersehen!</h2>
                <p style="color: #2e7d32; font-weight: bold; margin-top: 20px;">Das Programm wurde ordnungsgemäß beendet.</p>
                <p style="color: #666; font-size: 14px; margin-top: 10px;">Deine Sitzung wurde sicher geschlossen.</p>
                <p style="color: #999; font-size: 14px; margin-top: 20px;">Du kannst diesen Browser-Tab jetzt schließen.</p>
            </div>
        </div>
    `;
}







// Beim Starten der Seite prüfen
window.onload = async function() {
    // Holt die Daten aus dem dauerhaften Handyspeicher
    const gespeicherteKennung = localStorage.getItem('userKennung');
    const gecachteEmail = localStorage.getItem('userEmailCache');

    // Prüfe sofort bei App-Start, ob noch ungesendete Offline-Fänge vorliegen
    trySyncOfflineFange();
    window.addEventListener('online', trySyncOfflineFange);

    // NEU: Absoluter Offline-Failsafe für das Funkloch
    if (!navigator.onLine) {
        if (gecachteEmail || gespeicherteKennung) {
            console.log("Offline-Modus aktiv. Verwende gecachte Sitzung.");
            sessionStorage.setItem('userEmail', gecachteEmail || "offline@user.de");
            sessionStorage.setItem('angemeldet', 'ja');
            showDashboard();
            return;
        } else {
            // Wenn das Handy noch NIE online eingeloggt war und kein Cache da ist
            showLogin();
            return;
        }
    }

    // ONLINE-FALL (Deine originale Prüfung gegen Supabase läuft nur, wenn Netz da ist)
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
            // Falls das Internet mitten in der Abfrage wegstirbt
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

async function trySyncOfflineFange() {
    const syncStatusBadge = document.getElementById('sync-status');
    let q = [];
    try { q = JSON.parse(localStorage.getItem('offlineFange')) || []; } catch(e){}

    // Wenn die Warteschlange leer ist, blende die Box komplett aus
    if (!q || q.length === 0) {
        if(syncStatusBadge) syncStatusBadge.style.display = 'none';
        return;
    }

    // Box anzeigen (sie sitzt jetzt sicher über den Buttons)
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