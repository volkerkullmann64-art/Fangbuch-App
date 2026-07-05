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
                
                // Abgleich mit der Datenbank 'mitglieder'
                const { data, error } = await _supabase
                    .from('mitglieder')
                    .select('email, kennung')
                    .eq('email', emailInput)
                    .single();

                if (error || !data) {
                    alert("Zugriff verweigert: E-Mail nicht registriert.");
                } else {
                    // Falls die Kennung auf 0000 steht, blockieren
                    if (data.kennung === "0000") {
                        alert("Dieses Konto wurde zurückgesetzt. Bitte wende dich an den Admin.");
                        return;
                    }

                    // E-Mail gefunden, Kennung lokal und Session setzen
                    if (data.kennung) {
                        localStorage.setItem('userKennung', data.kennung);
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
            const gespeicherteKennung = localStorage.getItem('userKennung');

            if (gespeicherteKennung) {
                // Live-Prüfung gegen Supabase wegen der 0000-Steuerung
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
                    // Kennung ist gültig -> befeuere die Session für die anderen HTML-Seiten
                    sessionStorage.setItem('userEmail', data.email);
                    sessionStorage.setItem('angemeldet', 'ja');
                    showDashboard();
                }
            } else {
                showLogin();
            }
        };