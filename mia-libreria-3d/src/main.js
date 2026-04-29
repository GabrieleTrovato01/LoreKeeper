import './style.css'; // Importa il CSS
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; // Nota: in npm il percorso cambia leggermente rispetto al CDN!

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

// Creiamo un gruppo per contenere tutti i libri (utile per organizzarli in futuro)
const libraryGroup = new THREE.Group();
scene.add(libraryGroup);

// Materiali base riutilizzabili
const pagesMaterial = new THREE.MeshStandardMaterial({ color: 0xf5f5dc }); // Beige per le pagine
const backCoverMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 }); // Grigio scuro per dorso e retro

// Funzione asincrona per caricare il JSON e generare i libri
async function loadBooks() {
    try {
        // Chiediamo al browser di caricare il file JSON appena creato
        const response = await fetch('/books.json');
        const booksData = await response.json();

        // Cicliamo su ogni libro trovato
        booksData.forEach((bookData, index) => {
            // Geometria del libro
            const geometry = new THREE.BoxGeometry(2, 3, 0.4);
            
            // Array di materiali di default (se non c'è copertina, sarà tutto grigio)
            let materials = [
                pagesMaterial,      // Destra (pagine)
                backCoverMaterial,  // Sinistra (dorso)
                pagesMaterial,      // Sopra (pagine)
                pagesMaterial,      // Sotto (pagine)
                backCoverMaterial,  // Fronte (copertina)
                backCoverMaterial   // Retro
            ];

            // Se il libro ha una copertina, la carichiamo e sostituiamo il materiale frontale
            if (bookData.coverPath) {
                const coverTexture = textureLoader.load(`/${bookData.coverPath}`);
                const coverMaterial = new THREE.MeshStandardMaterial({ 
                    map: coverTexture,
                    roughness: 0.8
                });
                materials[4] = coverMaterial; // Il 5° elemento (indice 4) è il Fronte
            }

            // Creiamo la mesh del libro
            const bookMesh = new THREE.Mesh(geometry, materials);
            
            // Posizioniamo i libri uno accanto all'altro, spostandoli sull'asse X
            // Moltiplichiamo per l'indice per distanziarli (2.2 è la larghezza del libro + un po' di spazio)
            bookMesh.position.x = index * 2.2; 

            // Salviamo i metadati dentro la mesh (ci servirà dopo per il click e la lettura!)
            bookMesh.userData = bookData;

            // Aggiungiamo il libro al gruppo
            libraryGroup.add(bookMesh);
        });

    } catch (error) {
        console.error("Errore nel caricamento dei libri:", error);
    }
}

// Avviamo il caricamento
loadBooks();

// --- 4. CONTROLLI E ANIMAZIONE ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

function animate() {
    requestAnimationFrame(animate);
    libraryGroup.rotation.y += 0.005
    controls.update();
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();