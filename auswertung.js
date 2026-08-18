const SUPABASE_URL = "https://eadleysrezkhxxbhqbdx.supabase.co";
const SUPABASE_KEY = "sb_publishable_Y0g8anBpKs3bsC85iado6w_rYske-SZ";
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let editMode = false;
let mitgliederMap = {};

window.addEventListener('load', async function() {
    await ladeMitgliederNamen();
    await ladeMeineFange();
});

// Lädt die Mitgliedernamen aus der Datenbank
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

function toggleEditMode() {
    editMode = !editMode;
    const btn = document.getElementById('edit-toggle-btn');
    if (btn) {
        btn.textContent = editMode ? 'Fertig' : '✏️ Bearbeiten';
        btn.style.backgroundColor = editMode ? '#c0392b' : '#2e7d32';
    }
    ladeMeineFange();
}

// Schaltet die Detailansicht einer Zeile an/aus
function toggleDetails(fangId) {
    if (editMode) return; // Im Bearbeiten-Modus keine Details aufklappen
    const detailsRow = document.getElementById(`details-${fangId}`);
    if (detailsRow) {
        const isVisible = detailsRow.style.display === 'table-row';
        detailsRow.style.display = isVisible ? 'none' : 'table-row';
    }
}

async function ladeMeineFange() {
    const container = document.getElementById('faenge-tabelle-container');
    if (!container) return;

    const angemeldeteEmail = (sessionStorage.getItem('userEmail') || '').toLowerCase();

    if (!angemeldeteEmail) {
        container.innerHTML = `<div style="text-align: center; padding: 20px; color: #666;">Bitte melde dich an, um deine Fänge zu sehen.</div>`;
        return;
    }

    try {
        const { data, error } = await _supabase
            .from('fangbuch-asv-langschede')
            .select('*')
            .ilike('angler_email', angemeldeteEmail)
            .order('datum', { ascending: false })
            .order('uhrzeit', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = `<div style="text-align: center; padding: 20px; color: #666;">Keine Fänge eingetragen.</div>`;
            return;
        }

        const anglerName = mitgliederMap[angemeldeteEmail] || 'Volker Kullmann';

        let html = `
            <div style="margin-bottom: 6px; font-size: 14px; color: #2e7d32; text-align: center; font-weight: bold; background: #e8f5e9; padding: 8px; border-radius: 6px; border: 1px solid #c8e6c9;">
                Angler: ${anglerName} (${data.length} ${data.length === 1 ? 'Fang' : 'Fänge'})
            </div>
            <div style="margin-bottom: 12px; font-size: 12px; color: #666; text-align: center; font-style: italic;">
                💡 Tipp: Auf einen Fang tippen, um Details aufzuklappen.
            </div>

            <table class="fang-tabelle">
                <thead>
                    <tr>
                        ${editMode ? '<th style="width: 35px;"></th>' : ''}
                        <th>Datum</th>
                        <th>Fischart</th>
                        <th>cm</th>
                        <th>gr</th>
                        <th>Ort</th>
                    </tr>
                </thead>
                <tbody>
        `;

        data.forEach(fang => {
            let datumFormatiert = fang.datum || '';
            if (fang.datum) {
                const teile = fang.datum.split('-');
                if (teile.length === 3) {
                    datumFormatiert = `${teile[2]}.${teile[1]}.`;
                }
            }

            // Luftdruck & Tendenzpfeil aufbereiten
            let luftdruckText = '';
            const rawTrend = String(fang.luftdruck_trend || fang.luftdrucktrend || fang.trend || '');
            
            let pfeil = '';
            if (rawTrend.includes('fall') || rawTrend.includes('⬇') || rawTrend.includes('runter')) pfeil = ' ⬇️';
            else if (rawTrend.includes('steig') || rawTrend.includes('⬆') || rawTrend.includes('hoch')) pfeil = ' ⬆️';
            else if (rawTrend.includes('gleich') || rawTrend.includes('➡️') || rawTrend.includes('stabil')) pfeil = ' ➡️';

            if (fang.luftdruck) {
                luftdruckText = `(${fang.luftdruck} hPa${pfeil})`;
            } else if (pfeil) {
                luftdruckText = `(${pfeil.trim()})`;
            }

            const clickAction = editMode 
                ? `onclick="location.href='fang-eintragen.html?editId=${fang.id}'"` 
                : `onclick="toggleDetails('${fang.id}')"`;

            const rowStyle = editMode ? 'cursor: pointer; background-color: #fff9e6;' : 'cursor: pointer;';
            const colSpan = editMode ? 6 : 5;

            html += `
                <tr style="${rowStyle}" ${clickAction}>
                    ${editMode ? `<td style="text-align: center; font-size: 16px;">✏️</td>` : ''}
                    <td>${datumFormatiert}</td>
                    <td><strong>${fang.fischart}</strong></td>
                    <td>${fang.laenge || '-'}</td>
                    <td>${fang.gewicht || '-'}</td>
                    <td>${fang.fangort || '-'}</td>
                </tr>
                <tr id="details-${fang.id}" class="details-row" style="display: none; background-color: #f9fbf9;">
                    <td colspan="${colSpan}" style="padding: 12px; border-bottom: 2px solid #2e7d32;">
                        <div style="font-size: 13px; color: #444; line-height: 1.6;">
                            <p><strong>🕒 Uhrzeit:</strong> ${fang.uhrzeit ? fang.uhrzeit.substring(0,5) + ' Uhr' : 'keine Angabe'}</p>
                            <p><strong>🎣 Verbleib:</strong> ${fang.verbleib || 'keine Angabe'}</p>
                            <p><strong>🌤️ Wetter:</strong> ${fang.wetter || 'keine Angabe'} ${luftdruckText}</p>
                            ${fang.notiz ? `<p style="margin-top: 6px; padding: 6px; background: #e8f5e9; border-left: 3px solid #2e7d32; border-radius: 4px;"><strong>💬 Notiz:</strong> ${fang.notiz}</p>` : ''}
                            ${fang.foto_url ? `<div style="margin-top: 8px;"><img src="${fang.foto_url}" alt="Fangfoto" style="max-width: 100%; max-height: 180px; border-radius: 6px; border: 1px solid #ccc;"></div>` : ''}
                        </div>
                    </td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;

        container.innerHTML = html;

    } catch (e) {
        console.error("Fehler beim Laden deiner Fänge:", e);
        container.innerHTML = `<div style="color: red; text-align: center; padding: 20px;">Fehler: ${e.message}</div>`;
    }
}