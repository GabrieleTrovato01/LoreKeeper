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

// --- 3. CREAZIONE DEL LIBRO ---
const geometry = new THREE.BoxGeometry(2, 3, 0.4);
const coverMaterial = new THREE.MeshStandardMaterial({ color: 0x2980b9 });
const pagesMaterial = new THREE.MeshStandardMaterial({ color: 0xf5f5dc });

const materials = [
    pagesMaterial, coverMaterial, pagesMaterial, pagesMaterial, coverMaterial, coverMaterial
];

const book = new THREE.Mesh(geometry, materials);
scene.add(book);

// --- 4. CONTROLLI E ANIMAZIONE ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

function animate() {
    requestAnimationFrame(animate);
    book.rotation.y += 0.005;
    controls.update();
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();