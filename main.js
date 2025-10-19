
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredMesh = null;
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 2;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

let model;
const clock = new THREE.Clock();

const loader = new GLTFLoader();
const meshParts = [];
loader.load(
  'logo.glb',
  (gltf) => {
    model = gltf.scene;
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        meshParts.push(child);
        child.userData.originalPosition = child.position.clone();
        child.material = new THREE.MeshStandardMaterial({
          color: child.material.color || 0xffffff,
          metalness: 0.8,
          roughness: 0.2
        });
      }
    });

    model.scale.set(0.3, 0.3, 0.3);
    scene.add(model);
    animate();
  },
  undefined,
  (error) => {
    console.error('Error loading logo.glb:', error);
  }
);

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(1, 1, 5);
dirLight.castShadow = true;
scene.add(dirLight);

function animate() {
  requestAnimationFrame(animate);

  if (model) {
    raycaster.setFromCamera(mouse, camera);
    const meshes = [];
    model.traverse((child) => {
      if (child.isMesh) meshes.push(child);
    });

    const rippleRadius = 1;
    let rippleCenter = null;

    const intersects = raycaster.intersectObjects(meshes, false);
    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const worldCenter = hit.getWorldPosition(new THREE.Vector3());
      rippleCenter = model.worldToLocal(worldCenter.clone());
    }

    meshParts.forEach((part) => {
      const originalPos = part.userData.originalPosition.clone();

      if (rippleCenter) {
        const dir = originalPos.clone().sub(rippleCenter).normalize();
        const dist = originalPos.distanceTo(rippleCenter);
        let strength = Math.max(0, 1 - dist / rippleRadius);
        strength = Math.pow(strength, 2);
        const offset = dir.clone().multiplyScalar(strength * 5);
        const targetPos = originalPos.clone().add(offset);
        part.position.lerp(targetPos, 0.005);
      } else {
        part.position.lerp(originalPos, 0.01);
      }
    });

    const t = clock.getElapsedTime();
    const tiltX = -mouse.y * 0.02;
    const tiltY = -mouse.x * 0.02;

    model.position.x = Math.sin(t * 0.1) * 0.025;
    model.position.y = Math.sin(t * 0.1) * 0.025;
    model.position.z = Math.sin(t * 0.2) * 0.025;

    model.rotation.x = 1.5 + Math.sin(t * 0.2) * 0.2 + tiltX;
    model.rotation.y = Math.sin(t * 0.3) * 0.05 + tiltY;
    model.rotation.z = Math.sin(t * 0.6) * 0.05;
  }

  renderer.render(scene, camera);
}

window.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Handle CTA click
document.getElementById('cta').addEventListener('click', () => {
  if (model) {
    model.visible = false;
  }
  document.getElementById('whiteOverlay').style.display = 'block';
});
