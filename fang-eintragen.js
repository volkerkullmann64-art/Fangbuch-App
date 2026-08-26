const SUPABASE_URL = "https://eadleysrezkhxxbhqbdx.supabase.co";
const SUPABASE_KEY = "sb_publishable_Y0g8anBpKs3bsC85iado6w_rYske-SZ";
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let editFangId = null;
let geknipstesFotoBlob = null; // Speichert das komprimierte Foto im Speicher

// Initial-Fallbacks für den allerersten App-Start ohne bisherige Netzverbindung
const offlineHitparadeMinimaFallback = {
    "Bachforelle": 40,
    "Äsche": 38,
    "Hecht": 60,
    "Zander": 40,
    "Flussbarsch": 30,
    "Aal": 70,
    "Wels": 60,
    "Barbe": 60,
    "Karpfen": 55,
    "Schleie": 30,
    "Döbel": 30,
    "Brassen": 25,
    "Aland": 20,
    "Rotauge": 20,
    "Rotfeder": 20
};

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

    // Wenn Online-Verbindung besteht, synchronisiere die Rekordwerte für den Offline-Einsatz
    if (navigator.onLine) {
        aktualisiereLokaleHitparadeCache();
    }

    pruefePflichtfelder(); 
});

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
            const code = data.current_weather.weathercode;
            let wetterSelect = document.getElementById('wetter');
            if (wetterSelect) {
                if (code === 0) wetterSelect.value = "Sonnig";
                else if (code >= 1 && code <= 3) wetterSelect.value = "Bewölkt";
                else if (code >= 45 && code <= 48) wetterSelect.value = "Nebel";
                else if (code >= 51 && code <= 67) wetterSelect.value = "Regen";
            }
            
            const currentHourIso = data.current_weather.time;
            let timeIndex = data.hourly.time.indexOf(currentHourIso);
            
            if (timeIndex === -1 && data.hourly.surface_pressure.length > 0) {
                timeIndex = 0; 
            }
            
            if (timeIndex !== -1 && data.hourly.surface_pressure[timeIndex]) {
                document.getElementById('luftdruck').value = Math.round(data.hourly.surface_pressure[timeIndex]);
            } else {
                document.getElementById('luftdruck').value = "";
                document.getElementById('luftdruck').placeholder = "z.B. 1013";
            }
        } else {
            document.getElementById('luftdruck').value = "";
            document.getElementById('luftdruck').placeholder = "z.B. 1013";
        }
    } catch (e) {
        console.error("Wetter konnte nicht automatisch geladen werden:", e);
        document.getElementById('luftdruck').value = "";
        document.getElementById('luftdruck').placeholder = "Manuell eintragen";
    }
}

async function ladeFangDatenFuerEdit(id) {
    if (!id) return;
    
    try {
        const { data, error } = await _supabase
            .from('fangbuch-asv-langschede')
            .select('*')
            .eq('id', id)
            .maybeSingle();
            
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
        }
    } catch(e) {
        console.log("Edit-Laden abgefangen:", e);
    }
}

