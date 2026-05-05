import { thickness } from 'three/src/nodes/core/PropertyNode.js';
import { openCategoryManager } from './category-manager.js';
import { LibraryLoader } from './loader-optimizer.js';
import './style.css';
import * as THREE from 'three';

// --- 1. SETUP BASE ---
const scene = new THREE.Scene();

// Diamo un colore alla scena (la "parete" dietro la libreria)
// Puoi cambiare questo codice esadecimale con il colore che preferisci!
scene.background = new THREE.Color('#2c3e50'); 

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.5, 3.5); 

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap; 
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7.5); // Spostata un po' più avanti per ombre migliori
directionalLight.castShadow = true; // ABILITA PROIEZIONE

// Ottimizzazione risoluzione e area ombre
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.camera.left = -10;
directionalLight.shadow.camera.right = 10;
directionalLight.shadow.camera.top = 10;
directionalLight.shadow.camera.bottom = -10;

scene.add(directionalLight);

let textureLoader = new THREE.TextureLoader();
// --- COSTRUZIONE DELLA MENSOLA (Con Texture Legno Reale) ---
const shelfGeometry = new THREE.BoxGeometry(50, 0.2, 4); 

// 1. Carichiamo la texture del legno (da internet o da un file locale)
const woodTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/hardwood2_diffuse.jpg');

// 2. Ripetiamo la texture per evitare che si "stiri" sulla mensola lunghissima
woodTexture.wrapS = THREE.RepeatWrapping;
woodTexture.wrapT = THREE.RepeatWrapping;
// Ripetiamo l'immagine 12 volte in larghezza e 1 volta in profondità
woodTexture.repeat.set(12, 1); 

// 3. Creiamo il materiale applicando la fotografia
const shelfMaterial = new THREE.MeshStandardMaterial({ 
    map: woodTexture,
    roughness: 0.85, // Mantiene quell'aspetto un po' grezzo e non troppo riflettente
    color: '#aaaaaa' // Scuriamo leggermente la foto originale per far risaltare meglio i libri
});

const shelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
shelf.position.set(0, -1.6, -0.5); 
shelf.receiveShadow = true;
scene.add(shelf);
// ---------------------------------

const libLoader = new LibraryLoader(textureLoader);

const libraryGroup = new THREE.Group();
scene.add(libraryGroup);


const pagesMaterial = new THREE.MeshStandardMaterial({ color: 0xf5f5dc });
const baseCoverColor = '#1a1a1a';
const baseCoverMaterial = new THREE.MeshStandardMaterial({ color: baseCoverColor });

// Variabili di stato
let booksArray = [];
let currentIndex = 0;
let isShowingBack = false;
let targetCameraY = 1.5; // Altezza bersaglio della telecamera

// --- 2. STILI CSS MODERNI E UI (Menu + Bottone Inferiore) ---
const styleStyle = document.createElement('style');
styleStyle.innerHTML = `
    /* Stili condivisi per l'effetto Glassmorphism */
    .glass-effect {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        color: #ffffff;
        font-family: 'Segoe UI', system-ui, sans-serif;
        transition: all 0.3s ease;
        outline: none;
    }

    /* Bottone moderno */
    .modern-btn {
        padding: 12px 30px;
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 2px;
        text-transform: uppercase;
        border-radius: 50px;
        cursor: pointer;
        display: inline-block;
        text-align: center;
    }
    .modern-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.5);
        transform: translateY(-3px);
        box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
    }
    .modern-btn:active {
        transform: translateY(0px);
    }

    /* Barra superiore e Input di ricerca */
    .top-bar {
        position: absolute;
        top: 30px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 15px;
        align-items: center;
        z-index: 100;
        width: 90%;
        max-width: 700px;
    }
    .modern-input {
        padding: 12px 25px;
        font-size: 14px;
        border-radius: 50px;
        flex-grow: 1; /* Occupa tutto lo spazio rimanente */
    }
    .modern-input::placeholder { color: rgba(255, 255, 255, 0.6); }
    .modern-input:focus {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.5);
        box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
    }
    
    /* Nascondiamo l'input file originale brutto da vedere */
    #file-upload { display: none; }
`;
document.head.appendChild(styleStyle);

// --- COSTRUZIONE MENU SUPERIORE ---
const topBar = document.createElement('div');
topBar.className = 'top-bar';
topBar.style.width = '95%'; 
topBar.style.maxWidth = '1000px'; 
document.body.appendChild(topBar);

// 1. Etichetta Categoria Attuale
const categoryLabel = document.createElement('div');
categoryLabel.className = 'glass-effect';
categoryLabel.style.padding = '12px 20px';
categoryLabel.style.borderRadius = '50px';
categoryLabel.style.fontSize = '13px';
categoryLabel.style.fontWeight = 'bold';
categoryLabel.style.letterSpacing = '1px';
categoryLabel.style.whiteSpace = 'nowrap';
categoryLabel.style.display = 'none';
topBar.appendChild(categoryLabel);

// 2. Bottone per Gestire la Mensola intera
const manageCatBtn = document.createElement('button');
manageCatBtn.innerHTML = '⚙️ Gestisci';
manageCatBtn.title = 'Rinomina o elimina questa categoria';
manageCatBtn.className = 'glass-effect modern-btn';
manageCatBtn.style.padding = '12px 15px';
manageCatBtn.style.display = 'none';
topBar.appendChild(manageCatBtn);

const searchInput = document.createElement('input');
searchInput.type = 'text';
searchInput.placeholder = 'Cerca per titolo o autore...';
searchInput.className = 'glass-effect modern-input';
topBar.appendChild(searchInput);

const uploadLabel = document.createElement('label');
uploadLabel.innerText = '+ Carica Ebook';
uploadLabel.className = 'glass-effect modern-btn';
uploadLabel.htmlFor = 'file-upload';
uploadLabel.style.whiteSpace = 'nowrap';
topBar.appendChild(uploadLabel);

const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.id = 'file-upload';
fileInput.accept = '.epub';
fileInput.multiple = true;
topBar.appendChild(fileInput);


