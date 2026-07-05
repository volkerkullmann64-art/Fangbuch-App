// Biologische K-Faktoren für die Berechnung (Gewicht = K * L^3 / 100)
const kFaktoren = {
    "Zander": 0.85,
    "Bachforelle": 1.10,
    "Regenbogenforelle": 1.20,
    "Barsch": 1.30,
    "Hecht": 0.75,
    "Wels": 0.60,
    "Karpfen": 1.80,
    "Aal": 0.20
};

// ZUKUNFTS-VORBEREITUNG: Hier wird später der Status des verifizierten Vereinsmitglieds gehalten
let aktuellesMitglied = {
    eingeloggt: false,
    name: "",
    email: "",
    mitgliedsNummer: ""
};

document.addEventListener("DOMContentLoaded", () => {
    ladeProfil();
    renderFänge();
    document.getElementById('datum').valueAsDate = new Date();
});

// 1. Automatische Gewichtsberechnung anhand Länge und K-Faktor
function berechneGewicht() {
    const fischart = document.getElementById('fischart').value;
    const laengeInput = document.getElementById('laenge').value;
    const gewichtFeld = document.getElementById('gewicht');
    
    if (fischart && laengeInput) {
        const laenge = parseFloat(laengeInput);
        const kFactor = kFaktoren[fischart] || 1.0;
        const berechnetesGewicht = Math.round((kFactor * Math.pow(laenge, 3)) / 100);
        gewichtFeld.value = berechnetesGewicht;
    } else {
        gewichtFeld.value = "";
    }
}

// 2. Profil-Logik (Bereits so vorbereitet, dass es später durch die Whitelist-Prüfung ersetzt wird)
function speichereProfil() {
    const name = document.getElementById('anglerNameInput').value.trim();
    if (name) {
        // HIER KOMMT SPÄTER DIE PRÜFUNG: Steht die E-Mail/Name auf der Vereinsliste?
        localStorage.setItem('anglerName', name);
        alert("Profil lokal gespeichert! Sobald die Vereinsdatenbank aktiv ist, wird dieses Konto mit der Mitgliederliste abgeglichen.");
        ladeProfil();
        openTab('fang');
    } else {
        alert("Bitte trage einen Namen ein.");
    }
}

function ladeProfil() {
    const gespeicherterName = localStorage.getItem('anglerName');
    const anzeigeFeld = document.getElementById('anglerNameAnzeige');
    const inputFeld = document.getElementById('anglerNameInput');
    
    if (gespeicherterName) {
        if (anzeigeFeld) anzeigeFeld.value = gespeicherterName;
        if (inputFeld) inputFeld.value = gespeicherterName;
        
        // Zukunfts-Objekt befüllen
        aktuellesMitglied.eingeloggt = true;
        aktuellesMitglied.name = gespeicherterName;
    } else {
        if (anzeigeFeld) anzeigeFeld.value = "Kein Profil eingerichtet!";
        setTimeout(() => {
            alert("Willkommen! Bitte richte zuerst kurz dein Angler-Profil ein.");
            openTab('profil');
        }, 200);
    }
}

// 3. Tab-Wechsel-Logik
function openTab(tabId) {
    const contents = document.getElementsByClassName('tab-content');
    for (let content of contents) { content.classList.remove('active'); }
    
    const links = document.getElementsByClassName('tab-link');
    for (let link of links) { link.classList.remove('active'); }
    
    document.getElementById(tabId).classList.add('active');
    
    const targetLink = Array.from(document.getElementsByClassName('tab-link')).find(link => link.getAttribute('onclick').includes(tabId));
    if (targetLink) targetLink.classList.add('active');
}

