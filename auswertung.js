const SUPABASE_URL = "https://eadleysrezkhxxbhqbdx.supabase.co";
const SUPABASE_KEY = "sb_publishable_Y0g8anBpKs3bsC85iado6w_rYske-SZ";
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let mitgliederMap = {};

window.addEventListener('load', async function() {
    await ladeMitgliederNamen();
    await ladeMeineFange();
});

// Lädt die Mitgliedernamen aus der Datenbank für die saubere Namensanzeige
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

async function ladeMeineFange() {
    const container = document.getElementById('faenge-liste');
    if (!container) return;

    const angemeldeteEmail = (sessionStorage.getItem('userEmail') || '').toLowerCase();

    if (!angemeldeteEmail) {
        container.innerHTML = `<div style="text-align: center; padding: 30px; color: #666;">Bitte melde dich erst an, um deine Fänge zu sehen.</div>`;
        return;
    }

    try {
        // NUR die eigenen Fänge des angemeldeten Anglers aus der Datenbank abrufen
        const { data, error } = await _supabase
            .from('fangbuch-asv-langschede')
            .select('*')
            .ilike('angler_email', angemeldeteEmail)
            .order('datum', { ascending: false })
            .order('uhrzeit', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = `<div style="text-align: center; padding: 30px; color: #666;">Du hast noch keine eigenen Fänge eingetragen.</div>`;
            return;
        }

        const anglerName = mitgliederMap[angemeldeteEmail] || angemeldeteEmail;

        let html = "";
        data.forEach(fang => {
            // Formatiere Datum (YYYY-MM-DD -> DD.MM.YYYY)
            let datumFormatiert = fang.datum || '';
            if (fang.datum) {
                const teile = fang.datum.split('-');
                if (teile.length === 3) {
                    datumFormatiert = `${teile[2]}.${teile[1]}.${teile[0]}`;
                }
            }

            html += `
                <div class="fang-karte" style="background: white; border: 1px solid #ddd; border-radius: 10px; padding: 15px; margin-bottom: 12px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <h3 style="color: #2e5a44; margin: 0; font-size: 18px;">🐟 ${fang.fischart} (${fang.laenge} cm)</h3>
                        <span style="font-size: 13px; color: #777; font-weight: bold;">${datumFormatiert}</span>
                    </div>

                    <div style="font-size: 14px; color: #444; line-height: 1.5;">
                        <p><strong>👤 Angler:</strong> ${anglerName}</p>
                        ${fang.gewicht ? `<p><strong>⚖️ Gewicht:</strong> ${fang.gewicht} g</p>` : ''}
                        ${fang.uhrzeit ? `<p><strong>⏰ Uhrzeit:</strong> ${fang.uhrzeit.substring(0,5)} Uhr</p>` : ''}
                        ${fang.fangort ? `<p><strong>📍 Fangort:</strong> ${fang.fangort}</p>` : ''}
                        ${fang.verbleib ? `<p><strong>🎣 Verbleib:</strong> ${fang.verbleib}</p>` : ''}
                        ${fang.wetter ? `<p><strong>🌤️ Wetter:</strong> ${fang.wetter} ${fang.luftdruck ? '(' + fang.luftdruck + ' hPa)' : ''}</p>` : ''}
                        ${fang.notiz ? `<p style="margin-top: 6px; padding: 6px; background: #f4f7f5; border-left: 3px solid #4a7c59; border-radius: 4px;"><strong>💬 Notiz:</strong> ${fang.notiz}</p>` : ''}
                        ${fang.foto_url ? `<div style="margin-top: 10px;"><img src="${fang.foto_url}" alt="Fangfoto" style="max-width: 100%; max-height: 200px; border-radius: 8px; border: 1px solid #ccc;"></div>` : ''}
                    </div>

                    <div style="margin-top: 12px; text-align: right;">
                        <button onclick="location.href='fang-eintragen.html?editId=${fang.id}'" style="background-color: #2e5a44; color: white; border: none; padding: 8px 14px; border-radius: 6px; font-weight: bold; cursor: pointer;">✏️ Fang bearbeiten / löschen</button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

    } catch (e) {
        console.error("Fehler beim Laden deiner Fänge:", e);
        container.innerHTML = `<div style="color: red; text-align: center; padding: 20px;">Fehler beim Laden: ${e.message}</div>`;
    }
}