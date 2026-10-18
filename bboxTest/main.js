import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createSimulatorScene } from './sceneManager.js';

// Setup Scene, Camera, Renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(5, 5, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Grid & Axes Helpers
scene.add(new THREE.GridHelper(12, 12, 0x444444, 0x222222));
scene.add(new THREE.AxesHelper(3));

// Initialize our Modular Scene Component
const simulator = createSimulatorScene(scene);

let currentTargetMode = 0;
let lastSpherePosition = new THREE.Vector3();

let sxPos  =  6; 
let syPos  =  1;
let szPos  = -3;

// Handle DOM Inputs & Calculation Sync
function handleUpdate() {
    let radius = parseFloat(document.getElementById('r-input').value);
    document.getElementById('r-val').innerText = radius.toFixed(1);

    const data = simulator.update(radius, sxPos, syPos, szPos);
    lastSpherePosition.copy(data.currentSpherePosition);

    // Update UI text fields
    document.getElementById('pA-pos').innerText = `(${data.pointA.x.toFixed(1)}, ${data.pointA.y.toFixed(1)}, ${data.pointA.z.toFixed(1)})`;
    document.getElementById('pB-pos').innerText = `(${data.pointB.x.toFixed(1)}, ${data.pointB.y.toFixed(1)}, ${data.pointB.z.toFixed(1)})`; 
    document.getElementById('sc-pos').innerText = `(${sxPos}, ${syPos}, ${szPos})`; 
    document.getElementById('t-vals').innerText = `(${data.hit.tMin.toFixed(1)}, ${data.hit.tMax.toFixed(1)})`;
}

// Hook up DOM event listeners
document.getElementById('r-input').addEventListener('input', handleUpdate);

// Global Keyboard Controls
window.addEventListener('keydown', (event) => {
    let step = 0.5;
    let updated = false;

    if (event.code === 'KeyT') {
        currentTargetMode = (currentTargetMode + 1) % 2;
        if (currentTargetMode === 0) {
            controls.target.set(0, 0, 0);
            console.log("Camera Target: Origin (0, 0, 0)");
        } else {
            controls.target.copy(lastSpherePosition);
            console.log("Camera Target: Sphere Center", lastSpherePosition);
        }
    }
    if (event.code === 'KeyW') {
        const msg = simulator.toggleBBoxMaterial();
        console.log(msg);
    }
    if (event.code === 'KeyQ') {
        const msg = simulator.toggleSphereMaterial();
        console.log(msg);
    }

    if (event.code === 'KeyH') { sxPos -= step; updated = true; }
    if (event.code === 'KeyL') { sxPos += step; updated = true; }
    if (event.code === 'KeyK') { szPos -= step; updated = true; }
    if (event.code === 'KeyJ') { szPos += step; updated = true; }
    if (event.code === 'KeyO') { syPos -= step; updated = true; }
    if (event.code === 'KeyU') { syPos += step; updated = true; }

    if (updated) { handleUpdate(); }
});

// Window resize handling
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Run Initial Setup
handleUpdate();

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();
