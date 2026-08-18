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
        btn.textContent = editMode ? 'Fertig' : 'Bearbeiten';
        btn.style.backgroundColor = editMode ? '#c0392b' : '#2e5a44';
    }
    ladeMeineFange();
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
        // Zwingend NUR die eigenen Fänge des angemeldeten Anglers abrufen
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
            <table class="fang-tabelle">
                <thead>
                    <tr>
                        ${editMode ? '<th style="width: 35px;"></th>' : ''}
                        <th>Datum</th>
                        <th>Fischart</th>
                        <th>cm</th>
                        <th>g</th>
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

            const clickAction = editMode ? `onclick="location.href='fang-eintragen.html?editId=${fang.id}'"` : '';
            const rowStyle = editMode ? 'cursor: pointer; background-color: #fff9e6;' : '';

            html += `
                <tr style="${rowStyle}" ${clickAction}>
                    ${editMode ? `<td style="text-align: center; font-size: 16px;">✏️</td>` : ''}
                    <td>${datumFormatiert}</td>
                    <td><strong>${fang.fischart}</strong></td>
                    <td>${fang.laenge || '-'}</td>
                    <td>${fang.gewicht || '-'}</td>
                    <td>${fang.fangort || '-'}</td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
            <div style="margin-top: 15px; font-size: 13px; color: #666; text-align: center;">
                Angler: <strong>${anglerName}</strong> (${data.length} ${data.length === 1 ? 'Fang' : 'Fänge'})
            </div>
        `;

        container.innerHTML = html;

    } catch (e) {
        console.error("Fehler beim Laden deiner Fänge:", e);
        container.innerHTML = `<div style="color: red; text-align: center; padding: 20px;">Fehler: ${e.message}</div>`;
    }
}