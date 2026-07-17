/ iOS-Aufweck-Schutz: Wenn das iPhone die App aus dem Hintergrund holt
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
        const istAngemeldet = sessionStorage.getItem('angemeldet');
        const aktuellerInhalt = document.body.innerHTML;

        if (istAngemeldet !== 'ja' || aktuellerInhalt.includes('Wiedersehen')) {
            window.location.reload();
        }
    }
});

// Supabase initialisieren
const SUPABASE_URL = "https://eadleysrezkhxxbhqbdx.supabase.co";
const SUPABASE_KEY = "sb_publishable_Y0g8anBpKs3bsC85iado6w_rYske-SZ";
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Zeige die Auswahl-Buttons (Jetzt mit sanftem Namens-Einbau!)
function showDashboard() {
    // NEU: Wir holen uns den Vornamen aus dem Speicher (Sitzung oder Dauerspeicher)
    const vorname = sessionStorage.getItem('userVorname') || localStorage.getItem('userVornameCache') || "";
    
    // NEU: Wenn ein Vorname da ist, begrüßen wir persönlich. Wenn nicht, wie bisher!
    const begruessung = vorname ? `Willkommen, ${vorname}!` : "Willkommen";

    document.getElementById('app').innerHTML = `
        <h2>${begruessung}</h2>
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
        <h2>ASV Fangbuch</h2>
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

// Login Logik
async function performLogin() {
    const emailInput = document.getElementById('email').value.trim().toLowerCase();
    if (emailInput !== "") {
        if (!navigator.onLine) {
            alert("Für den ersten Login wird eine Internetverbindung benötigt.");
            return;
        }

        const registerFields = document.getElementById('register-fields');
        const istRegistrierungSichtbar = registerFields && registerFields.style.display === 'block';

        if (!istRegistrierungSichtbar) {
            const { data, error } = await _supabase
                .from('mitglieder')
                .select('email, kennung, vorname') // NEU: vorname aus DB mit abfragen!
                .eq('email', emailInput)
                .maybeSingle();

            if (error || !data) {
                if (registerFields) {
                    registerFields.style.display = 'block';
                    document.getElementById('login-btn').innerText = "Registrieren & Anmelden";
                }
            } else {
                if (data.kennung === "0000") {
                    alert("Dieses Konto wurde zurückgesetzt. Bitte wende dich an den Admin.");
                    return;
                }

                localStorage.setItem('userKennung', String(data.kennung));
                localStorage.setItem('userEmailCache', String(emailInput));
                localStorage.setItem('userVornameCache', String(data.vorname || '')); // NEU: Name auf Handy sichern
                
                sessionStorage.setItem('userEmail', emailInput);
                sessionStorage.setItem('userVorname', String(data.vorname || '')); // NEU: Name für aktuelle Sitzung
                sessionStorage.setItem('angemeldet', 'ja');
                showDashboard();
            }
        } else {
            const vornameInput = document.getElementById('vorname').value.trim();
            const nachnameInput = document.getElementById('nachname').value.trim();

            if (vornameInput === "" || nachnameInput === "") {
                alert("Bitte trage deinen Vornamen und Nachnamen ein.");
                return;
            }

            const neueKennung = String(Date.now()).slice(-8); 

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

            localStorage.setItem('userKennung', neueKennung);
            localStorage.setItem('userEmailCache', emailInput);
            localStorage.setItem('userVornameCache', vornameInput); // NEU: Bei Registrierung direkt Name auf Handy sichern
            
            sessionStorage.setItem('userEmail', emailInput);
            sessionStorage.setItem('userVorname', vornameInput); // NEU: Für aktuelle Sitzung
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
        const appBox = document.getElementById('app');
        if (appBox) {
            appBox.innerHTML = `
                <h2>Auf Wiedersehen!</h2>
                <p style="color: #2e7d32; font-weight: bold; margin-top: 20px;">Das Programm wurde ordnungsgemaess beendet.</p>
                <p style="color: #666; font-size: 14px; margin-top: 10px;">Deine Sitzung wurde sicher geschlossen.</p>
                <p style="color: #999; font-size: 14px; margin-top: 20px;">Du kannst diesen Browser-Tab jetzt schliessen.</p>
            `;
        } else {
            document.body.innerHTML = `
                <div style="text-align: center; margin-top: 100px; font-family: sans-serif; color: #333;">
                    <h2>Auf Wiedersehen!</h2>
                    <p>Das Programm wurde ordnunggemaess beendet.</p>
                    <p>Du kannst diesen Tab jetzt schliessen.</p>
                </div>
            `;
        }
    } catch (e) {
        console.error("Fehler beim Zeichnen des Beenden-Fensters:", e);
    }

    try {
        sessionStorage.clear(); 
    } catch (e) {
        console.error("Session konnte nicht geloescht werden:", e);
    }
    
    try {
        window.close();
    } catch (e) {
        console.error("Browser blockiert Schliessen:", e);
    }
}

// Beim Starten der Seite prüfen (Mit absolutem 1,5-Sekunden-Offline-Failsafe!)
window.onload = async function() {
    const gespeicherteKennung = localStorage.getItem('userKennung');
    const gecachteEmail = localStorage.getItem('userEmailCache');
    const gecachterVorname = localStorage.getItem('userVornameCache'); // NEU: Name aus Handyspeicher laden

    trySyncOfflineFange();
    window.addEventListener('online', trySyncOfflineFange);

    // Hilfsfunktion für den schnellen Offline-Einstieg
    function geheInOfflineModus() {
        if (gecachteEmail || gespeicherteKennung) {
            console.log("Offline-Modus aktiv. Verwende gecachte Sitzung.");
            sessionStorage.setItem('userEmail', gecachteEmail || "offline@user.de");
            sessionStorage.setItem('userVorname', gecachterVorname || ""); // NEU: Name offline mit übergeben
            sessionStorage.setItem('angemeldet', 'ja');
            showDashboard();
        } else {
            showLogin();
        }
    }

    // 1. Sofortiger Stopp, wenn das Handy selbst sagt, es ist offline
    if (!navigator.onLine) {
        geheInOfflineModus();
        return;
    }

    // 2. ONLINE-PRÜFUNG mit eingebautem Wecker (Timeout von 1,5 Sekunden)
    if (gespeicherteKennung) {
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Supabase-Timeout")), 1500)
        );

        try {
            const dbPromise = _supabase
                .from('mitglieder')
                .select('email, kennung, vorname') // NEU: vorname aus DB mit abfragen!
                .eq('kennung', gespeicherteKennung)
                .maybeSingle();

            const { data, error } = await Promise.race([dbPromise, timeoutPromise]);

            if (error || !data || data.kennung === "0000") {
                localStorage.clear();
                sessionStorage.clear();
                showLogin();
            } else {
                localStorage.setItem('userEmailCache', data.email);
                localStorage.setItem('userKennung', data.kennung);
                localStorage.setItem('userVornameCache', data.vorname || ''); // NEU: Name auf Handy aktualisieren
                
                sessionStorage.setItem('userEmail', data.email);
                sessionStorage.setItem('userVorname', data.vorname || ''); // NEU: Name für aktuelle Sitzung
                sessionStorage.setItem('angemeldet', 'ja');
                showDashboard();
            }
        } catch (e) {
            console.log("Datenbank nicht erreichbar oder Timeout. Schalte auf Offline-Modus.");
            geheInOfflineModus();
        }
    } else {
        showLogin();
    }
};

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