// --- COSTRUZIONE MENU INFERIORE ---
const uiContainer = document.createElement('div');
uiContainer.style.position = 'absolute';
uiContainer.style.bottom = '40px';
uiContainer.style.left = '50%';
uiContainer.style.transform = 'translateX(-50%)';
uiContainer.style.display = 'flex'; 
uiContainer.style.gap = '15px';     
uiContainer.style.alignItems = 'center';
document.body.appendChild(uiContainer);

const infoBtn = document.createElement('button');
infoBtn.innerText = 'Mostra Trama';
infoBtn.className = 'glass-effect modern-btn';
uiContainer.appendChild(infoBtn);

const chatBtn = document.createElement('button');
chatBtn.innerHTML = '💬 Parla col Libro';
chatBtn.className = 'glass-effect modern-btn';
uiContainer.appendChild(chatBtn);

// 3. Bottone per Assegnare la Categoria al Libro
const assignCatBtn = document.createElement('button');
assignCatBtn.innerHTML = '🏷️ Assegna Categoria';
assignCatBtn.className = 'glass-effect modern-btn';
uiContainer.appendChild(assignCatBtn);

// --- LOGICA DEL BOTTONE ASSEGNA CATEGORIA (Singolo Libro) ---
// --- LOGICA DEL BOTTONE ASSEGNA CATEGORIA (Modale Custom con Chips) ---
assignCatBtn.onclick = () => {
    if (booksArray.length === 0) return;
    const activeBook = booksArray[currentIndex];
    
    // 1. Estraiamo tutte le categorie UNICHE attualmente esistenti (escludendo "Senza Categoria")
    const existingCategories = [...new Set(booksArray.map(b => b.userData.category))]
                                .filter(cat => cat !== 'Senza Categoria');

    // 2. Creiamo l'Overlay (Sfondo scuro)
    const overlay = document.createElement('div');
    overlay.id = 'assign-category-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0'; overlay.style.left = '0';
    overlay.style.width = '100vw'; overlay.style.height = '100vh';
    overlay.style.backgroundColor = 'rgba(0,0,0,0.6)';
    overlay.style.zIndex = '2000';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.backdropFilter = 'blur(5px)'; // Sfocatura dello sfondo 3D
    document.body.appendChild(overlay);

    // 3. Creiamo la Finestra Modale
    const modal = document.createElement('div');
    modal.className = 'glass-effect';
    modal.style.padding = '30px';
    modal.style.borderRadius = '20px';
    modal.style.width = '90%';
    modal.style.maxWidth = '400px';
    modal.style.textAlign = 'center';
    overlay.appendChild(modal);

    // Titolo
    const title = document.createElement('h3');
    title.innerText = `Sposta "${activeBook.userData.title}"`;
    title.style.margin = '0 0 15px 0';
    modal.appendChild(title);

    // Input per creare una NUOVA categoria
    const inputWrapper = document.createElement('div');
    inputWrapper.style.display = 'flex';
    inputWrapper.style.gap = '10px';
    inputWrapper.style.marginBottom = '20px';
    
    const catInput = document.createElement('input');
    catInput.type = 'text';
    catInput.placeholder = 'Scrivi una nuova categoria...';
    catInput.className = 'glass-effect modern-input';
    catInput.style.flexGrow = '1';
    
    const saveBtn = document.createElement('button');
    saveBtn.innerText = 'Salva';
    saveBtn.className = 'glass-effect modern-btn';
    saveBtn.style.padding = '10px 20px';
    
    inputWrapper.appendChild(catInput);
    inputWrapper.appendChild(saveBtn);
    modal.appendChild(inputWrapper);

    // Sezione delle categorie ESISTENTI (I bottoncini veloci)
    if (existingCategories.length > 0) {
        const subtitle = document.createElement('div');
        subtitle.innerText = 'Oppure scegli una mensola esistente:';
        subtitle.style.fontSize = '12px';
        subtitle.style.opacity = '0.7';
        subtitle.style.marginBottom = '10px';
        modal.appendChild(subtitle);

        const chipsContainer = document.createElement('div');
        chipsContainer.style.display = 'flex';
        chipsContainer.style.flexWrap = 'wrap';
        chipsContainer.style.gap = '8px';
        chipsContainer.style.justifyContent = 'center';

        existingCategories.forEach(cat => {
            const chip = document.createElement('button');
            chip.innerText = cat;
            chip.className = 'glass-effect';
            chip.style.padding = '8px 15px';
            chip.style.borderRadius = '50px';
            chip.style.fontSize = '12px';
            chip.style.cursor = 'pointer';
            
            // Effetto hover per i bottoncini
            chip.onmouseover = () => chip.style.background = 'rgba(255,255,255,0.2)';
            chip.onmouseout = () => chip.style.background = 'rgba(255,255,255,0.08)';

            // Cliccando il bottoncino veloce, inviamo subito al server
            chip.onclick = () => submitCategory(cat);
            
            chipsContainer.appendChild(chip);
        });
        modal.appendChild(chipsContainer);
    }

    // Bottone Annulla
    const cancelBtn = document.createElement('button');
    cancelBtn.innerText = 'Annulla';
    cancelBtn.className = 'glass-effect modern-btn'; // Usiamo le tue classi base!
    cancelBtn.style.marginTop = '20px';
    cancelBtn.style.padding = '8px 20px';
    cancelBtn.style.fontSize = '11px'; // Leggermente più piccolo del tasto Salva
    cancelBtn.style.background = 'rgba(255, 50, 50, 0.1)'; // Sfondo rossastro semi-trasparente
    cancelBtn.style.borderColor = 'rgba(255, 100, 100, 0.3)'; // Bordo rossastro
    cancelBtn.style.color = '#ffb3b3'; // Testo rosa/rosso chiaro
    cancelBtn.onclick = () => overlay.remove();
    
    // Effetto hover personalizzato per l'annullamento
    cancelBtn.onmouseover = () => {
        cancelBtn.style.background = 'rgba(255, 50, 50, 0.2)';
        cancelBtn.style.transform = 'translateY(-2px)';
    };
    cancelBtn.onmouseout = () => {
        cancelBtn.style.background = 'rgba(255, 50, 50, 0.1)';
        cancelBtn.style.transform = 'translateY(0px)';
    };

    modal.appendChild(cancelBtn);

    // --- FUNZIONE DI INVIO AL SERVER ---
    const submitCategory = async (newTag) => {
        if (!newTag || newTag.trim() === '') return;
        
        saveBtn.innerText = '⏳...';
        saveBtn.disabled = true;

        try {
            const response = await fetch(`/api/books/${activeBook.userData.id}/tags`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tag: newTag.trim() })
            });
            const result = await response.json();
            if (result.success) {
                location.reload(); // Ricarica per spostare il libro fisicamente sulla nuova mensola
            } else {
                alert(result.message);
                saveBtn.innerText = 'Salva';
                saveBtn.disabled = false;
            }
        } catch (e) { 
            console.error(e); 
            overlay.remove();
        }
    };

    // Colleghiamo l'invio all'input testuale (Click su Salva o tasto Invio)
    saveBtn.onclick = () => submitCategory(catInput.value);
    catInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') submitCategory(catInput.value);
    });

    // Chiudi cliccando fuori dal modale
    overlay.addEventListener('pointerdown', (e) => {
        if (e.target === overlay) overlay.remove();
    });

    // Focus automatico sull'input
    setTimeout(() => catInput.focus(), 100);
};

