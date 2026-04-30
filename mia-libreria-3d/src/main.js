import './style.css';
import * as THREE from 'three';

// --- 1. SETUP BASE ---
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, -0.2, 3.5); 

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);

const textureLoader = new THREE.TextureLoader();
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
async function loadBooks() {
    try {
        const response = await fetch('/books.json');
        const booksData = await response.json();

        booksData.forEach((bookData, index) => {
            const geometry = new THREE.BoxGeometry(2, 3, 0.4);
            const spineTexture = createSpineTexture(bookData.title, bookData.author);
            const spineMaterial = new THREE.MeshStandardMaterial({ map: spineTexture, roughness: 0.7 });

            let materials = [
                pagesMaterial, spineMaterial, pagesMaterial, pagesMaterial, baseCoverMaterial, baseCoverMaterial
            ];

            if (bookData.coverPath) {
                materials[4] = new THREE.MeshStandardMaterial({ map: textureLoader.load(`/${bookData.coverPath}`), roughness: 0.8 });
            }

            const bookMesh = new THREE.Mesh(geometry, materials);
            
            const planeGeo = new THREE.PlaneGeometry(2, 3); 
            const planeMat = new THREE.MeshStandardMaterial({ map: createBackCoverTexture(bookData.description), roughness: 0.8 });
            const backPlane = new THREE.Mesh(planeGeo, planeMat);
            backPlane.position.z = -0.201; backPlane.rotation.y = Math.PI; 
            bookMesh.add(backPlane);

            bookMesh.userData = { ...bookData, index: index };
            libraryGroup.add(bookMesh);
            booksArray.push(bookMesh);
        });

        updateCarousel();
    } catch (e) { console.error(e); }
}

function updateCarousel() {
    booksArray.forEach((book, i) => {
        const offset = i - currentIndex;

        if (offset === 0) {
            book.userData.targetX = 0;
            book.userData.targetZ = 0.5;
            book.userData.targetRotY = isShowingBack ? Math.PI : 0;
        } else {
            const direction = Math.sign(offset);
            book.userData.targetRotY = Math.PI / 2; // Il dorso è a sinistra, quindi rotazione di -90 gradi!
            book.userData.targetZ = -1.5;
            book.userData.targetX = (direction * 1.8) + (offset * 0.45);
        }
    });
}

// --- 5. INTERAZIONE CLICK SUI LIBRI ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
    // Ignora i click sull'interfaccia HTML
    if (event.target.tagName === 'BUTTON' || event.target.tagName === 'INPUT' || event.target.tagName === 'LABEL') return;

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
        }
    }
});

loadBooks();

// --- 6. ANIMAZIONE ---
function animate() {
    requestAnimationFrame(animate);
    
    booksArray.forEach(book => {
        if (book.userData.targetX !== undefined) {
            book.position.x = THREE.MathUtils.lerp(book.position.x, book.userData.targetX, 0.1);
            book.position.z = THREE.MathUtils.lerp(book.position.z, book.userData.targetZ, 0.1);
            book.rotation.y = THREE.MathUtils.lerp(book.rotation.y, book.userData.targetRotY, 0.1);
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