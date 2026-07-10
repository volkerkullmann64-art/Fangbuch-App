const SUPABASE_URL = "https://eadleysrezkhxxbhqbdx.supabase.co";
const SUPABASE_KEY = "sb_publishable_Y0g8anBpKs3bsC85iado6w_rYske-SZ";
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let editFangId = null;

window.addEventListener('load', function() {
    const urlParams = new URLSearchParams(window.location.search);
    editFangId = urlParams.get('editId');

    
    initFormDefaults();

    if (editFangId) {
        document.getElementById('form-titel').innerText = "Fang bearbeiten";
        document.getElementById('speichern-btn').innerText = "Änderungen speichern";
        document.getElementById('loeschen-btn').style.display = 'block';
        ladeFangDatenFuerEdit(editFangId);
    } else {
        triggerAutomaticWeatherFetch();
    }

    try {
        if(typeof trySyncOfflineFange === 'function') trySyncOfflineFange();
    } catch(e) { console.error("Init-Fehler abgefangen:", e); }

   try {
        if(typeof trySyncOfflineFange === 'function') trySyncOfflineFange();
    } catch(e) { console.error("Init-Fehler abgefangen:", e); }

    // HIER EINFÜGEN: Prüfe sofort beim Start, damit der Button direkt grau wird
   function pruefePflichtfelder() {
    const datum = document.getElementById('datum').value;
    const uhrzeit = document.getElementById('uhrzeit').value;
    const fischart = document.getElementById('fischart').value;
    const laenge = document.getElementById('laenge').value.trim();
    
    const btn = document.getElementById('speichern-btn');
    
    // NEU: Wenn der Riegel gerade aktiv ist, das Überprüfen einfach überspringen!
    if (btn.innerText.includes("Wird gespeichert...")) return;
    
    if (datum && uhrzeit && fischart && laenge) {
        btn.disabled = false;
        btn.style.backgroundColor = '#2e5a44'; 
        btn.style.cursor = "pointer";
    } else {
        btn.disabled = true;
        btn.style.backgroundColor = '#cccccc'; 
        btn.style.cursor = "not-allowed";
    }
}
});

async function loescheAktuellenFang() {
    const { error } = await _supabase.from('fangbuch-asv-langschede').delete().eq('id', editFangId);
    if (!error) {
        // Zack, das alert ist weg! Es leitet dich jetzt sofort und blitzschnell weiter.
        location.href = 'auswertung.html';
    } else {
        alert("Fehler beim Löschen: " + error.message);
    }
}

