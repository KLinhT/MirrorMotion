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
const addComparisonHandBtn = document.getElementById("addComparisonHandBtn");
const patientSearchPanel = document.getElementById("toggle-patient-id");
const patientInput = document.getElementById("patient-id");



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
const skeleton = new HandSkeleton(scene, {
  jointColor: 0x4cc9f0,
  boneColor: 0xffffff,
});

const comparisonSkeleton = new HandSkeleton(scene, {
  jointColor: 0xffb703,
  boneColor: 0xffb703,
});

comparisonSkeleton.setVisible(false);

let allLandmarkRows = [];
let landmarkRows = [];
let angleByImage = new Map();

// Main application logic
async function init() {
  allLandmarkRows = await loadCSV("/normalized_landmarks.csv");
  landmarkRows = allLandmarkRows;

  const angleRows = await loadCSV("/joint_angles.csv");

  populatePatientDropdown(allLandmarkRows);
  patientInput.addEventListener("change", () => {
  updateComparisonHand(patientInput.value);
  });


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

// Add Comparison Hand Event Listeners

addComparisonHandBtn.addEventListener("click", () => {
  patientSearchPanel.classList.toggle("hidden");

  if(!patientSearchPanel.classList.contains("hidden"))
  {
    patientInput.focus();
  }
});

function getPatientNumber(row) {
  return row.patient_number
}

function populatePatientDropdown(rows) {
  const patientNumbers = [...new Set(
    rows
      .map(row => getPatientNumber(row))
      .filter(value => value !== undefined && value !== null && value !== "")
  )];


  patientInput.innerHTML = `

    <option value="">Select patient...</option>

    ${patientNumbers

      .map(patientNumber => {

        return `<option value="${patientNumber}">${patientNumber}</option>`;

      })

      .join("")}

  `;

}

function updateComparisonHand(patientNumber) {
  if (!patientNumber) {
    comparisonSkeleton.setVisible(false);
    return;
  }

  const comparisonRow = allLandmarkRows.find(row => {
    return String(getPatientNumber(row)) === String(patientNumber);
  });

  if (!comparisonRow) {
    console.warn(`No comparison hand found for patient: ${patientNumber}`);
    comparisonSkeleton.setVisible(false);
    return;
  }

  const comparisonLandmarks = landmarkRowToVectors(comparisonRow);

  // Offset slightly so the two hands do not perfectly overlap.
  

  comparisonSkeleton.update(comparisonLandmarks);
  comparisonSkeleton.setVisible(true);
}
