const SUPABASE_URL = "https://eadleysrezkhxxbhqbdx.supabase.co";
const SUPABASE_KEY = "sb_publishable_Y0g8anBpKs3bsC85iado6w_rYske-SZ";
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let isEditMode = false;

window.addEventListener('load', function() {
    ladeMeineFaenge();
});

function toggleEditMode() {
    isEditMode = !isEditMode;
    const btn = document.getElementById('edit-toggle-btn');
    if (btn) {
        btn.innerText = isEditMode ? "✖ Fertig" : "✏️ Bearbeiten";
        btn.style.backgroundColor = isEditMode ? "#c0392b" : "#2e7d32";
    }
    ladeMeineFaenge();
}

async function ladeMeineFaenge() {
    const container = document.getElementById('faenge-tabelle-container');
    if (!container) return;

    const schnelleEmail = sessionStorage.getItem('userEmail') || 'test@angler.de';

    try {
        const { data, error } = await _supabase
            .from('fangbuch-asv-langschede')
            .select('*')
            .eq('angler_email', schnelleEmail)
            .order('datum', { ascending: false })
            .order('uhrzeit', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = `<div style="text-align: center; padding: 20px; color: #666;">Du hast noch keine Fänge eingetragen.</div>`;
            return;
        }

        let html = `
            <table class="fang-tabelle">
                <thead>
                    <tr>
                        <th>Fischart</th>
                        <th>Länge</th>
                        <th>Datum</th>
                        ${isEditMode ? '<th>Aktion</th>' : ''}
                    </tr>
                </thead>
                <tbody>
        `;

        data.forEach(fang => {
            const id = fang.id;
            const fischart = fang.fischart || '-';
            const laenge = fang.laenge ? `${fang.laenge} cm` : '-';
            
            let datumFormatiert = fang.datum || '-';
            if (fang.datum) {
                const t = fang.datum.split('-');
                if (t.length === 3) datumFormatiert = `${t[2]}.${t[1]}.${t[0]}`;
            }

            const gewicht = fang.gewicht ? `${fang.gewicht} g` : '-';
            const verbleib = fang.verbleib || '-';
            const fangort = fang.fangort || '-';
            const gewaesser = fang.gewaesser || 'Ruhr';
            const notiz = fang.notiz || '-';

            html += `
                <tr onclick="toggleDetails('details-${id}')" style="cursor: pointer;">
                    <td style="font-weight: bold; color: #2e7d32;">${fischart}</td>
                    <td style="font-weight: bold;">${laenge}</td>
                    <td style="white-space: nowrap;">${datumFormatiert}</td>
                    ${isEditMode ? `<td><button onclick="event.stopPropagation(); location.href='fang-eintragen.html?editId=${id}'" style="background:#d68c45; color:white; border:none; padding:4px 8px; border-radius:4px; font-weight:bold; cursor:pointer;">✏️ Edit</button></td>` : ''}
                </tr>
                <tr id="details-${id}" class="details-row" style="display: none; background-color: #f4fdf4;">
                    <td colspan="${isEditMode ? 4 : 3}" style="padding: 10px; font-size: 13px; color: #444;">
                        <p>⚖️ <b>Gewicht:</b> ${gewicht}</p>
                        <p>🐟 <b>Verbleib:</b> ${verbleib}</p>
                        <p>📍 <b>Stelle / Ort:</b> ${fangort} (${gewaesser})</p>
                        <p>📝 <b>Notiz / Köder:</b> ${notiz}</p>
                    </td>
                </tr>
            `;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;

    } catch (err) {
        console.error("Fehler beim Laden:", err);
        container.innerHTML = `<div style="text-align: center; padding: 20px; color: red;">Fehler beim Laden deiner Fänge: ${err.message}</div>`;
    }
}

function toggleDetails(rowId) {
    const row = document.getElementById(rowId);
    if (row) {
        row.style.display = (row.style.display === 'none' || row.style.display === '') ? 'table-row' : 'none';
    }
}