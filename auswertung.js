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
    const statistikBox = document.getElementById('statistik-container');
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
            container.innerHTML = `<div style="text-align: center; padding: 20px; color: #666;">Du hast noch keine Einträge vorgenommen.</div>`;
            if (statistikBox) statistikBox.style.display = 'none';
            return;
        }

        // Statistiken berechnen
        let gesamtAngeltage = data.length;
        let schneiderTage = data.filter(f => f.ist_schneider === true).length;
        let erfolgreicheFänge = gesamtAngeltage - schneiderTage;

        // Zähler-Boxen oben befüllen und anzeigen
        if (statistikBox) {
            document.getElementById('stat-gesamt').innerText = gesamtAngeltage;
            document.getElementById('stat-erfolgreich').innerText = erfolgreicheFänge;
            document.getElementById('stat-schneider').innerText = schneiderTage;
            statistikBox.style.display = 'flex';
        }

        let html = `
            <table class="fang-tabelle">
                <thead>
                    <tr>
                        <th>Eintrag / Fischart</th>
                        <th>Länge</th>
                        <th>Datum</th>
                        ${isEditMode ? '<th>Aktion</th>' : ''}
                    </tr>
                </thead>
                <tbody>
        `;

        data.forEach(fang => {
            const id = fang.id;
            const istSchneider = fang.ist_schneider === true;
            
            const fischartHtml = istSchneider 
                ? `<span style="color: #7f8c8d; font-style: italic;">🚫 Schneider-Tag</span>` 
                : `<span style="font-weight: bold; color: #2e7d32;">${fang.fischart || '-'}</span>`;

            const laenge = istSchneider ? '-' : (fang.laenge ? `${fang.laenge} cm` : '-');
            
            let datumFormatiert = fang.datum || '-';
            if (fang.datum) {
                const t = fang.datum.split('-');
                if (t.length === 3) datumFormatiert = `${t[2]}.${t[1]}.${t[0]}`;
            }

            const gewicht = istSchneider ? '-' : (fang.gewicht ? `${fang.gewicht} g` : '-');
            const verbleib = istSchneider ? '-' : (fang.verbleib || '-');
            const fangort = fang.fangort || '-';
            const gewaesser = fang.gewaesser || 'Ruhr';
            const genaueStelle = fang.genaue_stelle || '-';
            const notiz = fang.notiz || '-';

            html += `
                <tr onclick="toggleDetails('details-${id}')" style="cursor: pointer;">
                    <td>${fischartHtml}</td>
                    <td style="font-weight: bold;">${laenge}</td>
                    <td style="white-space: nowrap;">${datumFormatiert}</td>
                    ${isEditMode ? `<td><button onclick="event.stopPropagation(); location.href='fang-eintragen.html?editId=${id}'" style="background:#d68c45; color:white; border:none; padding:4px 8px; border-radius:4px; font-weight:bold; cursor:pointer;">✏️ Edit</button></td>` : ''}
                </tr>
                <tr id="details-${id}" class="details-row" style="display: none; background-color: #f4fdf4;">
                    <td colspan="${isEditMode ? 4 : 3}" style="padding: 10px; font-size: 13px; color: #444;">
                        ${istSchneider ? '<p style="color: #7f8c8d; font-weight: bold; margin-bottom: 5px;">An diesem Tag leider kein Fisch am Band.</p>' : `
                            <p>⚖️ <b>Gewicht:</b> ${gewicht}</p>
                            <p>🐟 <b>Verbleib:</b> ${verbleib}</p>
                        `}
                        <p>📍 <b>Fangort / Abschnitt:</b> ${fangort} (${gewaesser})</p>
                        <p>📌 <b>Genaue Stelle:</b> ${genaueStelle}</p>
                        <p>📝 <b>Notiz / Köder:</b> ${notiz}</p>
                    </td>
                </tr>
            `;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;

    } catch (err) {
        console.error("Fehler beim Laden:", err);
        container.innerHTML = `<div style="text-align: center; padding: 20px; color: red;">Fehler beim Laden deiner Einträge: ${err.message}</div>`;
    }
}

function toggleDetails(rowId) {
    const row = document.getElementById(rowId);
    if (row) {
        row.style.display = (row.style.display === 'none' || row.style.display === '') ? 'table-row' : 'none';
    }
}