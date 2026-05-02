import { thickness } from 'three/src/nodes/core/PropertyNode.js';
import './style.css';
import * as THREE from 'three';

// --- 1. SETUP BASE ---
const scene = new THREE.Scene();

// Diamo un colore alla scena (la "parete" dietro la libreria)
// Puoi cambiare questo codice esadecimale con il colore che preferisci!
scene.background = new THREE.Color('#2c3e50'); 

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, -0.2, 3.5); 

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

const libraryGroup = new THREE.Group();
scene.add(libraryGroup);


const pagesMaterial = new THREE.MeshStandardMaterial({ color: 0xf5f5dc });
const baseCoverColor = '#1a1a1a';
const baseCoverMaterial = new THREE.MeshStandardMaterial({ color: baseCoverColor });

// Variabili di stato
let booksArray = [];
let currentIndex = 0;
let isShowingBack = false;

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
document.body.appendChild(topBar);

const searchInput = document.createElement('input');
searchInput.type = 'text';
searchInput.placeholder = 'Cerca per titolo o autore...';
searchInput.className = 'glass-effect modern-input';
topBar.appendChild(searchInput);

const uploadLabel = document.createElement('label');
uploadLabel.innerText = '+ Carica Ebook';
uploadLabel.className = 'glass-effect modern-btn';
uploadLabel.htmlFor = 'file-upload';
topBar.appendChild(uploadLabel);

const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.id = 'file-upload';
fileInput.accept = '.epub';
topBar.appendChild(fileInput);

// --- COSTRUZIONE BOTTONE INFERIORE ---
const uiContainer = document.createElement('div');
uiContainer.style.position = 'absolute';
uiContainer.style.bottom = '40px';
uiContainer.style.left = '50%';
uiContainer.style.transform = 'translateX(-50%)';
document.body.appendChild(uiContainer);

const infoBtn = document.createElement('button');
infoBtn.innerText = 'Mostra Trama';
infoBtn.className = 'glass-effect modern-btn';
uiContainer.appendChild(infoBtn);

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
    const foundIndex = booksArray.findIndex(book => 
        book.userData.title.toLowerCase().includes(query) || 
        book.userData.author.toLowerCase().includes(query)
    );

    if (foundIndex !== -1 && foundIndex !== currentIndex) {
        currentIndex = foundIndex;
        isShowingBack = false;
        infoBtn.innerText = 'Mostra Trama';
        updateCarousel();
    }
});

