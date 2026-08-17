const SUPABASE_URL = "https://eadleysrezkhxxbhqbdx.supabase.co";
const SUPABASE_KEY = "sb_publishable_Y0g8anBpKs3bsC85iado6w_rYske-SZ";
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Liste der relevanten Hauptfischarten für die Hitparaden-Ansicht
const HITS_FISCHARTEN = [
    "Bachforelle", "Hecht", "Zander", "Flussbarsch", 
    "Karpfen", "Barbe", "Schleie", "Äsche", "Aal", "Wels"
];

let mitgliederMap = {}; // Speichert E-Mail -> Vorname Nachname
let fangCache = [];

window.addEventListener('load', async function() {
    await ladeMitgliederNamen();
    await ladeHitparade();
});

// Lädt die Mitgliedernamen aus Supabase für schöne Namensanzeige
async function ladeMitgliederNamen() {
    try {
        const { data, error } = await _supabase
            .from('mitglieder')
            .select('email, vorname, nachname');

        if (data && !error) {
            data.forEach(m => {
                if (m.email) {
                    const vollerName = `${m.vorname || ''} ${m.nachname || ''}`.trim();
                    mitgliederMap[m.email.toLowerCase()] = vollerName || m.email;
                }
            });
        }
    } catch (e) {
        console.error("Fehler beim Laden der Mitgliedernamen:", e);
    }
}

// Lädt alle Fänge mit Foto aus der Datenbank und baut das 3er-Raster
async function ladeHitparade() {
    const container = document.getElementById('galerie-content');
    
    try {
        const { data, error } = await _supabase
            .from('fangbuch-asv-langschede')
            .select('*')
            .not('foto_url', 'is', null)
            .neq('foto_url', '')
            .order('laenge', { ascending: false });

        if (error) throw error;

        fangCache = data || [];

        if (fangCache.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 30px; color: #666;">
                    📸 Noch keine Fotos in der Hitparade hinterlegt.<br>
                    Trage einen Spitzenfang ein und nimm als Erster den 1. Platz ein!
                </div>
            `;
            return;
        }

        // Gruppierung nach Fischart
        let fischartGruppen = {};
        
        // Erst die definierten Hauptfischarten vorbereiten
        HITS_FISCHARTEN.forEach(fa => fischartGruppen[fa] = []);

        // Fänge einsortieren
        fangCache.forEach(fang => {
            const fa = fang.fischart;
            if (!fischartGruppen[fa]) {
                fischartGruppen[fa] = [];
            }
            if (fischartGruppen[fa].length < 3) { // Nur Top 3 behalten
                fischartGruppen[fa].push(fang);
            }
        });

        let html = "";
        const medaillen = ["🥇", "🥈", "🥉"];

        // Rendern jeder Fischart
        Object.keys(fischartGruppen).forEach(fischart => {
            const faenge = fischartGruppen[fischart];

            // Nur Fischarten anzeigen, bei denen mindestens 1 Foto existiert
            if (faenge.length > 0) {
                html += `
                    <div class="fischart-sektion">
                        <div class="fischart-titel">
                            <span>🐟 ${fischart}</span>
                        </div>
                        <div class="podest-grid">
                `;

                // Genau 3 Plätze generieren (1, 2, 3)
                for (let i = 0; i < 3; i++) {
                    const fang = faenge[i];
                    if (fang) {
                        const anglerEmail = (fang.angler_email || '').toLowerCase();
                        const faengerName = mitgliederMap[anglerEmail] || fang.angler_email || 'Vereinsmitglied';
                        
                        html += `
                            <div class="podest-kachel" onclick="oeffneModalByFangId('${fang.id}')">
                                <span class="rang-badge">${medaillen[i]}</span>
                                <img class="kachel-bild" src="${fang.foto_url}" alt="${fischart}" loading="lazy">
                                <div class="kachel-titel">${fang.laenge} cm</div>
                                <div class="kachel-sub">${fang.gewicht ? fang.gewicht + ' g' : ''}</div>
                                <div class="kachel-faenger" title="${faengerName}">${faengerName}</div>
                            </div>
                        `;
                    } else {
                        // Unbesetzter Platzhalter
                        html += `
                            <div class="podest-kachel empty">
                                <span class="rang-badge" style="opacity:0.5;">${medaillen[i]}</span>
                                <div class="kachel-bild" style="display:flex; align-items:center; justify-content:center; font-size:24px; color:#bbb;">🎣</div>
                                <div class="kachel-sub" style="font-style:italic;">Frei</div>
                            </div>
                        `;
                    }
                }

                html += `
                        </div>
                    </div>
                `;
            }
        });

        container.innerHTML = html || `<div style="text-align:center; padding:20px;">Keine Fotos verfügbar.</div>`;

    } catch (e) {
        console.error("Fehler beim Laden der Hitparade:", e);
        container.innerHTML = `<div style="color:red; text-align:center; padding:20px;">Fehler beim Laden der Galerie: ${e.message}</div>`;
    }
}

// Öffnet die Großansicht für ein ausgewähltes Foto
function oeffneModalByFangId(id) {
    const fang = fangCache.find(f => f.id == id);
    if (!fang) return;

    const anglerEmail = (fang.angler_email || '').toLowerCase();
    const faengerName = mitgliederMap[anglerEmail] || fang.angler_email || 'Vereinsmitglied';

    document.getElementById('modal-img').src = fang.foto_url;
    document.getElementById('modal-title').innerText = `🏆 Vereins-Rekord: ${fang.fischart}`;
    document.getElementById('modal-faenger').innerText = `👤 Fänger: ${faengerName}`;
    document.getElementById('modal-laenge').innerText = `${fang.laenge} cm`;
    document.getElementById('modal-gewicht').innerText = fang.gewicht ? `${fang.gewicht} g` : 'Nicht gewogen';
    
    // Formatiere Datum
    if (fang.datum) {
        const d = new Date(fang.datum);
        document.getElementById('modal-datum').innerText = d.toLocaleDateString('de-DE');
    } else {
        document.getElementById('modal-datum').innerText = '-';
    }

    document.getElementById('modal-uhrzeit').innerText = fang.uhrzeit ? `${fang.uhrzeit.substring(0,5)} Uhr` : '-';
    document.getElementById('modal-ort').innerText = fang.fangort || 'Ruhr';
    
    let wetterText = fang.wetter || '';
    if (fang.luftdruck) wetterText += ` (${fang.luftdruck} hPa)`;
    document.getElementById('modal-wetter').innerText = wetterText || '-';

    const notizBox = document.getElementById('modal-notiz-box');
    if (fang.notiz && fang.notiz.trim() !== '') {
        document.getElementById('modal-notiz').innerText = fang.notiz;
        notizBox.style.display = 'block';
    } else {
        notizBox.style.display = 'none';
    }

    document.getElementById('foto-modal').style.display = 'flex';
}

function schliesseModal() {
    document.getElementById('foto-modal').style.display = 'none';
}