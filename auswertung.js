  const SUPABASE_URL = "https://eadleysrezkhxxbhqbdx.supabase.co";
    const SUPABASE_KEY = "sb_publishable_Y0g8anBpKs3bsC85iado6w_rYske-SZ";
    const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    let editModeActive = false;

    window.onload = function() {
        let anglerEmail = sessionStorage.getItem('userEmail') || 'test@angler.de';
        document.getElementById('angler-name').innerText = anglerEmail;
        ladeFaengeFuerAngler(anglerEmail);
    };

    // Blendet die Stifte einfach nur ein oder aus
    function toggleEditMode() {
        editModeActive = !editModeActive;
        const editElements = document.querySelectorAll('.edit-col');
        
        if (editModeActive) {
            editElements.forEach(el => el.style.display = 'table-cell');
        } else {
            editElements.forEach(el => el.style.display = 'none');
        }
    }

    async function ladeFaengeFuerAngler(email) {
        try {
            const { data, error } = await _supabase.from('fangbuch-asv-langschede').select('*').eq('angler_email', email).order('datum', { ascending: false });
            if (error) throw error;
            const tbody = document.getElementById('fang-tabelle-body');
            if (!data || data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="13" style="text-align: center; padding: 20px;">Keine Fänge unter dieser E-Mail gefunden.</td></tr>`; return;
            }
            tbody.innerHTML = ''; 
            data.forEach(fang => {
                tbody.innerHTML += `
                    <tr>
                        <td class="edit-col" style="${editModeActive ? 'display: table-cell;' : ''}" onclick="location.href='fang-eintragen.html?editId=${fang.id}'">✏️</td>
                        <td>${fang.datum || '-'}</td>
                        <td>${fang.uhrzeit ? fang.uhrzeit.substring(0,5) : '-'}</td>                       
                        <td style="font-weight: bold; color: #2e6f40;">${fang.fischart || '-'}</td>
                        <td>${fang.laenge ? fang.laenge + ' cm' : '-'}</td>
                        <td>${fang.gewicht ? fang.gewicht + ' g' : '-'}</td>
                        <td>${fang.fangort || '-'}</td>
                        <td>${fang.verbleib || '-'}</td>
                        <td>${fang.wetter || '-'}</td>
                        <td>${fang.luftdruck ? fang.luftdruck + ' hPa' : '-'}</td>
                        <td>${fang.truebung || '-'}</td>
                        <td>${fang.notiz || '-'}</td>
                    </tr>`;
            });
        } catch (f) { document.getElementById('fang-tabelle-body').innerHTML = `<tr><td colspan="13" style="color: red; padding: 20px;">Fehler: ${f.message}</td></tr>`; }
    }