import './style.css';
import * as THREE from 'three';

// --- 1. SETUP BASE ---
const scene = new THREE.Scene();

// 1. TELECAMERA ABBASSATA: Y passa da 0.5 a -0.2 per inquadrare i libri leggermente dal basso
// e lasciare spazio al bottone nella parte inferiore dello schermo.
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

// --- 2. STILI CSS MODERNI E UI ---
// Aggiungiamo un blocco di stili per il bottone (Glassmorphism e animazioni)
const styleStyle = document.createElement('style');
styleStyle.innerHTML = `
    .modern-btn {
        padding: 12px 30px;
        font-family: 'Segoe UI', system-ui, sans-serif;
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 2px;
        text-transform: uppercase;
        color: #ffffff;
        background: rgba(255, 255, 255, 0.08); /* Sfondo semitrasparente */
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 50px; /* Forma a pillola */
        backdrop-filter: blur(10px); /* Effetto vetro satinato */
        -webkit-backdrop-filter: blur(10px);
        cursor: pointer;
        transition: all 0.3s ease;
        outline: none;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .modern-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.5);
        transform: translateY(-3px); /* Si alza leggermente */
        box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
    }
    .modern-btn:active {
        transform: translateY(0px); /* Torna giù al click */
    }
`;
document.head.appendChild(styleStyle);

const uiContainer = document.createElement('div');
uiContainer.style.position = 'absolute';
uiContainer.style.bottom = '40px'; // Alzato un po' dal fondo
uiContainer.style.left = '50%';
uiContainer.style.transform = 'translateX(-50%)';
uiContainer.style.display = 'flex';
uiContainer.style.gap = '20px';
document.body.appendChild(uiContainer);

const infoBtn = document.createElement('button');
infoBtn.innerText = 'Mostra Trama';
infoBtn.className = 'modern-btn'; // Applichiamo la classe minimalista
uiContainer.appendChild(infoBtn);

infoBtn.onclick = () => {
    isShowingBack = !isShowingBack;
    infoBtn.innerText = isShowingBack ? 'Mostra Copertina' : 'Mostra Trama';
    updateCarousel();
};

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
            book.userData.targetX = (direction * 1.8) + (offset * 0.6);
            book.userData.targetZ = -1.5;
            book.userData.targetRotY = Math.PI / 2;
        }
    });
}

// --- 5. INTERAZIONE CLICK ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
    if (event.target.tagName === 'BUTTON') return;

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