const fischDatenbank = {
"Bachforelle": { mass: 25, k: 1.1, schonzeit: { vonM: 9, vonD: 20, bisM: 2, bisD: 15 } },
"Äsche": { mass: 30, k: 1.0, schonzeit: { vonM: 2, vonD: 1, bisM: 3, bisD: 30 } },
"Hecht": { mass: 45, k: 0.9, schonzeit: { vonM: 1, vonD: 15, bisM: 3, bisD: 30 } },
"Zander": { mass: 50, k: 1.0, schonzeit: { vonM: 1, vonD: 1, bisM: 4, bisD: 31 } },
"Flussbarsch": { mass: 0, k: 1.2 },
"Aal": { mass: 50, k: 0.2 },
"Wels": { mass: 0, k: 0.8 },
"Barbe": { mass: 35, k: 1.2, schonzeit: { vonM: 4, vonD: 15, bisM: 5, bisD: 15 } },
"Karpfen": { mass: 35, k: 2.1 },
"Schleie": { mass: 25, k: 2.0 },
"Döbel": { mass: 0, k: 1.1 },
"Brassen": { mass: 0, k: 1.3 },
"Aland": { mass: 0, k: 1.1 },
"Rotauge": { mass: 0, k: 1.1 },
"Rotfeder": { mass: 0, k: 1.2 },
"Kaulbarsch": { mass: 0, k: 1.0 },
"Bachschmerle": { mass: 0, k: 0.9 },
"Gründling": { mass: 0, k: 1.0 },
"Elritze": { mass: 0, k: 0.9 },
"Schwarzmund-Grundel": { mass: 0, k: 1.1, invasiv: true },
"Groppe": { mass: 0, k: 1.0, geschuetzt: true },
"Bitterling": { mass: 0, k: 1.0, geschuetzt: true },
"Moderlieschen": { mass: 0, k: 0.9, geschuetzt: true },
"Nase": { mass: 35, k: 1.0, geschuetzt: true }
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
    select.onchange = pruefePflichtfelder;
    updateVerbleibOptions("masig");
    pruefePflichtfelder();
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
    const statusHint = document.getElementById('status-hint');
    const gewichtInput = document.getElementById('gewicht');
    const erkennungsBox = document.getElementById('fisch-erkennung');
    const hitparadeBox = document.getElementById("hitparade-meldung");
    const fangortSelect = document.getElementById('fangort');
    const fangortVal = fangortSelect ? fangortSelect.value : "";
    
    const notizFeld = document.getElementById('notiz');
    const notizText = notizFeld ? notizFeld.value.toLowerCase().trim() : ""; 

    if (!fischart) { 
        if (erkennungsBox) erkennungsBox.style.display = 'none'; 
        if (hitparadeBox) hitparadeBox.style.display = 'none';
        return; 
    }
    
    const daten = fischDatenbank[fischart];
    if (!daten) return;

    let infoTexte = []; let istWarnung = false; let aktuellerModus = "masig";
    if (daten.geschuetzt || fischart === "Nase") { infoTexte.push("⚠️ STRENG GESCHÜTZT!"); istWarnung = true; aktuellerModus = "schonzeit"; }
    else if (daten.invasiv) { infoTexte.push("🚨 INVASIVE ART!"); istWarnung = true; aktuellerModus = "invasiv"; }
    
    if (!isNaN(laenge) && laenge > 0) {
        if (daten.k) gewichtInput.placeholder = `ca. ${Math.round((daten.k * Math.pow(laenge, 3)) / 100)} g`;
        
        if (!daten.geschuetzt && fischart !== "Nase" && !daten.invasiv && daten.mass && laenge < daten.mass) { 
            infoTexte.push("⚠️ Untermaßig!"); 
            istWarnung = true; 
            if(aktuellerModus !== "schonzeit") aktuellerModus = "untermasig"; 
        }

        // Bei Fremdgewässer keine Hitparade
        if (fangortVal.includes("Fremdgewässer")) {
            if (hitparadeBox) hitparadeBox.style.display = "none";
        } else {
            holeMindestLaengeFuerHitparade(fischart).then((mindestLaenge) => {
                if (!hitparadeBox) return;

                // Bei Gleichstand oder größer wird die Meldung getriggert
                if (laenge >= mindestLaenge && !daten.geschuetzt && fischart !== "Nase" && !daten.invasiv) {
                    if (notizText.includes("test") || notizText.includes("sofa")) {
                        console.log("🛠️ Test-Modus aktiv: GPS wird übersprungen!");
                        ZeigeHitparadeMeldung(hitparadeBox);
                    } else {
                        // Zeige kurzen Status-Hinweis während das GPS prüft
                        hitparadeBox.style.display = "block";
                        hitparadeBox.innerHTML = "<div style='color: #2e5a44; font-size: 13px; text-align: center; padding: 8px; font-weight: bold;'>📍 Standort wird geprüft... (GPS)</div>";

                        pruefeRuhrStandort().then((ergebnis) => {
                            if (ergebnis.anDerRuhr) {
                                ZeigeHitparadeMeldung(hitparadeBox);
                            } else {
                                hitparadeBox.style.display = "block";
                                hitparadeBox.innerHTML = `<div style='color: #721c24; background-color: #f8d7da; border: 1px solid #f5c6cb; font-size: 13px; text-align: center; padding: 10px; border-radius: 6px;'>📍 Kein Hitparaden-Foto: Du befindest dich aktuell nicht an den ASV Vereinsgewässern.<br><span style='font-size:11px; opacity:0.8;'>(Gemessen: ${ergebnis.lat.toFixed(4)}, ${ergebnis.lon.toFixed(4)} | Nächster Punkt: ${Math.round(ergebnis.minDistanz)}m entfernt)</span></div>`;
                            }
                        });
                    }
                } else {
                    hitparadeBox.style.display = "none";
                }
            });
        }
    } else {
        if (hitparadeBox) hitparadeBox.style.display = "none";
    }

    updateVerbleibOptions(aktuellerModus);
    if (infoTexte.length > 0) { 
        statusHint.style.display = 'block'; 
        statusHint.innerHTML = infoTexte.join("<br>"); 
        statusHint.className = istWarnung ? "hint-box warning" : "hint-box ok"; 
    } else { 
        statusHint.style.display = 'none'; 
    }
    pruefePflichtfelder();
}

