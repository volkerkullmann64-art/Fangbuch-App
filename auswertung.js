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

// Fallback-Hilfsfunktion für ältere Einträge ohne gespeichertes Feld
function ermittleAnglerTageszeit(datumStr, uhrzeitStr) {
    if (!datumStr || !uhrzeitStr) return "";
    const teileDatum = datumStr.split('-');
    if (teileDatum.length !== 3) return "";
    const jahr = parseInt(teileDatum[0], 10);
    const monat = parseInt(teileDatum[1], 10);
    const tag = parseInt(teileDatum[2], 10);

    const datumObj = new Date(jahr, monat - 1, tag);
    const startDesJahres = new Date(jahr, 0, 1);
    const pastDays = Math.floor((datumObj - startDesJahres) / (24 * 60 * 60 * 1000));

    const zeitSumme = Math.round(412 + 100 * Math.sin((pastDays - 80) * 2 * Math.PI / 365));
    const untergangSumme = Math.round(1147 - 100 * Math.sin((pastDays - 80) * 2 * Math.PI / 365));

    const aufgangMin = Math.floor(zeitSumme / 60) * 60 + (zeitSumme % 60);
    const untergangMin = Math.floor(untergangSumme / 60) * 60 + (untergangSumme % 60);

    const zeitTeile = uhrzeitStr.split(':');
    if (zeitTeile.length < 2) return "";
    const fangMinuten = parseInt(zeitTeile[0], 10) * 60 + parseInt(zeitTeile[1], 10);

    if (fangMinuten >= aufgangMin - 60 && fangMinuten <= aufgangMin + 45) return "Morgendämmerung 🌅";
    if (fangMinuten >= untergangMin - 45 && fangMinuten <= untergangMin + 60) return "Abenddämmerung 🌇";
    if (fangMinuten > aufgangMin + 45 && fangMinuten < untergangMin - 45) return "Tag ☀️";
    return "Nacht 🌙";
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

        const datenMap = {};
        data.forEach(fang => {
            const datum = fang.datum || 'unbekannt';
            if (!datenMap[datum]) {
                datenMap[datum] = { hatFisch: false, hatSchneider: false };
            }
            if (fang.ist_schneider === true) datenMap[datum].hatSchneider = true;
            else datenMap[datum].hatFisch = true;
        });

        let alleDaten = Object.keys(datenMap);
        let gesamtAngeltage = alleDaten.length;
        let erfolgreicheAngeltage = 0;
        let schneiderTage = 0;

        alleDaten.forEach(datum => {
            const info = datenMap[datum];
            if (info.hatFisch) erfolgreicheAngeltage++;
            else if (info.hatSchneider) schneiderTage++;
        });

        if (statistikBox) {
            document.getElementById('stat-gesamt').innerText = gesamtAngeltage;
            document.getElementById('stat-erfolgreich').innerText = erfolgreicheAngeltage;
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

            const uhrzeitRoh = fang.uhrzeit ? fang.uhrzeit.substring(0, 5) : '';
            
            // PRIMÄR aus der DB auslesen, Fallback auf Berechnung falls DB-Feld leer ist
            const tageszeitInfo = fang.tageszeit || ermittleAnglerTageszeit(fang.datum, uhrzeitRoh);
            
            const uhrzeitAnzeige = uhrzeitRoh ? `${uhrzeitRoh} Uhr` : '-';
            const tageszeitText = tageszeitInfo ? ` <span style="color: #d68c45; font-weight: bold;">(${tageszeitInfo})</span>` : '';

            const gewicht = istSchneider ? '-' : (fang.gewicht ? `${fang.gewicht} g` : '-');
            const verbleib = istSchneider ? '-' : (fang.verbleib || '-');
            const fangort = fang.fangort || '-';
            const gewaesser = fang.gewaesser || 'Ruhr';
            const genaueStelle = fang.genaue_stelle || '-';
            const wetter = fang.wetter || '-';
            const luftdruck = fang.luftdruck ? `${fang.luftdruck} hPa` : '-';
            const truebung = fang.truebung || '-';
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
                        ${istSchneider ? '<p style="color: #7f8c8d; font-weight: bold; margin-bottom: 5px;">🚫 An diesem Tag leider kein Fisch am Band.</p>' : `
                            <p>⚖️ <b>Gewicht:</b> ${gewicht}</p>
                            <p>🐟 <b>Verbleib:</b> ${verbleib}</p>
                        `}
                        <p>⏰ <b>Uhrzeit:</b> ${uhrzeitAnzeige}${tageszeitText}</p>
                        <p>📍 <b>Fangort / Abschnitt:</b> ${fangort} (${gewaesser})</p>
                        <p>📌 <b>Genaue Stelle:</b> ${genaueStelle}</p>
                        <p>🌤️ <b>Wetter:</b> ${wetter} | 📊 <b>Luftdruck:</b> ${luftdruck}</p>
                        <p>💧 <b>Wassertrübung:</b> ${truebung}</p>
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