// --- LOGICA DEL BOTTONE GESTISCI CATEGORIA (Intera Mensola) ---
// --- LOGICA DEL BOTTONE GESTISCI CATEGORIA (Intera Mensola) ---
manageCatBtn.onclick = () => {
    if (booksArray.length === 0) return;
    const activeCategory = booksArray[currentIndex].userData.category;
    
    // Passiamo la palla al nostro nuovo file UI!
    openCategoryManager(activeCategory, booksArray);
};

async function updateCategoryOnServer(oldName, newName, action) {
    try {
        const response = await fetch('/api/categories', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ oldName, newName, action })
        });
        const result = await response.json();
        if (result.success) {
            location.reload(); // Ricarica la pagina per ricostruire le mensole 3D
        } else {
            alert(result.message);
        }
    } catch (e) { console.error(e); }
}

// --- LOGICA DEL PANNELLO CHAT IA ---
const chatPanel = document.getElementById('global-chat-panel');
const closeChatBtn = document.getElementById('close-global-chat-btn');
const chatMessages = document.getElementById('global-chat-messages');
const chatInput = document.getElementById('global-chat-input');
const sendChatBtn = document.getElementById('send-global-chat-btn');

chatBtn.onclick = () => {
    if (booksArray.length === 0) return;
    const activeBook = booksArray[currentIndex];
    
    chatPanel.style.display = 'flex';
    setTimeout(() => chatPanel.style.opacity = '1', 10); 
    
    chatMessages.innerHTML = '';
    appendChatMessage('IA', `Ciao! Sono il bibliotecario IA. Chiedimi pure qualsiasi cosa su <b>"${activeBook.userData.title}"</b>!`);
};

closeChatBtn.onclick = () => {
    chatPanel.style.opacity = '0';
    setTimeout(() => chatPanel.style.display = 'none', 300);
};

chatPanel.addEventListener('pointerdown', (e) => e.stopPropagation());
chatPanel.addEventListener('pointerup', (e) => e.stopPropagation());
chatPanel.addEventListener('wheel', (e) => e.stopPropagation());
chatPanel.addEventListener('touchstart', (e) => e.stopPropagation());
chatPanel.addEventListener('touchend', (e) => e.stopPropagation());
chatPanel.addEventListener('touchmove', (e) => e.stopPropagation());

function appendChatMessage(sender, text) {
    const msgDiv = document.createElement('div');
    msgDiv.style.padding = '12px 16px';
    msgDiv.style.borderRadius = '12px';
    msgDiv.style.maxWidth = '85%';
    msgDiv.style.lineHeight = '1.4';
    
    if (sender === 'Tu') {
        msgDiv.style.alignSelf = 'flex-end';
        msgDiv.style.background = 'rgba(0, 150, 255, 0.2)';
        msgDiv.style.border = '1px solid rgba(0, 150, 255, 0.4)';
    } else {
        msgDiv.style.alignSelf = 'flex-start';
        msgDiv.style.background = 'rgba(255, 255, 255, 0.1)';
        msgDiv.style.border = '1px solid rgba(255, 255, 255, 0.2)';
    }
    
    const formattedText = text.replace(/\n/g, '<br>');
    msgDiv.innerHTML = `<strong style="color: ${sender === 'Tu' ? '#4da6ff' : '#ffd700'}">${sender}:</strong><br><div style="margin-top: 5px;">${formattedText}</div>`;
    
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight; 
}

async function sendChatMessage() {
    const text = chatInput.value.trim();
    if (!text || booksArray.length === 0) return;

    const activeBook = booksArray[currentIndex];

    appendChatMessage('Tu', text);
    chatInput.value = '';
    
    chatInput.disabled = true;
    sendChatBtn.disabled = true;
    
    const loadingId = 'loading-' + Date.now();
    appendChatMessage('IA', `<span id="${loadingId}">Sto sfogliando il libro per cercare la risposta... 📚</span>`);

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question: text,
                epubUrl: activeBook.userData.epubPath,
                currentSnippet: "L'utente sta chiedendo informazioni generali sul libro dal menu principale." ,
                description: activeBook.userData.description 
            })
        });

        const result = await response.json();
        
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.parentNode.remove();

        if (result.success) {
            appendChatMessage('IA', result.answer);
        } else {
            appendChatMessage('IA', '❌ Errore: ' + result.message);
        }
    } catch (error) {
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.parentNode.remove();
        appendChatMessage('IA', '❌ Impossibile contattare l\'IA. Ollama è acceso in background?');
    } finally {
        chatInput.disabled = false;
        sendChatBtn.disabled = false;
        chatInput.focus();
    }
}

