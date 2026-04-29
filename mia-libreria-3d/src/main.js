import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// --- 1. SETUP BASE ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 5); 

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- 2. ILLUMINAZIONE ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
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

// --- 3. GENERATORI DI TEXTURE ---

// Dorso
function createSpineTexture(title, author) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;  
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = baseCoverColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(Math.PI / 2); 

    ctx.fillStyle = '#ffffff'; 
    ctx.font = 'bold 40px Arial, sans-serif';
    ctx.fillText(title, 0, -15);

    ctx.fillStyle = '#cccccc'; 
    ctx.font = 'italic 30px Arial, sans-serif';
    ctx.fillText(author, 0, 30); 

    return new THREE.CanvasTexture(canvas);
}

// Quarta di Copertina: NIENTE PIÙ INVERSIONI, TESTO DRITTO E NORMALE!
// Quarta di Copertina: ALGORITMO AUTO-FIT INTELLIGENTE
function createBackCoverTexture(description) {
    const canvas = document.createElement('canvas');
    // Usiamo una risoluzione alta con proporzione 2:3 (esattamente come il BoxGeometry 2x3)
    canvas.width = 512; 
    canvas.height = 768;
    const ctx = canvas.getContext('2d');

    // 1. Sfondo
    ctx.fillStyle = baseCoverColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Impostazioni base
    ctx.fillStyle = '#dddddd'; 
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const words = description.split(' ');
    const maxWidth = 432;  // 40px di margine per lato (512 - 80)
    const maxHeight = 688; // 40px di margine sopra e sotto (768 - 80)

    let fontSize = 28; // Partiamo da un font bello grande
    let lineHeight;
    let lines = [];

    // --- 3. IL CICLO MAGICO DI ADATTAMENTO ---
    // Rimpicciolisce il font di 2px alla volta finché non entra tutto
    while (fontSize >= 14) { 
        ctx.font = `${fontSize}px Arial, sans-serif`;
        lineHeight = fontSize * 1.5; // L'interlinea è il 150% della grandezza del font
        lines = [];
        let line = '';

        // Creiamo le righe provvisorie per misurare l'altezza totale
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && n > 0) {
                lines.push(line);
                line = words[n] + ' ';
            } else {
                line = testLine;
            }
        }
        lines.push(line); // Aggiungi l'ultima riga

        const totalHeight = lines.length * lineHeight;

        if (totalHeight <= maxHeight) {
            break; // Vittoria! Il testo entra, fermiamo il ciclo.
        }

        fontSize -= 2; // Se sfora, riduci il font e ripeti il ciclo
    }

    // --- 4. STAMPA REALE SUL CANVAS ---
    ctx.font = `${fontSize}px Arial, sans-serif`; // Reimpostiamo il font vincente
    let y = 40; // Margine superiore
    const x = 40; // Margine sinistro

    for (let i = 0; i < lines.length; i++) {
        // Blocco di sicurezza: se la trama è un'enciclopedia e sfora anche col font minimo, tronchiamo con i puntini.
        if (y + lineHeight > maxHeight + 40 && i < lines.length - 1) {
            let lastLine = lines[i].trim();
            ctx.fillText(lastLine + '...', x, y);
            break;
        }
        ctx.fillText(lines[i], x, y);
        y += lineHeight;
    }

    return new THREE.CanvasTexture(canvas);
}
// --- 4. CARICAMENTO E GENERAZIONE LIBRI ---

async function loadBooks() {
    try {
        const response = await fetch('/books.json');
        const booksData = await response.json();

        booksData.forEach((bookData, index) => {
            // IL LIBRO BASE (Senza trama sul retro)
            const geometry = new THREE.BoxGeometry(2, 3, 0.4);
            const spineTexture = createSpineTexture(bookData.title, bookData.author);
            const spineMaterial = new THREE.MeshStandardMaterial({ map: spineTexture, roughness: 0.7 });

            let materials = [
                pagesMaterial,      // 0: Destra
                spineMaterial,      // 1: Sinistra (Dorso)
                pagesMaterial,      // 2: Sopra
                pagesMaterial,      // 3: Sotto
                baseCoverMaterial,  // 4: Fronte (temporaneo)
                baseCoverMaterial   // 5: Retro (SOLO COLORE SCURO, NIENTE TESTO)
            ];

            if (bookData.coverPath) {
                const coverTexture = textureLoader.load(`/${bookData.coverPath}`);
                materials[4] = new THREE.MeshStandardMaterial({ map: coverTexture, roughness: 0.8 });
            }

            const bookMesh = new THREE.Mesh(geometry, materials);
            bookMesh.position.x = index * 2.2; 
            bookMesh.userData = bookData;

            // --- LA SOLUZIONE: IL "PIANO ADESIVO" PER LA TRAMA ---
            const backTexture = createBackCoverTexture(bookData.description);
            // Creiamo un foglio piatto grande quanto il libro (larghezza 2, altezza 3)
            const planeGeo = new THREE.PlaneGeometry(2, 3); 
            const planeMat = new THREE.MeshStandardMaterial({ map: backTexture, roughness: 0.8 });
            const backPlane = new THREE.Mesh(planeGeo, planeMat);

            // Lo posizioniamo esattamente dietro al libro (-0.2 è il bordo del libro, -0.201 lo fa sporgere di un capello per essere visibile)
            backPlane.position.z = -0.201; 
            // Lo giriamo di 180 gradi così guarda in fuori e il testo è dritto
            backPlane.rotation.y = Math.PI; 

            // Incolliamo l'adesivo al libro
            bookMesh.add(backPlane);
            // ---------------------------------------------------

            libraryGroup.add(bookMesh);
        });

    } catch (error) {
        console.error("Errore nel caricamento dei libri:", error);
    }
}

loadBooks();

// --- 5. CONTROLLI E ANIMAZIONE ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();