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

    // Rufe die Prüfung auf, die jetzt sicher weiter unten liegt
    pruefePflichtfelder(); 
});

// Die Funktion steht jetzt sauber außerhalb und ist für das ganze Programm sichtbar!
function pruefePflichtfelder() {
    const datum = document.getElementById('datum').value;
    const uhrzeit = document.getElementById('uhrzeit').value;
    const fischart = document.getElementById('fischart').value;
    const laenge = document.getElementById('laenge').value.trim();
    
    const btn = document.getElementById('speichern-btn');
    
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




function validateFisch



async function saveFang() {
    const speicherBtn = document.getElementById('speichern-btn');
    
    // UNSICHTBARER RIEGEL: Schützt vor Mehrfachklicks, verändert aber weder Text noch Farbe!
    speicherBtn.disabled = true;
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
        // Falls ein Fehler auftritt, machen wir den Button einfach wieder klickbar
        speicherBtn.disabled = false;
        speicherBtn.style.cursor = 'pointer';
    }
}
function pruefeRuhrStandort() {
    return new Promise((resolve) => {
        // 1. Prüfen, ob das Gerät überhaupt GPS-Ortung unterstützt
        if (!navigator.geolocation) {
            console.log("GPS wird von diesem Gerät nicht unterstützt.");
            resolve(false); 
            return;
        }

        // 2. Die echten GPS-Koordinaten vom Smartphone abfragen
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const spielerLat = position.coords.latitude;
                const spielerLon = position.coords.longitude;

                // Eure 11 Stecknadeln: Lückenlose Kette vom Ostholzbach bis 200m vor der Schoofsbrücke
                const ruhrPunkte = [
                    { name: "1: Anfang Ostholzbach (Mündung)", lat: 51.4782, lon: 7.7785 },
                    { name: "2: Ruhrwiesen oberhalb Kanu-Club", lat: 51.4768, lon: 7.7740 },
                    { name: "3: Kanu-Club / Sportplatz", lat: 51.4755, lon: 7.7695 },
                    { name: "4: Kurve vor dem Wehr", lat: 51.4748, lon: 7.7670 },
                    { name: "5: Wehr Langschede", lat: 51.4744, lon: 7.7652 },
                    { name: "6: Ruhrbrücke B63 (Mendener Str.)", lat: 51.4735, lon: 7.7595 },
                    { name: "7: Ruhrwiesen unterhalb Brücke", lat: 51.4725, lon: 7.7540 },
                    { name: "8: Erste große Flusskurve West", lat: 51.4712, lon: 7.7490 },
                    { name: "9: Mitten in den Ruhrwiesen", lat: 51.4705, lon: 7.7470 },
                    { name: "10: Gerade Strecke vor Ende", lat: 51.4692, lon: 7.7410 },
                    { name: "11: Streckenende vor Schoofsbrücke", lat: 51.4682, lon: 7.7375 }
                ];

                const R = 6371e3; // Erdradius in Metern für die Berechnung
                let anDerRuhr = false;

                // 3. Die App läuft jetzt alle 11 Punkte nacheinander durch
                for (let punkt of ruhrPunkte) {
                    const phi1 = spielerLat * Math.PI / 180;
                    const phi2 = punkt.lat * Math.PI / 180;
                    const deltaPhi = (punkt.lat - spielerLat) * Math.PI / 180;
                    const deltaLambda = (punkt.lon - spielerLon) * Math.PI / 180;

                    // Haversine-Formel zur Berechnung der exakten Luftlinie auf der Erdkugel
                    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
                              Math.cos(phi1) * Math.cos(phi2) *
                              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    const entfernung = R * c; // Ergebnis in Metern

                    console.log(`Entfernung zu ${punkt.name}: ${Math.round(entfernung)} Meter.`);

                    // 4. Wenn du zu IRGENDEINEM der 11 Punkte weniger als 100 Meter Abstand hast
                    if (entfernung <= 100) {
                        anDerRuhr = true;
                        console.log(`✅ Standort erfolgreich bestätigt bei: ${punkt.name}`);
                        break; // Treffer! Wir können die Schleife sofort abbrechen
                    }
                }

                // Gibt true (Ja) oder false (Nein) zurück
                resolve(anDerRuhr);
            },
            (error) => {
                console.error("GPS-Fehler beim Abrufen der Position:", error);
                resolve(false); // Falls der Angler die Ortung ablehnt, wird "false" zurückgegeben
            },
            { 
                enableHighAccuracy: true, // Erzwingt die Nutzung von echtem GPS (nicht nur ungenaues WLAN)
                timeout: 7000             // Wartet maximal 7 Sekunden auf das Signal
            }
        );
    });
}
async function holeMindestLaengeFuerHitparade(fischart) {
    try {
        const { data, error } = await _supabase
            .from('fangbuch-asv-langschede')
            .select('laenge')
            .eq('fischart', fischart)
            .order('laenge', { ascending: false }) // Die größten zuerst
            .range(0, 2); // Hole maximal die Plätze 1, 2 und 3

        if (error) throw error;

        // Wenn es im Verein noch weniger als 3 Fische dieser Art gibt,
        // kommt JEDER Fisch automatisch in die Hitparade! (Mindestlänge = 0)
        if (!data || data.length < 3) {
            return 0; 
        }

        // Der dritte Fisch in der Liste bestimmt die magische Grenze
        const platz3 = data[data.length - 1];
        return platz3.laenge ? parseFloat(platz3.laenge) : 0;

    } catch (e) {
        console.error("Fehler beim Laden der Hitparaden-Grenze:", e);
        return 0; // Im Zweifel erlauben wir den Hinweis
    }
}