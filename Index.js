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
                <h2>ASV Fangbuch</h2>
                <input type="email" id="email" placeholder="Deine E-Mail Adresse">


                <button class="btn" onclick="performLogin()">Anmelden</button>
            `;
        }






        // Login Logik
      async function performLogin() {
    const emailInput = document.getElementById('email').value.trim().toLowerCase();
    if(emailInput !== "") {
        
        if (!navigator.onLine) {
            alert("Für den ersten Login wird eine Internetverbindung benötigt.");
            return;
        }

        const { data, error } = await _supabase
            .from('mitglieder')
            .select('email, kennung')
            .eq('email', emailInput)
            .single();

        if (error || !data) {
            alert("Zugriff verweigert: E-Mail nicht registriert.");
        } else {
            if (data.kennung === "0000") {
                alert("Dieses Konto wurde zurückgesetzt. Bitte wende dich an den Admin.");
                return;
            }

            if (data.kennung) {
                // HIER SICHERN WIR ES JETZT BOMBENFEST DAUERHAFT:
                localStorage.setItem('userKennung', String(data.kennung));
                localStorage.setItem('userEmailCache', String(emailInput));
                
                sessionStorage.setItem('userEmail', emailInput);
                sessionStorage.setItem('angemeldet', 'ja');
                showDashboard();
            } else {
                alert("Fehler: Keine Kennung hinterlegt.");
            }
        }
    } else {
        alert("Bitte E-Mail eingeben");
    }
}





        // Funktion zum Beenden des Programms
        function beendeProgramm() {
            sessionStorage.clear(); // Löscht die temporäre Anmeldung für die Unterseiten
            
            // Erst versuchen wir das Fenster zu schließen
            window.close();
            
            // Falls der Browser das Schließen blockiert, zeigen wir eine saubere Verabschiedung
            document.getElementById('app').innerHTML = `
                <h2>Auf Wiedersehen!</h2>
                <p style="color: #666; margin-top: 20px;">Das Programm wurde sicher beendet.</p>
                <p style="color: #999; font-size: 14px;">Du kannst diesen Browser-Tab jetzt schließen.</p>
            `;
        }






        // Beim Starten della Seite prüfen
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

    // NEU: Wenn die Warteschlange leer ist, brich sofort ab und frage Supabase gar nicht erst!
    if (!q || q.length === 0) {
        if(syncStatusBadge) syncStatusBadge.style.display = 'none';
        return;
    }

    if(syncStatusBadge) {
        syncStatusBadge.style.display = 'block';
        syncStatusBadge.textContent = `⚠️ ${q.length} Fang/Fänge warten auf Internetverbindung...`;
    }

    if (navigator.onLine) {
        if(syncStatusBadge) syncStatusBadge.textContent = `🔄 Synchronisiere ${q.length} Fänge mit Supabase...`;
        
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
            if(syncStatusBadge) syncStatusBadge.textContent = `⚠️ ${q.length} Fänge konnten nicht synchronisiert werden.`;
        }
    }
}