// Avviso per l'upload
fileInput.addEventListener('change', async (e) => {
    if (e.target.files.length > 0) {
        const file = e.target.files[0];
        
        // Creiamo un pacchetto dati (FormData) per spedire il file via HTTP
        const formData = new FormData();
        formData.append('ebook', file);

        // Cambiamo il testo del bottone per dare feedback all'utente
        const originalText = uploadLabel.innerText;
        uploadLabel.innerText = 'Caricamento... ⏳';
        uploadLabel.style.pointerEvents = 'none'; // Blocchiamo i click multipli

        try {
            // Spediamo il file al nostro nuovo backend Node.js
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                // Il server ha finito di elaborare l'EPUB e ha aggiornato books.json
                alert('Libro aggiunto con successo allo scaffale! Ricarico la libreria...');
                // Ricarichiamo la pagina per fargli scaricare il nuovo books.json e far spawnare il libro
                location.reload(); 
            } else {
                alert('Errore dal server: ' + result.message);
            }
        } catch (error) {
            console.error('Errore di rete:', error);
            alert("Impossibile contattare il server. Hai avviato server.js?");
        } finally {
            // Ripristiniamo il bottone
            uploadLabel.innerText = originalText;
            uploadLabel.style.pointerEvents = 'auto';
            fileInput.value = ''; // Resettiamo l'input
        }
    }
});
// --- 3. GENERATORI DI TEXTURE ---
function createSpineTexture(title, author) {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = baseCoverColor; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.translate(canvas.width / 2, canvas.height / 2); ctx.rotate(Math.PI / 2); 
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 40px Arial, sans-serif'; ctx.fillText(title, 0, -15);
    ctx.fillStyle = '#cccccc'; ctx.font = 'italic 30px Arial, sans-serif'; ctx.fillText(author, 0, 30); 
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

// --- 4. CARICAMENTO E LOGICA CAROSELLO ---
// --- 4. CARICAMENTO E LOGICA CAROSELLO (Con Modellazione Reale dello spessore) ---
async function loadBooks() {
    try {
        const response = await fetch('/books.json');
        const booksData = await response.json();

        booksData.forEach((bookData, index) => {
            // --- DIMENSIONI REALI ---
            // Larghezza e Altezza Standard (per garantire che le copertine si mappino perfettamente)
            // Se li cambiassimo a caso come prima, le immagini della copertina si distorcerebbero.
            const bookWidth = 2.0;
            const bookHeight = 3.0;

            // --- SPESSORE REALE BASATO SULLE PAGINE ---
            // Recuperiamo il pageCount ( fallback a 350 se il dato manca nel JSON per vecchi libri)
            const pages = bookData.pageCount || 350;
            
            // Formula matematica di modellazione fisica:
            // Ipotizziamo uno spessore standard della carta editoriale (circa 0.1mm per foglio, 
            // quindi 0.05mm per pagina visto che è stampata fronte/retro).
            // Nelle nostre unità Three.js, un fattore di 0.001 per pagina funziona perfettamente:
            // 100 pagine = 0.1 unità di spessore
            // 350 pagine (standard) = 0.35 unità di spessore
            // 1000 pagine (mattone) = 1.0 unità di spessore
            const bookThickness = pages * 0.001; 
            
            console.log(`Creazione 3D: "${bookData.title}" -> Pagine: ${pages}, Spessore calcolato: ${bookThickness.toFixed(3)} unità.`);

            // Creiamo la geometria esatta
            const geometry = new THREE.BoxGeometry(bookWidth, bookHeight, bookThickness);
            
            const spineTexture = createSpineTexture(bookData.title, bookData.author);
            const spineMaterial = new THREE.MeshStandardMaterial({ map: spineTexture, roughness: 0.7 });

            let materials = [
                pagesMaterial, spineMaterial, pagesMaterial, pagesMaterial, baseCoverMaterial, baseCoverMaterial
            ];

            if (bookData.coverPath) {
                materials[4] = new THREE.MeshStandardMaterial({ map: textureLoader.load(`/${bookData.coverPath}`), roughness: 0.8 });
            }

            const bookMesh = new THREE.Mesh(geometry, materials);
            bookMesh.castShadow = true; // IL LIBRO GETTA L'OMBRA
            bookMesh.receiveShadow = true;

            // Adattiamo il piano posteriore della trama alle nuove misure!
            const planeGeo = new THREE.PlaneGeometry(bookWidth, bookHeight); 
            const planeMat = new THREE.MeshStandardMaterial({ map: createBackCoverTexture(bookData.description), roughness: 0.8 });
            const backPlane = new THREE.Mesh(planeGeo, planeMat);
            
            // Posizioniamo il retro esattamente dietro al cubo: metà dello spessore + un millimetro di sicurezza
            backPlane.position.z = -(bookThickness / 2) - 0.001; 
            backPlane.rotation.y = Math.PI; 
            bookMesh.add(backPlane);

            bookMesh.userData = { ...bookData, index: index , thickness: bookThickness };
            libraryGroup.add(bookMesh);
            booksArray.push(bookMesh);
        });

        // NOTA SULLA SPAZIATURA: La spaziatura laterale a 0.75 che abbiamo impostato precedentemente
        // è sufficiente per contenere anche libri molto spessi (fino a 700-800 pagine) senza che si tocchino.
        updateCarousel();
    } catch (e) { console.error(e); }
}

function updateCarousel() {
    // 1. Posizioniamo il libro centrale
    if (booksArray[currentIndex]) {
        const centerBook = booksArray[currentIndex];
        centerBook.userData.targetX = 0;
        centerBook.userData.targetZ = 0.5;
        centerBook.userData.targetRotY = isShowingBack ? Math.PI : 0;
    }

    const centerGap = 1.6; 
    const margin = 0.08; 

    // 2. Impiliamo i libri verso DESTRA
    let currentXRight = centerGap;
    for (let i = currentIndex + 1; i < booksArray.length; i++) {
        let book = booksArray[i];
        
        book.userData.targetX = currentXRight + (book.userData.thickness / 2);
        book.userData.targetZ = -1.5;
        // Mantiene il dorso frontale
        book.userData.targetRotY = Math.PI / 2; 
        
        currentXRight += book.userData.thickness + margin;
    }

    // 3. Impiliamo i libri verso SINISTRA
    let currentXLeft = -centerGap;
    for (let i = currentIndex - 1; i >= 0; i--) {
        let book = booksArray[i];
        
        book.userData.targetX = currentXLeft - (book.userData.thickness / 2);
        book.userData.targetZ = -1.5;
        
        // LA CORREZIONE È QUI: Anche a sinistra la rotazione DEVE essere negativa!
        // Se la metti positiva, ci mostrerà il lato destro del libro (le pagine).
        book.userData.targetRotY = Math.PI / 2; 
        
        currentXLeft -= (book.userData.thickness + margin);
    }
}

// --- 5. INTERAZIONI UNIFICATE (Click, Swipe, Trackpad) ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Variabili per riconoscere lo swipe (trascinamento)
let pointerStartX = 0;
let pointerEndX = 0;
let isDragging = false;

window.addEventListener('pointerdown', (event) => {
    // Ignora le interazioni se l'utente sta cliccando la UI (bottoni, barra di ricerca)
    if (event.target.tagName === 'BUTTON' || event.target.tagName === 'INPUT' || event.target.tagName === 'LABEL') return;
    
    pointerStartX = event.clientX;
    isDragging = true;
});

window.addEventListener('pointerup', (event) => {
    if (!isDragging) return;
    isDragging = false;
    pointerEndX = event.clientX;
    
    // Calcoliamo di quanti pixel si è spostato il mouse/dito
    const deltaX = pointerStartX - pointerEndX;

    // Se si è mosso di più di 50 pixel, è chiaramente uno SWIPE (trascinamento)
    if (Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
            changeBook(1); // Swipe verso sinistra -> scorre in avanti
        } else {
            changeBook(-1); // Swipe verso destra -> scorre indietro
        }
    } 
    // Altrimenti, se non si è mosso (o si è mosso pochissimo), è un CLICK su un libro
    else {
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
            }else {
                // LA MAGIA: Se clicchi il libro già al centro... APRIAMOLO!
                const activeBook = booksArray[currentIndex];
                
                // Animazione: Portiamo il libro dritto in faccia alla telecamera
                activeBook.userData.targetZ = 2.8; // Molto vicino alla telecamera (che è a Z=3.5)
                activeBook.userData.targetRotY = 0; // Piatto e dritto
                
                if (!activeBook.userData.hasHinge) {
                    const coverGeo = new THREE.PlaneGeometry(2.0, 3.0);
                    const coverMat = activeBook.material[4]; // Copiamo la texture della copertina attuale

                    // Creiamo un gruppo che farà da "cerniera" posizionato sul lato sinistro del libro
                    const hinge = new THREE.Group();
                    hinge.position.set(-1.0, 0, activeBook.userData.thickness / 2 + 0.002);

                    // Creiamo il foglio della copertina e lo spostiamo a destra per bilanciare la cerniera
                    const movingCover = new THREE.Mesh(coverGeo, coverMat);
                    movingCover.position.set(1.0, 0, 0);
                    hinge.add(movingCover);

                    activeBook.add(hinge);
                    activeBook.userData.hinge = hinge;
                    activeBook.userData.hasHinge = true;

                    // Cancelliamo la copertina stampata sul "mattone" e mettiamo una pagina bianca!
                    activeBook.material[4] = new THREE.MeshStandardMaterial({ color: 0xf5f5dc, roughness: 0.9 });
                }

                // Nascondiamo l'interfaccia 3D
                document.querySelector('.top-bar').style.opacity = '0';
                uiContainer.style.opacity = '0';
                leftArrow.style.opacity = '0';
                rightArrow.style.opacity = '0';
                
                activeBook.userData.hinge.userData = { targetRotY: -Math.PI * 0.85 };

                // Aspettiamo mezza frazione di secondo che l'animazione 3D parta, poi avviamo il lettore 2D
                setTimeout(() => {
                    window.openReader(activeBook.userData.epubPath, activeBook.userData.id);
                }, 400); 
            }
        }
    }
});

// Aggiungiamo il supporto alla ROTELLINA DEL MOUSE e al TRACKPAD
let scrollTimeout = null; // Ci serve per non far schizzare i libri a mille all'ora
window.addEventListener('wheel', (event) => {
    if (scrollTimeout) return; // Se stiamo già scorrendo, ignora l'input

    // event.deltaY cattura la rotellina classica, event.deltaX cattura lo swipe orizzontale del trackpad
    if (Math.abs(event.deltaX) > 20 || Math.abs(event.deltaY) > 20) {
        if (event.deltaX > 0 || event.deltaY > 0) {
            changeBook(1); // Scorre avanti
        } else {
            changeBook(-1); // Scorre indietro
        }
        
        // Imposta una "pausa" di 300 millisecondi prima di poter scorrere di nuovo
        scrollTimeout = setTimeout(() => { scrollTimeout = null; }, 300);
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
    
    booksArray.forEach(book => {
        if (book.userData.targetX !== undefined) {
            book.position.x = THREE.MathUtils.lerp(book.position.x, book.userData.targetX, 0.1);
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