async function triggerAutomaticWeatherFetch() {
    try {
        const lat = 51.47;
        const lon = 7.76;
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=surface_pressure&timezone=Europe/Berlin`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data && data.current_weather) {
            // 1. Wetterzustand setzen
            const code = data.current_weather.weathercode;
            let wetterSelect = document.getElementById('wetter');
            if (wetterSelect) {
                if (code === 0) wetterSelect.value = "Sonnig";
                else if (code >= 1 && code <= 3) wetterSelect.value = "Bewölkt";
                else if (code >= 45 && code <= 48) wetterSelect.value = "Nebel";
                else if (code >= 51 && code <= 67) wetterSelect.value = "Regen";
            }
            
            // 2. Luftdruck setzen (Fehlersicher!)
            const currentHourIso = data.current_weather.time;
            let timeIndex = data.hourly.time.indexOf(currentHourIso);
            
            // Falls die exakte Stunde nicht gefunden wird, nimm den ersten verfügbaren Wert
            if (timeIndex === -1 && data.hourly.surface_pressure.length > 0) {
                timeIndex = 0; 
            }
            
            if (timeIndex !== -1 && data.hourly.surface_pressure[timeIndex]) {
                document.getElementById('luftdruck').value = Math.round(data.hourly.surface_pressure[timeIndex]);
            } else {
                // Falls kein Wert da ist, Ladehinweis löschen
                document.getElementById('luftdruck').value = "";
                document.getElementById('luftdruck').placeholder = "z.B. 1013";
            }
        } else {
            // Falls API-Antwort fehlerhaft, Feld freigeben
            document.getElementById('luftdruck').value = "";
            document.getElementById('luftdruck').placeholder = "z.B. 1013";
        }
    } catch (e) {
        console.error("Wetter konnte nicht automatisch geladen werden:", e);
        // Im Fehlerfall (Keller/Funkloch) sofort das Laden beenden!
        document.getElementById('luftdruck').value = "";
        document.getElementById('luftdruck').placeholder = "Manuell eintragen";
    }
}

async function ladeFangDatenFuerEdit(id) {
    const { data, error } = await _supabase
        .from('fangbuch-asv-langschede')
        .select('*')
        .eq('id', id)
        .single();
        
    if (data && !error) {
        document.getElementById('datum').value = data.datum || '';
        if (data.uhrzeit) document.getElementById('uhrzeit').value = data.uhrzeit.substring(0,5);
        document.getElementById('fischart').value = data.fischart || '';
        document.getElementById('laenge').value = data.laenge || '';
        document.getElementById('gewicht').value = data.gewicht || '';
        
        setTimeout(() => { 
            validateFisch(); 
            if(data.verbleib) document.getElementById('verbleib').value = data.verbleib; 
        }, 100);

        document.getElementById('wetter').value = data.wetter || 'Bewölkt';
        document.getElementById('luftdruck').value = data.luftdruck || '';
        document.getElementById('truebung').value = data.truebung || '';
        document.getElementById('fangort').value = data.fangort || '';
        document.getElementById('notiz').value = data.notiz || '';
    } else {
        alert("Fehler beim Laden des Fangs: " + (error ? error.message : 'Nicht gefunden'));
    }
}

const fischDatenbank = {
"Bachforelle": { mass: 25, k: 1.1, schonzeit: { vonM: 9, vonD: 20, bisM: 2, bisD: 15 }, bildData: "" },
"Äsche": { mass: 30, k: 1.0, schonzeit: { vonM: 2, vonD: 1, bisM: 3, bisD: 30 }, bildData: "" },
"Hecht": { mass: 45, k: 0.9, schonzeit: { vonM: 1, vonD: 15, bisM: 3, bisD: 30 }, bildData: "" },
"Zander": { mass: 50, k: 1.0, schonzeit: { vonM: 1, vonD: 1, bisM: 4, bisD: 31 }, bildData: "" },
"Flussbarsch": { mass: 0, k: 1.2, bildData: "" },
"Aal": { mass: 50, k: 0.2, bildData: "" },
"Wels": { mass: 0, k: 0.8, bildData: "" },
"Barbe": { mass: 35, k: 1.2, schonzeit: { vonM: 4, vonD: 15, bisM: 5, bisD: 15 }, bildData: "" },
"Karpfen": { mass: 35, k: 2.1, bildData: "" },
"Schleie": { mass: 25, k: 2.0, bildData: "" },
"Döbel": { mass: 0, k: 1.1, bildData: "" },
"Brassen": { mass: 0, k: 1.3, bildData: "" },
"Aland": { mass: 0, k: 1.1, bildData: "" },
"Rotauge": { mass: 0, k: 1.1, bildData: "" },
"Rotfeder": { mass: 0, k: 1.2, bildData: "" },
"Kaulbarsch": { mass: 0, k: 1.0, bildData: "" },
"Bachschmerle": { mass: 0, k: 0.9, bildData: "" },
"Gründling": { mass: 0, k: 1.0, bildData: "" },
"Elritze": { mass: 0, k: 0.9, bildData: "" },
"Schwarzmund-Grundel": { mass: 0, k: 1.1, invasiv: true, bildData: "" },
"Groppe": { mass: 0, k: 1.0, geschuetzt: true, bildData: "" },
"Bitterling": { mass: 0, k: 1.0, geschuetzt: true, bildData: "" },
"Moderlieschen": { mass: 0, k: 0.9, geschuetzt: true, bildData: "" },
"Nase": { mass: 35, k: 1.0, geschuetzt: true, bildData: "" }
};




function initFormDefaults() {
const today = new Date().toISOString().split('T')[0];
document.getElementById('datum').value = today;
const select = document.getElementById('uhrzeit');
select.innerHTML = "";
let currentMinutes = new Date().getMinutes();
let roundedMinutes = Math.round(currentMinutes / 15) * 15;
let currentHour = new Date().getHours();
if(roundedMinutes === 60) { roundedMinutes = 0; currentHour += 1; }
const defaultTimeStr = `${String(currentHour).padStart(2, '0')}:${String(roundedMinutes).padStart(2, '0')}`;
for (let h = 0; h < 24; h++) {
for (let m = 0; m < 60; m += 15) {
const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
const option = document.createElement('option');
option.value = timeStr;
option.textContent = timeStr + " Uhr";

if(timeStr === defaultTimeStr) option.selected = true;
        select.appendChild(option);
        }
    }
    // HIER ERGÄNZEN: Wenn der Angler die Uhrzeit ändert, soll geprüft werden
    select.onchange = pruefePflichtfelder;

    updateVerbleibOptions("masig");

}





function updateVerbleibOptions(modus) {
const verbleibSelect = document.getElementById('verbleib');
verbleibSelect.innerHTML = "";
const placeholder = new Option("Bitte wählen...", ""); placeholder.disabled = true; placeholder.selected = true; verbleibSelect.options.add(placeholder);
if (modus === "untermasig" || modus === "schonzeit") { verbleibSelect.options.add(new Option("Zurückgesetzt (" + (modus === "untermasig" ? "Untermaßig" : "Schonzeit / Schutz") + ")", "Zurückgesetzt")); verbleibSelect.options.add(new Option("Entnommen & Verwertet (Wegen Verletzung)", "Entnommen & Verwertet (Verletzt)")); }
else if (modus === "invasiv") { verbleibSelect.options.add(new Option("Entnommen / Verwertet (Invasive Art - Pflicht!)", "Entnommen (Invasive Art)")); }
else { verbleibSelect.options.add(new Option("Entnommen (Küche)", "Entnommen (Küche)")); verbleibSelect.options.add(new Option("Zurückgesetzt (Schonung / Kapital)", "Zurückgesetzt (Kapital)")); }
}

function validateFisch() {
const fischart = document.getElementById('fischart').value;
const laenge = parseFloat(document.getElementById('laenge').value);
const datumVal = document.getElementById('datum').value;
const statusHint = document.getElementById('status-hint');
const gewichtInput = document.getElementById('gewicht');
const erkennungsBox = document.getElementById('fisch-erkennung');

if (!fischart) { erkennungsBox.style.display = 'none'; return; }
const daten = fischDatenbank[fischart];
if (!daten) return;

let infoTexte = []; let istWarnung = false; let aktuellerModus = "masig";
if (daten.geschuetzt || fischart === "Nase") { infoTexte.push("⚠️ STRENG GESCHÜTZT!"); istWarnung = true; aktuellerModus = "schonzeit"; }
else if (daten.invasiv) { infoTexte.push("🚨 INVASIVE ART!"); istWarnung = true; aktuellerModus = "invasiv"; }
if (!isNaN(laenge) && laenge > 0) {
    if (daten.k) gewichtInput.placeholder = `ca. ${Math.round((daten.k * Math.pow(laenge, 3)) / 100)} g`;
    if (!daten.geschuetzt && fischart !== "Nase" && !daten.invasiv && daten.mass && laenge < daten.mass) { infoTexte.push("⚠️ Untermaßig!"); istWarnung = true; if(aktuellerModus !== "schonzeit") aktuellerModus = "untermasig"; }
}
updateVerbleibOptions(aktuellerModus);
if (infoTexte.length > 0) { statusHint.style.display = 'block'; statusHint.innerHTML = infoTexte.join("<br>"); statusHint.className = istWarnung ? "hint-box warning" : "hint-box ok"; } else { statusHint.style.display = 'none'; }
pruefePflichtfelder();
}

async function saveFang() {
    const speicherBtn = document.getElementById('speichern-btn');
    
    // SICHERHEITS-RIEGEL: Button sofort sperren und Text ändern
    speicherBtn.disabled = true;
    const originalText = speicherBtn.innerText;
    speicherBtn.innerText = "⏳ Wird gespeichert...";
    speicherBtn.style.backgroundColor = '#757575';
    speicherBtn.style.cursor = 'not-allowed';

    const schnelleEmail = sessionStorage.getItem('userEmail') || 'test@angler.de';
    const ldruckRaw = document.getElementById('luftdruck').value;
    const ldruckVal = ldruckRaw ? parseFloat(ldruckRaw) : null;
    
    const fangDaten = {
        fischart: document.getElementById('fischart').value,
        laenge: parseFloat(document.getElementById('laenge').value),
        gewicht: (function() {
            const gewichtInput = document.getElementById('gewicht');
            if (gewichtInput.value.trim() !== "") {
                return parseFloat(gewichtInput.value);
            }
            if (gewichtInput.placeholder && gewichtInput.placeholder.includes("ca.")) {
                const geschaetzterWert = gewichtInput.placeholder.replace(/[^\d]/g, ''); 
                return geschaetzterWert ? parseFloat(geschaetzterWert) : null;
            }
            return null;
        })(),
        datum: document.getElementById('datum').value,
        uhrzeit: document.getElementById('uhrzeit').value,
        verbleib: document.getElementById('verbleib').value,
        wetter: document.getElementById('wetter').value || null,
        luftdruck: ldruckVal,
        truebung: document.getElementById('truebung').value || null,
        fangort: document.getElementById('fangort').value || null,
        notiz: document.getElementById('notiz').value,
        angler_email: schnelleEmail
    };

    try {
        if (navigator.onLine) {
            if (editFangId) {
                const { error } = await _supabase.from('fangbuch-asv-langschede').update(fangDaten).eq('id', editFangId);
                if (!error) { 
                    location.href = 'auswertung.html'; 
                    return; 
                } else { 
                    throw new Error(error.message);
                }
            } else {
                const { error } = await _supabase.from('fangbuch-asv-langschede').insert([fangDaten]);
                if (!error) { 
                    document.getElementById('fang-form').reset(); 
                    location.href = 'index.html'; 
                    return; 
                } else { 
                    throw new Error(error.message);
                }
            }
        } else {
            let q = []; try { q = JSON.parse(localStorage.getItem('offlineFange')) || []; } catch(e){}
            q.push(fangDaten); localStorage.setItem('offlineFange', JSON.stringify(q));
            document.getElementById('fang-form').reset();
            location.href = 'index.html';
        }
    } catch (error) {
        alert("⚠️ Achtung: Konnte nicht gespeichert werden! " + error.message);
        // Nur im Fehlerfall den Button wieder freigeben:
        speicherBtn.disabled = false;
        speicherBtn.innerText = originalText;
        speicherBtn.style.backgroundColor = '#2e5a44';
        speicherBtn.style.cursor = 'pointer';
    }
}
