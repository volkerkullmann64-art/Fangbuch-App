const SUPABASE_URL = "https://eadleysrezkhxxbhqbdx.supabase.co";
const SUPABASE_KEY = "sb_publishable_Y0g8anBpKs3bsC85iado6w_rYske-SZ";
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let aktuellerTab = 'privat'; // Start-Ansicht
let alleFaehngeAusDatenbank = [];

window.onload = async function() {
    await ladeGalerieDaten();
};

async function ladeGalerieDaten() {
    const grid = document.getElementById('galerie-grid');
    grid.innerHTML = "<div class='no-data'>Bilder werden geladen...</div>";

    if (!navigator.onLine) {
        grid.innerHTML = "<div class='no-data'>⚠️ Galerie erfordert eine Internetverbindung.</div>";
        return;
    }

    // Holt alle Fänge aus der Datenbank, die ein Foto hinterlegt haben
    const { data, error } = await _supabase
        .from('fangbuch-asv-langschede')
        .select('*')
        .not('foto_url', 'is', null)
        .order('laenge', { ascending: false }); // Direkt absteigend nach Länge sortiert

    if (error) {
        grid.innerHTML = "<div class='no-data'>Fehler beim Laden der Galerie.</div>";
        return;
    }

    alleFaehngeAusDatenbank = data;
    rendereGalerie();
}

function rendereGalerie() {
    const grid = document.getElementById('galerie-grid');
    grid.innerHTML = "";
    
    const schnelleEmail = sessionStorage.getItem('userEmail') || 'test@angler.de';
    let anzuzeigendeFische = [];

    if (aktuellerTab === 'privat') {
        // --- 1. ANSICHT: MEINE REKORDE ---
        // Filtere zuerst nach den Fängen des eingeloggten Anglers
        const meineFische = alleFaehngeAusDatenbank.filter(f => f.angler_email === schnelleEmail);
        
        // Da die Liste bereits nach Länge sortiert ist, behalten wir pro Fischart nur den ersten (größten) Eintrag
        const besetzteArten = {};
        meineFische.forEach(fang => {
            if (!besetzteArten[fang.fischart]) {
                anzuzeigendeFische.push(fang);
                besetzteArten[fang.fischart] = true;
            }
        });
    } else {
        // --- 2. ANSICHT: VEREINS-HITPARADE ---
        // Zeige den absolut größten Fisch jeder Art vereinsweit an
        const besetzteArtenVerein = {};
        alleFaehngeAusDatenbank.forEach(fang => {
            if (!besetzteArtenVerein[fang.fischart]) {
                anzuzeigendeFische.push(fang);
                besetzteArtenVerein[fang.fischart] = true;
            }
        });
    }

    if (anzuzeigendeFische.length === 0) {
        grid.innerHTML = `<div class='no-data'>Noch keine Rekord-Fotos in dieser Kategorie vorhanden.</div>`;
        return;
    }

    // HTML-Karten generieren
    anzuzeigendeFische.forEach(fang => {
        const card = document.createElement('div');
        card.className = 'card';
        
        // Formatierung des Datums
        let fahrbaresDatum = "Unbekannt";
        if(fang.datum) {
            const d = new Date(fang.datum);
            fahrbaresDatum = d.toLocaleDateString('de-DE');
        }

        // Falls Anonymität gewünscht ist oder Spalten fehlen, fangen wir das hier ab
        const fängerInfo = aktuellerTab === 'verein' ? `<br><small style="color:var(--accent-color)">🎣 Fänger: ${fang.angler_email.split('@')[0]}</small>` : '';

        card.innerHTML = `
            <img src="${fang.foto_url}" alt="${fang.fischart}">
            <div class="card-content">
                <div>
                    <div class="card-title">${fang.fischart}</div>
                    <div class="card-meta">
                        <strong>Länge:</strong> ${fang.laenge} cm<br>
                        <strong>Gewicht:</strong> ${fang.gewicht ? fang.gewicht + ' g' : 'Nicht gewogen'}
                        ${fängerInfo}
                    </div>
                </div>
                <div class="card-date">${fahrbaresDatum}</div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function switchTab(tabName) {
    aktuellerTab = tabName;
    
    // Tab-Buttons optisch umschalten
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    if(tabName === 'privat') {
        buttons[0].classList.add('active');
    } else {
        buttons[1].classList.add('active');
    }
    
    rendereGalerie();
}