// 4. Haupt-Schnittstelle für das Speichern
document.getElementById('fangForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = localStorage.getItem('anglerName');
    if (!name) {
        alert("Bitte richte zuerst dein Angler-Profil ein!");
        openTab('profil');
        return;
    }
    
    // Das vollständige Daten-Objekt (bereit für jede SQL- oder Cloud-Datenbank)
    const neuerFang = {
        id: Date.now(), // Zeitstempel dient als eindeutige ID
        angler: name,
        fischart: document.getElementById('fischart').value,
        laenge: parseInt(document.getElementById('laenge').value),
        gewicht: parseInt(document.getElementById('gewicht').value) || 0,
        gewaesser: document.getElementById('gewaesser').value,
        datum: document.getElementById('datum').value,
        uhrzeit: document.getElementById('uhrzeit').value,
        wetter: document.getElementById('wetter').value,
        luftdruck: parseInt(document.getElementById('luftdruck').value) || null,
        methode: document.getElementById('methode').value,
        notizen: document.getElementById('notizen').value,
        synkronisiert: false // WICHTIG FÜR PWA: Zeigt an, ob es schon im Internet hochgeladen wurde
    };
    
    // Aufruf unserer zukunftssicheren Speicher-Schnittstelle
    verarbeiteNeuenFang(neuerFang);
    
    this.reset();
    document.getElementById('datum').valueAsDate = new Date();
    ladeProfil();
});

// ZUKUNFTSSICHERE SCHNITTSTELLE: Regelt Offline-Speicherung und Online-Sync separat
function verarbeiteNeuenFang(fang) {
    // 1. Immer zuerst lokal sichern (Sicherheit geht vor, falls das Netz am Wasser weg ist)
    let faenge = JSON.parse(localStorage.getItem('vereinsFaenge')) || [];
    faenge.push(fang);
    localStorage.setItem('vereinsFaenge', JSON.stringify(faenge));
    
    // 2. Prüfen, ob wir Internet haben
    if (navigator.onLine) {
        // HIER BINDEN WIR SPÄTER DIE UNTERE FUNKTION AN:
        // hochladenInVereinsDatenbank(fang);
        alert("Fang erfolgreich eingetragen! (Online-Modus vorbereitet)");
    } else {
        alert("Kein Netz am Wasser. Fang wurde sicher auf dem Gerät zwischengespeichert und wird automatisch synchronisiert, sobald du wieder Empfang hast!");
    }
    
    renderFänge();
}

// DIESE FUNKTION WARTET SPÄTER AUF UNSERE DATENBANK ( Firebase / Supabase )
function hochladenInVereinsDatenbank(fang) {
    console.log("Sende Daten an den Vereinsserver...", fang);
    // Code für den Server-Upload kommt hier rein, sobald wir die Whitelist und Datenbank wählen.
    // Nach erfolgreichem Upload setzen wir fang.synkronisiert = true;
}

// 5. Liste anzeigen
function renderFänge() {
    const liste = document.getElementById('offlineListe');
    const statCount = document.getElementById('statCount');
    let faenge = JSON.parse(localStorage.getItem('vereinsFaenge')) || [];
    
    if (statCount) statCount.textContent = faenge.length;
    liste.innerHTML = "";
    
    if (faenge.length === 0) {
        liste.innerHTML = "<p class='info-text'>Noch keine Fänge eingetragen.</p>";
        return;
    }
    
    faenge.reverse().forEach(fang => {
        const eintrag = document.createElement('div');
        eintrag.className = 'fang-eintrag';
        eintrag.innerHTML = `
            <strong>${fang.fischart}</strong> - ${fang.laenge} cm (~${fang.gewicht}g)<br>
            <span class="info-text">
                👤 Angler: ${fang.angler} | 📍 ${fang.gewaesser}<br>
                📅 ${fang.datum} ${fang.uhrzeit ? '🕒 ' + fang.uhrzeit : ''}<br>
                🌤️ Wetter: ${fang.wetter} ${fang.luftdruck ? '(' + fang.luftdruck + ' hPa)' : ''}<br>
                🎣 Methode: ${fang.methode}<br>
                ${fang.notizen ? '📝 Notiz: ' + fang.notizen : ''}
            </span>
        `;
        liste.appendChild(eintrag);
    });
}