sendChatBtn.onclick = sendChatMessage;
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChatMessage();
});

// --- COSTRUZIONE FRECCE LATERALI ---
const leftArrow = document.createElement('button');
leftArrow.innerHTML = '&#10094;'; // Simbolo freccia sinistra
leftArrow.className = 'glass-effect modern-btn';
leftArrow.style.position = 'absolute';
leftArrow.style.left = '20px';
leftArrow.style.top = '50%';
leftArrow.style.transform = 'translateY(-50%)';
leftArrow.style.fontSize = '24px';
leftArrow.style.padding = '15px 20px';
leftArrow.style.borderRadius = '50%'; // Le facciamo tonde!
document.body.appendChild(leftArrow);

const rightArrow = document.createElement('button');
rightArrow.innerHTML = '&#10095;'; // Simbolo freccia destra
rightArrow.className = 'glass-effect modern-btn';
rightArrow.style.position = 'absolute';
rightArrow.style.right = '20px';
rightArrow.style.top = '50%';
rightArrow.style.transform = 'translateY(-50%)';
rightArrow.style.fontSize = '24px';
rightArrow.style.padding = '15px 20px';
rightArrow.style.borderRadius = '50%';
document.body.appendChild(rightArrow);

// Funzione unificata per scorrere i libri
function changeBook(direction) {
    if (booksArray.length === 0) return;
    const newIndex = currentIndex + direction;

    // Controlliamo di non andare oltre i limiti della libreria
    if (newIndex >= 0 && newIndex < booksArray.length) {
        currentIndex = newIndex;
        isShowingBack = false;
        infoBtn.innerText = 'Mostra Trama';
        updateCarousel();
    }
}

function changeShelf(direction) {
    if (booksArray.length === 0) return;
    const currentCategory = booksArray[currentIndex].userData.category;
    let targetIndex = -1;

    if (direction === 1) { 
        // VAI ALLA MENSOLA SOPRA: Cerca in avanti il primo libro di una categoria diversa
        for (let i = currentIndex; i < booksArray.length; i++) {
            if (booksArray[i].userData.category !== currentCategory) {
                targetIndex = i;
                break;
            }
        }
    } else { 
        // VAI ALLA MENSOLA SOTTO: Trova l'inizio della mensola precedente
        let firstOfCurrent = currentIndex;
        while (firstOfCurrent > 0 && booksArray[firstOfCurrent - 1].userData.category === currentCategory) {
            firstOfCurrent--;
        }
        if (firstOfCurrent > 0) {
            const prevCategory = booksArray[firstOfCurrent - 1].userData.category;
            let firstOfPrev = firstOfCurrent - 1;
            while (firstOfPrev > 0 && booksArray[firstOfPrev - 1].userData.category === prevCategory) {
                firstOfPrev--;
            }
            targetIndex = firstOfPrev;
        }
    }

    if (targetIndex !== -1) {
        currentIndex = targetIndex;
        isShowingBack = false;
        infoBtn.innerText = 'Mostra Trama';
        updateCarousel();
    }
}

// Eventi click sulle frecce
leftArrow.onclick = () => changeBook(-1);
rightArrow.onclick = () => changeBook(1);

// --- EVENTI UI ---
infoBtn.onclick = () => {
    isShowingBack = !isShowingBack;
    infoBtn.innerText = isShowingBack ? 'Mostra Copertina' : 'Mostra Trama';
    updateCarousel();
};

// Logica di ricerca in tempo reale
searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    if (!query) return;

    // Cerca il primo libro che contiene il testo nel titolo o nell'autore
    const foundIndex = booksArray.findIndex(book => {
        // Cerchiamo in titolo e autore
        const matchTitle = book.userData.title.toLowerCase().includes(query);
        const matchAuthor = book.userData.author.toLowerCase().includes(query);
        
        // Cerchiamo nei tag (assicurandoci che esistano prima di fare map/some)
        let matchTag = false;
        if (book.userData.tags && book.userData.tags.length > 0) {
            matchTag = book.userData.tags.some(tag => tag.toLowerCase().includes(query));
        }

        return matchTitle || matchAuthor || matchTag;
    });

    if (foundIndex !== -1 && foundIndex !== currentIndex) {
        currentIndex = foundIndex;
        isShowingBack = false;
        infoBtn.innerText = 'Mostra Trama';
        updateCarousel();
    }
});

