const SUPABASE_URL = "https://eadleysrezkhxxbhqbdx.supabase.co";
const SUPABASE_KEY = "sb_publishable_Y0g8anBpKs3bsC85iado6w_rYske-SZ";
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let editFangId = null;
let geknipstesFotoBlob = null; // Speichert das komprimierte Foto im Speicher

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

        holeMindestLaengeFuerHitparade(fischart).then((mindestLaenge) => {
            if (!hitparadeBox) return;

            if (laenge > mindestLaenge && !daten.geschuetzt && fischart !== "Nase" && !daten.invasiv) {
                if (notizText.includes("test") || notizText.includes("sofa")) {
                    console.log("🛠️ Test-Modus aktiv: GPS wird übersprungen!");
                    ZeigeHitparadeMeldung(hitparadeBox);
                } else {
                    pruefeRuhrStandort().then((amWasser) => {
                        if (amWasser) {
                            ZeigeHitparadeMeldung(hitparadeBox);
                        } else {
                            hitparadeBox.style.display = "none";
                        }
                    });
                }
            } else {
                hitparadeBox.style.display = "none";
            }
        });
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

            <!-- Großer, zuverlässiger Kamera-Button -->
            <div style="margin-top: 12px;">
                <label for="foto-input" style="display: block; width: 100%; background-color: #2e5a44; color: white; padding: 14px 16px; border-radius: 8px; font-size: 17px; font-weight: bold; text-align: center; cursor: pointer; box-shadow: 0 3px 6px rgba(0,0,0,0.15); box-sizing: border-box;">
                    ${btnText}
                </label>
            </div>
        </div>
    `;
}

// Verarbeitet das geknipste Foto, komprimiert es und blendet sofort die Vorschau ein
function verarbeiteFotoAktion(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            // Komprimierung: Max. 1024px Breite/Höhe
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

            // Als JPEG mit 75% Qualität wandeln (kleine Dateigröße)
            canvas.toBlob((blob) => {
                geknipstesFotoBlob = blob;
                
                // Vorschau direkt im grünen Kasten anzeigen
                const vorschauBereich = document.getElementById("foto-vorschau-bereich");
                const vorschauImg = document.getElementById("foto-vorschau-img");
                
                if (vorschauBereich && vorschauImg) {
                    vorschauImg.src = URL.createObjectURL(blob);
                    vorschauBereich.style.display = "block";
                }
                
                // Button-Text auf "Foto ändern" anpassen
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
        // Falls ein Foto aufgenommen wurde, laden wir es zuerst in den Supabase Storage hoch
        if (geknipstesFotoBlob && navigator.onLine) {
            const dateiname = `fang_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
            
            // Bucket-Name jetzt exakt kleingeschrieben: hitparade-fotos
            const { data: storageData, error: storageError } = await _supabase.storage
                .from('hitparade-fotos')
                .upload(dateiname, geknipstesFotoBlob, {
                    contentType: 'image/jpeg'
                });

            if (storageError) throw new Error("Foto-Upload fehlgeschlagen: " + storageError.message);

            // Öffentliche URL des Fotos abrufen
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
            q.push(fangDaten); localStorage.setItem('offlineFange', JSON.stringify(q));
            document.getElementById('fang-form').reset();
            location.href = 'index.html';
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
            resolve(false); 
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const spielerLat = position.coords.latitude;
                const spielerLon = position.coords.longitude;

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

                const R = 6371e3;
                let anDerRuhr = false;

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

                    if (entfernung <= 100) {
                        anDerRuhr = true;
                        break;
                    }
                }

                resolve(anDerRuhr);
            },
            (error) => {
                resolve(false);
            },
            { enableHighAccuracy: true, timeout: 7000 }
        );
    });
}

async function holeMindestLaengeFuerHitparade(fischart) {
    try {
        const { data, error } = await _supabase
            .from('fangbuch-asv-langschede')
            .select('laenge')
            .eq('fischart', fischart)
            .order('laenge', { ascending: false })
            .range(0, 2);

        if (error) throw error;

        if (!data || data.length < 3) {
            return 0; 
        }

        const platz3 = data[data.length - 1];
        return platz3.laenge ? parseFloat(platz3.laenge) : 0;

    } catch (e) {
        return 0;
    }
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