function ZeigeHitparadeMeldung(hitparadeBox) {
    if (!hitparadeBox) return;
    hitparadeBox.style.display = "block";
    
    const hatFoto = geknipstesFotoBlob !== null;
    const btnText = hatFoto ? "🔄 Foto ändern" : "📸 Foto aufnehmen";

    hitparadeBox.innerHTML = `
        <div style="background-color: #d4edda; color: #155724; border: 2px solid #c3e6cb; padding: 15px; border-radius: 8px; margin-top: 15px; text-align: center;">
            🎉 <b>Petri Heil, Kollege!</b><br>
            Das ist ein absoluter Spitzenfang! Dieser Fisch knackt die Top 3 der Vereins-Hitparade!<br><br>
            Möchtest du diesen Prachtburschen mit einem Foto in der öffentlichen Galerie verewigen?<br>
            
            <div id="foto-vorschau-bereich" style="margin-top: 10px; display: ${hatFoto ? 'block' : 'none'};">
                <img id="foto-vorschau-img" src="${hatFoto ? URL.createObjectURL(geknipstesFotoBlob) : ''}" style="max-width: 100%; max-height: 220px; border-radius: 8px; border: 2px solid #2e5a44; margin-bottom: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.15);">
            </div>

            <div style="margin-top: 12px;">
                <label for="foto-input" style="display: block; width: 100%; background-color: #2e5a44; color: white; padding: 14px 16px; border-radius: 8px; font-size: 17px; font-weight: bold; text-align: center; cursor: pointer; box-shadow: 0 3px 6px rgba(0,0,0,0.15); box-sizing: border-box;">
                    ${btnText}
                </label>
            </div>
        </div>
    `;
}