// Avviso per l'upload
// --- GESTIONE UPLOAD MULTIPLO ---
fileInput.addEventListener('change', async (event) => {
    const files = event.target.files;
    if (files.length === 0) return;

    // Blocchiamo temporaneamente la barra di ricerca per evitare problemi durante l'upload
    searchInput.disabled = true;

    let successCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    // Manda i file in coda, uno dopo l'altro
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Aggiorniamo il testo del bottone per mostrare il progresso
        uploadLabel.innerText = `⏳ Carico ${i + 1}/${files.length}...`;
        console.log(`Caricamento ${i + 1} di ${files.length}: ${file.name}...`);
        
        const formData = new FormData();
        formData.append('ebook', file); 

        try {
            // Aspettiamo che il server finisca QUESTO libro prima di passare al prossimo
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                successCount++;
            } else if (result.message && result.message.includes('già presente')) {
                duplicateCount++;
            } else {
                errorCount++;
            }
        } catch (error) {
            console.error("Errore di rete con", file.name);
            errorCount++;
        }
    }

    // Finito il ciclo, diamo il resoconto!
    let finalMessage = `Upload completato!\n✅ Aggiunti: ${successCount}`;
    if (duplicateCount > 0) finalMessage += `\n🛑 Duplicati ignorati: ${duplicateCount}`;
    if (errorCount > 0) finalMessage += `\n❌ Errori: ${errorCount}`;
    
    alert(finalMessage);

    // Puliamo e ripristiniamo l'interfaccia
    fileInput.value = '';
    uploadLabel.innerText = '+ Carica Ebook';
    searchInput.disabled = false;

    // Ricarichiamo la pagina per posizionare i nuovi libri sullo scaffale 3D!
    location.reload(); 
});
// --- 3. GENERATORI DI TEXTURE ---
function createSpineTexture(title, author) {
    const canvas = document.createElement('canvas');
    canvas.width = 128; 
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    // Sfondo e rotazione
    ctx.fillStyle = baseCoverColor; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center'; 
    ctx.textBaseline = 'middle';
    ctx.translate(canvas.width / 2, canvas.height / 2); 
    ctx.rotate(Math.PI / 2); 
    
    // --- 1. RIDIMENSIONAMENTO DINAMICO TITOLO ---
    let titleFontSize = 40; // Partiamo dalla grandezza massima desiderata
    const maxWidth = canvas.height - 60; // 1024px meno un po' di margine ai bordi
    
    ctx.font = `bold ${titleFontSize}px Arial, sans-serif`;
    
    // Finché il testo è troppo largo (e il font non diventa minuscolo), rimpiccioliscilo!
    while (ctx.measureText(title).width > maxWidth && titleFontSize > 12) {
        titleFontSize -= 2;
        ctx.font = `bold ${titleFontSize}px Arial, sans-serif`;
    }
    
    ctx.fillStyle = '#ffffff'; 
    ctx.fillText(title, 0, -15);
    
    // --- 2. RIDIMENSIONAMENTO DINAMICO AUTORE ---
    let authorFontSize = 30;
    
    ctx.font = `italic ${authorFontSize}px Arial, sans-serif`;
    
    while (ctx.measureText(author).width > maxWidth && authorFontSize > 10) {
        authorFontSize -= 2;
        ctx.font = `italic ${authorFontSize}px Arial, sans-serif`;
    }
    
    ctx.fillStyle = '#cccccc'; 
    ctx.fillText(author, 0, 30); 
    
    return new THREE.CanvasTexture(canvas);
}

function createBackCoverTexture(description) {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 768;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = baseCoverColor; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#dddddd'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';

    const words = description.split(' ');
    const maxWidth = 432; const maxHeight = 688;
    let fontSize = 28; let lineHeight; let lines = [];
    while (fontSize >= 14) { 
        ctx.font = `${fontSize}px Arial, sans-serif`;
        lineHeight = fontSize * 1.5; lines = []; let line = '';
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            if (ctx.measureText(testLine).width > maxWidth && n > 0) {
                lines.push(line); line = words[n] + ' ';
            } else { line = testLine; }
        }
        lines.push(line); if (lines.length * lineHeight <= maxHeight) break;
        fontSize -= 2; 
    }
    ctx.font = `${fontSize}px Arial, sans-serif`; 
    let y = 40; const x = 40;
    for (let i = 0; i < lines.length; i++) {
        if (y + lineHeight > maxHeight + 40 && i < lines.length - 1) {
            ctx.fillText(lines[i].trim() + '...', x, y); break;
        }
        ctx.fillText(lines[i], x, y); y += lineHeight;
    }
    return new THREE.CanvasTexture(canvas);
}

