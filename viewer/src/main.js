import "./style.css";

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { loadCSV, landmarkRowToVectors } from "./csvLoader";
import { HandSkeleton } from "./handSkeleton";
import { createAngleMap, updateAnglePanel } from "./anglePanel";


// HTML Elements
const viewer = document.getElementById("viewer");
const frameSlider = document.getElementById("frame-slider");
const frameLabel = document.getElementById("frame-label");

// Initialise 3js scene, camera, renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(
  60,
  viewer.clientWidth / viewer.clientHeight,
  0.01,
  100
);

camera.position.set(0, 0, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(viewer.clientWidth, viewer.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
viewer.appendChild(renderer.domElement);


const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight.position.set(2, 3, 4);
scene.add(directionalLight);

const grid = new THREE.GridHelper(4, 20);
grid.rotation.x = Math.PI / 2;
scene.add(grid);

const axes = new THREE.AxesHelper(1);
scene.add(axes);

// Create the hand skeleton
const skeleton = new HandSkeleton(scene);

let landmarkRows = [];
let angleByImage = new Map();

// Main application logic
async function init() {
  landmarkRows = await loadCSV("/normalized_landmarks.csv");
  const angleRows = await loadCSV("/joint_angles.csv");

  console.log("Loaded landmark rows:", landmarkRows);
  console.log("Loaded angle rows:", angleRows);

  angleByImage = createAngleMap(angleRows);

  frameSlider.max = String(landmarkRows.length - 1);
  frameSlider.value = "0";

  showFrame(0);

  frameSlider.addEventListener("input", () => {
    showFrame(Number(frameSlider.value));
  });

  animate();
}


// Update the 3D scene and angle panel for a given frame index
function showFrame(index) {
  const row = landmarkRows[index];

  if (!row) {
    return;
  }

  const landmarks = landmarkRowToVectors(row);
  skeleton.update(landmarks);

  frameLabel.textContent = `${row.image} — Frame ${index}`;

  const angleRow = angleByImage.get(row.image);
  updateAnglePanel(angleRow);
}

function animate() {
  requestAnimationFrame(animate);

  controls.update();
  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  camera.aspect = viewer.clientWidth / viewer.clientHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(viewer.clientWidth, viewer.clientHeight);
});

init().catch(error => {
  console.error(error);

  document.body.innerHTML = `
    <pre style="color: white; padding: 20px; white-space: pre-wrap;">
${error.message}
    </pre>
  `;
});