function verarbeiteFotoAktion(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const maxDimension = 1024;

            if (width > height) {
                if (width > maxDimension) {
                    height = Math.round((height * maxDimension) / width);
                    width = maxDimension;
                }
            } else {
                if (height > maxDimension) {
                    width = Math.round((width * maxDimension) / height);
                    height = maxDimension;
                }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob((blob) => {
                geknipstesFotoBlob = blob;
                
                const vorschauBereich = document.getElementById("foto-vorschau-bereich");
                const vorschauImg = document.getElementById("foto-vorschau-img");
                
                if (vorschauBereich && vorschauImg) {
                    vorschauImg.src = URL.createObjectURL(blob);
                    vorschauBereich.style.display = "block";
                }
                
                const cameraLabel = document.querySelector('label[for="foto-input"]');
                if (cameraLabel) {
                    cameraLabel.textContent = "🔄 Foto ändern";
                }
            }, 'image/jpeg', 0.75);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

async function saveFang() {
    const speicherBtn = document.getElementById('speichern-btn');
    speicherBtn.disabled = true;
    speicherBtn.style.cursor = 'not-allowed';

    const schnelleEmail = sessionStorage.getItem('userEmail') || 'test@angler.de';
    const ldruckRaw = document.getElementById('luftdruck').value;
    const ldruckVal = ldruckRaw ? parseFloat(ldruckRaw) : null;
    
    let uploadedFotoUrl = null;

    try {
        if (geknipstesFotoBlob && navigator.onLine) {
            const dateiname = `fang_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
            
            const { data: storageData, error: storageError } = await _supabase.storage
                .from('hitparade-fotos')
                .upload(dateiname, geknipstesFotoBlob, {
                    contentType: 'image/jpeg'
                });

            if (storageError) throw new Error("Foto-Upload fehlgeschlagen: " + storageError.message);

            const { data: urlData } = _supabase.storage
                .from('hitparade-fotos')
                .getPublicUrl(dateiname);

            if (urlData) uploadedFotoUrl = urlData.publicUrl;
        }

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
            angler_email: schnelleEmail,
            foto_url: uploadedFotoUrl
        };

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
            
            if (geknipstesFotoBlob) {
                const reader = new FileReader();
                reader.onloadend = function() {
                    fangDaten.offlineFotoBase64 = reader.result;
                    q.push(fangDaten);
                    localStorage.setItem('offlineFange', JSON.stringify(q));
                    document.getElementById('fang-form').reset();
                    location.href = 'index.html';
                };
                reader.readAsDataURL(geknipstesFotoBlob);
            } else {
                q.push(fangDaten); 
                localStorage.setItem('offlineFange', JSON.stringify(q));
                document.getElementById('fang-form').reset();
                location.href = 'index.html';
            }
        }
    } catch (error) {
        alert("⚠️ Achtung: Konnte nicht gespeichert werden! " + error.message);
        speicherBtn.disabled = false;
        speicherBtn.style.cursor = 'pointer';
    }
}

function pruefeRuhrStandort() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve({ anDerRuhr: false, lat: 0, lon: 0, minDistanz: 999999 }); 
            return;
        }

        const gpsOptions = { enableHighAccuracy: false, timeout: 30000, maximumAge: 10000 };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const spielerLat = position.coords.latitude;
                const spielerLon = position.coords.longitude;

                // Deine exakt vorgegebenen Ruhr-Koordinaten
                const ruhrPunkte = [
                    { name: "Punkt 1", lat: 51.4722288, lon: 7.7282183 },
                    { name: "Punkt 2", lat: 51.4723675, lon: 7.7256994 },
                    { name: "Punkt 3", lat: 51.4723161, lon: 7.7222896 },
                    { name: "Punkt 4", lat: 51.4720567, lon: 7.7191555 },
                    { name: "Punkt 5", lat: 51.4726877, lon: 7.7131721 },
                    { name: "Punkt 6", lat: 51.4731385, lon: 7.7072542 },
                    { name: "Punkt 7", lat: 51.4742151, lon: 7.7002412 },
                    { name: "Punkt 8", lat: 51.4740071, lon: 7.7026931 },
                    { name: "Punkt 9", lat: 51.4734595, lon: 7.6949066 },
                    { name: "Punkt 10", lat: 51.4717518, lon: 7.6886282 },
                    { name: "Punkt 10b (Neu eingefügt)", lat: 51.4724475, lon: 7.6909671 },
                    { name: "Punkt 11", lat: 51.4689779, lon: 7.6807590 },

                    // 🛠️ TEST-PUNKT ZUHAUSE
                    { name: "Zuhause Test-Punkt", lat: 51.4946, lon: 7.7441 }
                ];

                const R = 6371e3;
                let anDerRuhr = false;
                let kleinsteEntfernung = 999999;

                for (let punkt of ruhrPunkte) {
                    const phi1 = spielerLat * Math.PI / 180;
                    const phi2 = punkt.lat * Math.PI / 180;
                    const deltaPhi = (punkt.lat - spielerLat) * Math.PI / 180;
                    const deltaLambda = (punkt.lon - spielerLon) * Math.PI / 180;

                    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
                              Math.cos(phi1) * Math.cos(phi2) *
                              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    const entfernung = R * c;

                    if (entfernung < kleinsteEntfernung) {
                        kleinsteEntfernung = entfernung;
                    }

                    // Exakter 800-Meter-Toleranzradius um die Punkte
                    const erlaubterRadius = 800;

                    if (entfernung <= erlaubterRadius) {
                        anDerRuhr = true;
                        break;
                    }
                }

                resolve({ anDerRuhr: anDerRuhr, lat: spielerLat, lon: spielerLon, minDistanz: kleinsteEntfernung });
            },
            (error) => {
                console.warn("GPS-Fehler:", error);
                resolve({ anDerRuhr: false, lat: 0, lon: 0, minDistanz: 999999 });
            },
            gpsOptions
        );
    });
}

// Lädt bei Online-Verbindung die echten Mindestlängen herunter und speichert sie lokal ab
async function aktualisiereLokaleHitparadeCache() {
    try {
        const { data, error } = await _supabase
            .from('fangbuch-asv-langschede')
            .select('fischart, laenge, datum, uhrzeit')
            .order('laenge', { ascending: false })
            .order('datum', { ascending: true })
            .order('uhrzeit', { ascending: true });

        if (error || !data) return;

        const minLängenMap = {};
        const gruppiert = {};

        data.forEach(item => {
            if (!gruppiert[item.fischart]) gruppiert[item.fischart] = [];
            if (gruppiert[item.fischart].length < 3 && item.laenge) {
                gruppiert[item.fischart].push(parseFloat(item.laenge));
            }
        });

        for (const [art, laengen] of Object.entries(gruppiert)) {
            if (laengen.length >= 3) {
                minLängenMap[art] = laengen[laengen.length - 1]; // Der 3. Platz
            } else {
                minLängenMap[art] = 0; // Noch Platz frei
            }
        }

        localStorage.setItem('cachedHitparadeMinima', JSON.stringify(minLängenMap));
    } catch (e) {
        console.warn("Cache-Aktualisierung fehlgeschlagen:", e);
    }
}

// Holt die Mindestlänge für Platz 3 (erst Supabase, dann lokaler Cache, dann Fallback)
async function holeMindestLaengeFuerHitparade(fischart) {
    if (navigator.onLine) {
        try {
            // Sortierung: Größte Länge zuerst, bei Gleichstand der ÄLTESTE Fang zuerst (Wer zuerst kommt, mahlt zuerst)
            const { data, error } = await _supabase
                .from('fangbuch-asv-langschede')
                .select('laenge')
                .eq('fischart', fischart)
                .order('laenge', { ascending: false })
                .order('datum', { ascending: true })
                .order('uhrzeit', { ascending: true })
                .range(0, 2);

            if (!error && data) {
                if (data.length < 3) return 0; // Wenn weniger als 3 Fänge existieren, zählt jeder Fisch
                const platz3 = data[data.length - 1];
                return platz3.laenge ? parseFloat(platz3.laenge) : 0;
            }
        } catch (e) {
            console.warn("Live-Abfrage fehlgeschlagen, nutze Offline-Cache.");
        }
    }

    // Offline-Pfad: Versuche den lokal synchronisierten Cache zu nutzen
    try {
        const cached = JSON.parse(localStorage.getItem('cachedHitparadeMinima'));
        if (cached && cached[fischart] !== undefined) {
            return cached[fischart];
        }
    } catch(e) {}

    // Notfall-Fallback
    return offlineHitparadeMinimaFallback[fischart] || 0;
}

function startSpeechRecognition() {
    const micBtn = document.getElementById('mic-btn');
    const notizFeld = document.getElementById('notiz');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        alert("🚨 Spracheingabe wird von diesem Browser leider nicht unterstützt.");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'de-DE';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    micBtn.style.backgroundColor = '#c0392b';
    micBtn.textContent = '🛑';

    recognition.start();

    recognition.onresult = function(event) {
        const gesprochenerText = event.results[0][0].transcript;
        
        if (notizFeld.value.trim() !== "") {
            notizFeld.value += " " + gesprochenerText;
        } else {
            notizFeld.value = gesprochenerText;
        }
        
        if (typeof validateFisch === 'function') validateFisch();
    };

    recognition.onerror = function(event) {
        console.error("Sprachfehler:", event.error);
    };

    recognition.onend = function() {
        micBtn.style.backgroundColor = 'var(--secondary-color)';
        micBtn.textContent = '🎙️';
    };
}