// --- 4. CARICAMENTO E LOGICA CAROSELLO (Con Modellazione Reale dello spessore) ---
async function loadBooks() {
    try {
        const response = await fetch('/books.json');
        const booksData = await response.json();

        // 1. Raggruppiamo i libri per Categoria
        const categoriesMap = new Map();
        booksData.forEach(book => {
            const cat = (book.tags && book.tags.length > 0) ? book.tags[0] : 'Senza Categoria';
            if (!categoriesMap.has(cat)) categoriesMap.set(cat, []);
            categoriesMap.get(cat).push(book);
        });

        // 2. ORDINE DELLE MENSOLE (PIANO TERRA)
        // Vogliamo che "Senza Categoria" sia creata per PRIMA, così otterrà la coordinata Y più bassa (shelfIndex 0).
        // Le altre categorie verranno impilate sopra in ordine alfabetico.
        const sortedCategories = Array.from(categoriesMap.keys()).sort((a, b) => {
            if (a === 'Senza Categoria') return -1; // Sposta "Senza Categoria" all'INIZIO della lista
            if (b === 'Senza Categoria') return 1;
            return a.localeCompare(b); // Ordina le altre alfabeticamente
        });

        let shelfIndex = 0;
        let globalBookIndex = 0;
        const shelvesToLoad = [];
        let startingIndexForCarousel = 0; // Memorizzeremo qui da quale libro partire

        // Helper per caricare le texture in modo asincrono con Promise
        // Sostituiamo il TextureLoader classico con ImageBitmapLoader
        const bitmapLoader = new THREE.ImageBitmapLoader();
        bitmapLoader.setOptions({ imageOrientation: 'flipY' }); 

        const loadTextureAsync = (url) => {
            return new Promise((resolve) => {
                bitmapLoader.load(
                    url, 
                    (imageBitmap) => {
                        const texture = new THREE.Texture(imageBitmap);
                        
                        // 🚀 OTTIMIZZAZIONI ESTREME PER LA SCHEDA VIDEO:
                        
                        // 1. Spegniamo i MipMap (evita che la GPU debba ricalcolare 10 copie dell'immagine, azzerando il lag)
                        texture.generateMipmaps = false;
                        
                        // 2. Usiamo il filtro lineare: mantiene i testi delle copertine leggibili senza calcoli extra
                        texture.minFilter = THREE.LinearFilter;
                        texture.magFilter = THREE.LinearFilter;
                        
                        texture.needsUpdate = true;
                        resolve(texture);
                    }, 
                    undefined, 
                    () => {
                        console.warn(`Impossibile caricare texture: ${url}`);
                        resolve(null);
                    }
                );
            });
        };

        // 3. Creiamo le mensole e posizioniamo i placeholder 3D in un lampo
        sortedCategories.forEach(categoryName => {
            const booksInShelf = categoriesMap.get(categoryName);
            
            // Salviamo l'indice del primo libro della mensola di partenza (Senza Categoria)
            if (categoryName === 'Senza Categoria' && booksInShelf.length > 0) {
                startingIndexForCarousel = globalBookIndex;
            }

            // Essendo la prima del ciclo, "Senza Categoria" avrà shelfIndex = 0 e quindi l'altezza minima (-1.6)
            const shelfY = -1.6 + (shelfIndex * 4.2);
            
            const shelfMesh = new THREE.Mesh(shelfGeometry, shelfMaterial);
            shelfMesh.position.set(0, shelfY, -0.5);
            shelfMesh.receiveShadow = true;
            scene.add(shelfMesh);

            console.log(`Creata mensola "${categoryName}" ad altezza ${shelfY}`);

            const currentShelfMeshes = [];

            // Posizioniamo i libri sulla mensola attuale
            booksInShelf.forEach((bookData, indexInShelf) => {
                const bookWidth = 2.0;
                const bookHeight = 3.0;
                const pages = bookData.pageCount || 350;
                const bookThickness = pages * 0.001; 

                const geometry = new THREE.BoxGeometry(bookWidth, bookHeight, bookThickness);
                const spineTexture = createSpineTexture(bookData.title, bookData.author);
                const spineMaterial = new THREE.MeshStandardMaterial({ map: spineTexture, roughness: 0.7 });

                // Materiale placeholder scuro provvisorio per la copertina
                const frontCoverMaterial = baseCoverMaterial.clone();

                let materials = [pagesMaterial, spineMaterial, pagesMaterial, pagesMaterial, frontCoverMaterial, baseCoverMaterial];

                const bookMesh = new THREE.Mesh(geometry, materials);
                bookMesh.castShadow = true;
                bookMesh.receiveShadow = true;

                // Modifica anche il retro per stampare i tag personalizzati e la trama
                const planeGeo = new THREE.PlaneGeometry(bookWidth, bookHeight); 
                const planeMat = new THREE.MeshStandardMaterial({ map: createBackCoverTexture(bookData.description, bookData.tags), roughness: 0.8 });
                const backPlane = new THREE.Mesh(planeGeo, planeMat);
                backPlane.position.z = -(bookThickness / 2) - 0.001; 
                backPlane.rotation.y = Math.PI; 
                bookMesh.add(backPlane);

                const baseShelfY = shelfY + 1.6;
                bookMesh.userData = { 
                    ...bookData, 
                    index: globalBookIndex, 
                    category: categoryName,
                    indexInShelf: indexInShelf,
                    thickness: bookThickness,
                    baseShelfY: baseShelfY,
                    targetY: baseShelfY 
                };

                bookMesh.position.y = baseShelfY;

                libraryGroup.add(bookMesh);
                booksArray.push(bookMesh);
                currentShelfMeshes.push(bookMesh); 
                globalBookIndex++;
            });

            // Salviamo la coda per i download delle immagini in background
            shelvesToLoad.push({
                categoryName: categoryName,
                meshes: currentShelfMeshes
            });

            shelfIndex++;
        });

        // 4. Impostiamo il libro iniziale sulla mensola più in basso PRIMA di aggiornare la scena
        if (booksArray.length > 0) {
            currentIndex = startingIndexForCarousel;
        }
        
        // Costruiamo e mostriamo immediatamente l'ambiente 3D (così l'utente non aspetta)
        updateCarousel();

        // 5. CARICAMENTO SEQUENZIALE E ANTI-LAG DELLE COPERTINE
        const activeCategory = booksArray.length > 0 ? booksArray[currentIndex].userData.category : null;
        const activeShelf = shelvesToLoad.find(s => s.categoryName === activeCategory);
        const otherShelves = shelvesToLoad.filter(s => s.categoryName !== activeCategory);

        // A. Carica la mensola attiva velocemente (per farla vedere subito all'utente)
        const loadActiveShelfFast = async (shelf) => {
            if (!shelf) return;
            const promises = shelf.meshes.map(async (mesh) => {
                if (mesh.userData.coverPath) {
                    const tex = await loadTextureAsync(`/${mesh.userData.coverPath}`);
                    if (tex) {
                        mesh.material[4].map = tex;
                        mesh.material[4].color.setHex(0xffffff); // Ripristina i colori vividi
                        mesh.material[4].needsUpdate = true; 
                    }
                }
            });
            await Promise.all(promises);
        };

        // B. Carica le altre mensole UNO ALLA VOLTA, dal basso verso l'alto
        const loadShelfCoversOneByOne = async (shelf) => {
            if (!shelf) return;
            for (const mesh of shelf.meshes) {
                if (mesh.userData.coverPath) {
                    const tex = await loadTextureAsync(`/${mesh.userData.coverPath}`);
                    if (tex) {
                        mesh.material[4].map = tex;
                        mesh.material[4].color.setHex(0xffffff); // Ripristina i colori vividi
                        mesh.material[4].needsUpdate = true; 
                        
                        // Il trucco magico: Aspettiamo il prossimo frame prima di caricare il libro successivo.
                        // Questo evita di intasare la scheda video e azzera i lag di scorrimento verso l'alto!
                        await new Promise(resolve => requestAnimationFrame(resolve));
                    }
                }
            }
        };

        // Esecuzione invisibile in background
        (async () => {
            if (activeShelf) {
                await loadActiveShelfFast(activeShelf);
                console.log(`✅ Texture mensola attiva (${activeCategory}) caricate.`);
            }
            
            // "otherShelves" è già ordinato dal basso verso l'alto (grazie a sortedCategories)
            // Li processiamo uno ad uno silenziosamente mentre l'utente naviga
            for (const shelf of otherShelves) {
                await loadShelfCoversOneByOne(shelf);
            }
            console.log(`🎉 Tutte le texture sono state caricate in background senza lag!`);
        })();

    } catch (e) { console.error(e); }
}

function updateCarousel() {
    if (booksArray.length === 0) return;
    
    const activeBook = booksArray[currentIndex];
    const activeCategory = activeBook.userData.category;

    categoryLabel.style.display = 'block'; 
    manageCatBtn.style.display = 'block'; // Mostriamo anche il bottoncino
    categoryLabel.innerText = `📁 ${activeCategory.toUpperCase()}`;

    // SPOSTA LA TELECAMERA sull'asse Y della mensola attiva
    targetCameraY = activeBook.userData.baseShelfY;

    // Filtriamo i libri che si trovano sulla STESSA mensola del libro attivo
    const booksOnActiveShelf = booksArray.filter(b => b.userData.category === activeCategory);
    
    // Filtriamo i libri che NON sono su questa mensola
    const booksOnOtherShelves = booksArray.filter(b => b.userData.category !== activeCategory);

    // 1. GESTIONE DELLA MENSOLA ATTIVA (Apre il buco al centro)
    const centerGap = 1.6; 
    const margin = 0.08; 

    // Posizioniamo il libro centrale
    activeBook.userData.targetX = 0;
    activeBook.userData.targetZ = 0.5;
    activeBook.userData.targetRotY = isShowingBack ? Math.PI : 0;

    // Impiliamo i libri verso DESTRA sulla mensola attiva
    let currentXRight = centerGap;
    for (let i = activeBook.userData.indexInShelf + 1; i < booksOnActiveShelf.length; i++) {
        let book = booksOnActiveShelf[i];
        book.userData.targetX = currentXRight + (book.userData.thickness / 2);
        book.userData.targetZ = -1.5;
        book.userData.targetRotY = Math.PI / 2; 
        currentXRight += book.userData.thickness + margin;
    }

    // Impiliamo i libri verso SINISTRA sulla mensola attiva
    let currentXLeft = -centerGap;
    for (let i = activeBook.userData.indexInShelf - 1; i >= 0; i--) {
        let book = booksOnActiveShelf[i];
        book.userData.targetX = currentXLeft - (book.userData.thickness / 2);
        book.userData.targetZ = -1.5;
        book.userData.targetRotY = Math.PI / 2; 
        currentXLeft -= (book.userData.thickness + margin);
    }

    // 2. GESTIONE DELLE ALTRE MENSOLE (Libri compatti e messi via)
    // Raggruppiamo gli altri libri per categoria
    const otherCategories = [...new Set(booksOnOtherShelves.map(b => b.userData.category))];
    
    otherCategories.forEach(cat => {
        const shelfBooks = booksOnOtherShelves.filter(b => b.userData.category === cat);
        // Calcoliamo la larghezza totale per centrarli
        const totalWidth = shelfBooks.reduce((sum, b) => sum + b.userData.thickness + margin, 0);
        
        let startX = -(totalWidth / 2); // Partiamo da sinistra per centrarli sulla mensola
        shelfBooks.forEach(book => {
            book.userData.targetX = startX + (book.userData.thickness / 2);
            book.userData.targetZ = -1.5;
            book.userData.targetRotY = Math.PI / 2;
            startX += book.userData.thickness + margin;
        });
    });
}

// --- 5. INTERAZIONI UNIFICATE (Click, Swipe, Trackpad) ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Variabili per riconoscere lo swipe (trascinamento)
let pointerStartX = 0;
let pointerStartY = 0; // Tracciamo anche la Y
let pointerEndX = 0;
let pointerEndY = 0;   // Tracciamo anche la Y
let isDragging = false;

window.addEventListener('pointerdown', (event) => {
    if (helpModal && helpModal.style.display === 'flex') return;
    if (document.getElementById('category-manager-overlay')) return;
    if (document.getElementById('assign-category-overlay')) return;
    if (event.target.tagName === 'BUTTON' || event.target.tagName === 'INPUT' || event.target.tagName === 'LABEL') return;
    
    pointerStartX = event.clientX;
    pointerStartY = event.clientY;
    isDragging = true;
});

window.addEventListener('pointerup', (event) => {
    if (helpModal && helpModal.style.display === 'flex') return;
    if (document.getElementById('category-manager-overlay')) return;
    if (document.getElementById('assign-category-overlay')) return;
    if (!isDragging) return;
    isDragging = false;
    pointerEndX = event.clientX;
    pointerEndY = event.clientY;
    
    // Calcoliamo lo spostamento su entrambi gli assi
    const deltaX = pointerStartX - pointerEndX;
    const deltaY = pointerStartY - pointerEndY;

    // 1. SWIPE ORIZZONTALE (Cambio Libro)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0) changeBook(1); 
        else changeBook(-1);           
    } 
    // 2. SWIPE VERTICALE (Cambio Mensola)
    else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 50) {
        if (deltaY > 0) changeShelf(-1); // Swipe in Su -> Guarda la mensola sotto
        else changeShelf(1);             // Swipe in Giù -> Guarda la mensola sopra
    } 
    // 2. È UN CLICK PURO? (Nessuno spostamento reale, o piccolissimo tremolio del dito)
    else if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(libraryGroup.children, true);

        if (intersects.length > 0) {
            let obj = intersects[0].object;
            while (obj.parent !== libraryGroup) obj = obj.parent;
            
            const clickedIndex = obj.userData.index;

            if (clickedIndex !== currentIndex) {
                currentIndex = clickedIndex;
                isShowingBack = false;
                infoBtn.innerText = 'Mostra Trama';
                updateCarousel();
            } else {
                // APERTURA DEL LIBRO
                const activeBook = booksArray[currentIndex];
                activeBook.userData.targetZ = 2.8; 
                activeBook.userData.targetRotY = 0; 
                
                if (!activeBook.userData.hasHinge) {
                    const coverGeo = new THREE.PlaneGeometry(2.0, 3.0);
                    const coverMat = activeBook.material[4]; 
                    const hinge = new THREE.Group();
                    hinge.position.set(-1.0, 0, activeBook.userData.thickness / 2 + 0.002);
                    const movingCover = new THREE.Mesh(coverGeo, coverMat);
                    movingCover.position.set(1.0, 0, 0);
                    hinge.add(movingCover);
                    activeBook.add(hinge);
                    activeBook.userData.hinge = hinge;
                    activeBook.userData.hasHinge = true;
                    activeBook.material[4] = new THREE.MeshStandardMaterial({ color: 0xf5f5dc, roughness: 0.9 });
                }

                document.querySelector('.top-bar').style.opacity = '0';
                uiContainer.style.opacity = '0';
                leftArrow.style.opacity = '0';
                rightArrow.style.opacity = '0';
                
                activeBook.userData.hinge.userData = { targetRotY: -Math.PI * 0.85 };

                setTimeout(() => {
                    window.openReader(activeBook.userData.epubPath, activeBook.userData.id);
                }, 400); 
            }
        }
    }
    // NOTA: Se è uno swipe puramente verticale (deltaY > deltaX), il codice ora non farà assolutamente nulla!
});

// Aggiungiamo il supporto alla ROTELLINA DEL MOUSE e al TRACKPAD
let scrollTimeout = null; 
window.addEventListener('wheel', (event) => {
    if (document.getElementById('category-manager-overlay')) return;
    if (document.getElementById('assign-category-overlay')) return;
    if (helpModal && helpModal.style.display === 'flex') return;
    if (scrollTimeout) return;

    if (Math.abs(event.deltaX) > Math.abs(event.deltaY) && Math.abs(event.deltaX) > 20) {
        if (event.deltaX > 0) changeBook(1); 
        else changeBook(-1); 
        scrollTimeout = setTimeout(() => { scrollTimeout = null; }, 300);
    } 
    else if (Math.abs(event.deltaY) > Math.abs(event.deltaX) && Math.abs(event.deltaY) > 20) {
        if (event.deltaY > 0) changeShelf(-1); // Rotellina giù -> Guarda mensola sotto
        else changeShelf(1);                   // Rotellina su -> Guarda mensola sopra
        scrollTimeout = setTimeout(() => { scrollTimeout = null; }, 500); // Pausa più lunga per non far schizzare le mensole
    }
});

// --- 8. NAVIGAZIONE CON TASTIERA (Frecce Direzionali) ---
window.addEventListener('keydown', (event) => {
    if (document.activeElement.tagName === 'INPUT') return;
    const readerOverlay = document.getElementById('reader-overlay');
    if (readerOverlay && readerOverlay.style.display === 'block') return;

    if (document.getElementById('category-manager-overlay')) return;
    if (document.getElementById('assign-category-overlay')) return;
    if (helpModal && helpModal.style.display === 'flex') return;

    if (event.key === 'ArrowRight') {
        changeBook(1); 
    } else if (event.key === 'ArrowLeft') {
        changeBook(-1); 
    } else if (event.key === 'ArrowUp') {
        changeShelf(1); // Freccia su -> Sali di un piano
    } else if (event.key === 'ArrowDown') {
        changeShelf(-1); // Freccia giù -> Scendi di un piano
    } 
    else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault(); 
        if (booksArray.length > 0) {
            if (!isShowingBack) {
                infoBtn.click();
            } else {
                const activeBook = booksArray[currentIndex];
                if (activeBook && activeBook.userData.epubPath) {
                    window.openReader(activeBook.userData.epubPath, activeBook.userData.id);
                }
            }
        }
    }
});

// Quando il lettore viene chiuso, ripristiniamo la vista 3D
window.addEventListener('readerClosed', () => {
    // Rendi l'interfaccia 3D visibile
    document.querySelector('.top-bar').style.opacity = '1';
    uiContainer.style.opacity = '1';
    leftArrow.style.opacity = '1';
    rightArrow.style.opacity = '1';
    
    const activeBook = booksArray[currentIndex];
    if (activeBook && activeBook.userData.hasHinge) {
        activeBook.userData.hinge.userData.targetRotY = 0; 
    }

    // Rimetti il libro al suo posto nel carosello
    updateCarousel(); 
});

// ESEGUIAMO IL CARICAMENTO DEI LIBRI ALL'AVVIO!
loadBooks();

// --- 7. LOGICA PANNELLO HELP ---
const helpBtn = document.getElementById('help-btn');
const helpModal = document.getElementById('help-modal');
const closeHelpBtn = document.getElementById('close-help-btn');

// Apri il modale
if (helpBtn) {
    helpBtn.addEventListener('click', () => {
        helpModal.style.display = 'flex';
        // Aspettiamo un istante minuscolo per far partire l'animazione CSS
        setTimeout(() => helpModal.style.opacity = '1', 10);
    });
}

// Funzione unificata per chiudere il modale
const closeHelp = () => {
    helpModal.style.opacity = '0';
    setTimeout(() => helpModal.style.display = 'none', 300); // Aspetta la fine della dissolvenza
};

// Chiudi col bottone "Ho capito"
if (closeHelpBtn) {
    closeHelpBtn.addEventListener('click', closeHelp);
}

// Chiudi cliccando fuori dal pannello (sul nero sfumato)
if (helpModal) {
    helpModal.addEventListener('click', (event) => {
        if (event.target === helpModal) {
            closeHelp();
        }
    });
}

// --- 6. ANIMAZIONE ---
function animate() {
    requestAnimationFrame(animate);
    
    // Movimento fluido della telecamera in verticale verso la mensola attiva
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCameraY, 0.05);
    // Spostiamo anche la luce per mantenere le ombre perfette!
    directionalLight.position.y = camera.position.y + 10;
    
    booksArray.forEach(book => {
        if (book.userData.targetX !== undefined) {
            book.position.x = THREE.MathUtils.lerp(book.position.x, book.userData.targetX, 0.1);
            // NUOVO: interpolazione asse Y (utile se i libri "saltano" di piano, anche se ora partono già dal loro piano)
            book.position.y = THREE.MathUtils.lerp(book.position.y, book.userData.targetY, 0.1);
            book.position.z = THREE.MathUtils.lerp(book.position.z, book.userData.targetZ, 0.1);
            book.rotation.y = THREE.MathUtils.lerp(book.rotation.y, book.userData.targetRotY, 0.1);
        }
        if (book.userData.hasHinge && book.userData.hinge.userData.targetRotY !== undefined) {
            book.userData.hinge.rotation.y = THREE.MathUtils.lerp(book.userData.hinge.rotation.y, book.userData.hinge.userData.targetRotY, 0.08);
        }
    });

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();