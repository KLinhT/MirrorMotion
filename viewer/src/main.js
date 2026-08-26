import "./style.css";

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { connectLiveTracking } from "./liveTrackingSocket";
import { HandSkeleton } from "./handSkeleton";
import { updateAnglePanel } from "./anglePanel";



// -----------
// HTML Elements
// -----------
const viewer = document.getElementById("viewer");
const statusLabel = document.getElementById("frame-label");
const panel = document.getElementById("angle-panel");


// -----------
// State
// -----------

let liveTrackingSocket = null;
let liveTrackingActive = false;
let idleMode = true;
let lastHandDetectedAt = 0;
const HAND_LOST_DELAY = 1500;


// ----------------
// Scene
// ----------------

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(
  60,
  viewer.clientWidth / viewer.clientHeight,
  0.01,
  100
);

camera.position.set(0, 0, 5);

const renderer = new THREE.WebGLRenderer({

  antialias: true,

});

renderer.setSize(
  viewer.clientWidth,
  viewer.clientHeight
);

renderer.setPixelRatio(
  Math.min(window.devicePixelRatio, 
  2)
);

viewer.appendChild(renderer.domElement);


// ---------------
// Controls
// ---------------

const controls = new OrbitControls(
  camera, 
  renderer.domElement
);

controls.enableDamping = true;

// ---------------
// Lights and Helpers
// ---------------  
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

// ---------------
// Hand Skeleton
// ---------------  
const skeleton = new HandSkeleton(scene, {
  jointColor: 0x4cc9f0,
  boneColor: 0xffffff,
});

const idleLandmarks = createIdleHandLandmarks();
skeleton.update(idleLandmarks);
skeleton.setVisible(true);

// ---------------
// Status
// ---------------
function setStatus(message) {
  if (statusLabel) {
    statusLabel.textContent = message;
  }
  console.log(message);
}

// ---------------
// Live Tracking
// ---------------

function centerLandmarks(landmarks) {
  if (!Array.isArray(landmarks) || landmarks.length === 0) {
    return landmarks;
  }

  const bounds = new THREE.Box3().setFromPoints(landmarks);
  const center = bounds.getCenter(new THREE.Vector3());

  return landmarks.map((landmark) =>
    landmark.clone().sub(center)
  );
}

function startLiveTrackingConnection() {
  setStatus("Connecting to tracking backend...");
  showIdleAngleMessage();

  liveTrackingSocket = connectLiveTracking({
    onOpen: () => {
      setStatus("Place your hand in view");
    },

    onFrame: ({ landmarks, angles }) => {
      lastHandDetectedAt = performance.now();
      liveTrackingActive = true;
      idleMode = false;

      resetSkeletonTransform();

      const centeredLandmarks =
        centerLandmarks(landmarks);

      skeleton.update(centeredLandmarks);
      skeleton.setVisible(true);

      updateAnglePanel(angles);
      setStatus("Live hand tracking");
    },

    onHandLost: () => {
      setStatus("Hand temporarily lost");
    },

    onClose: () => {
      liveTrackingSocket = null;
      enterIdleMode();

      skeleton.update(idleLandmarks);

      setStatus("Tracking backend disconnected");
    },

    onError: (error) => {
      console.error(
        "Live-tracking connection error:",
        error
      );

      enterIdleMode();
      skeleton.update(idleLandmarks);

      setStatus(
        "Tracking unavailable — demo mode"
      );
    },
  });
}

// ---------------
// Animation Loop
// ---------------
function animate(time) {
  requestAnimationFrame(animate);

  if (
    !idleMode &&
    performance.now() - lastHandDetectedAt >
      HAND_LOST_DELAY
  ) {
    enterIdleMode();
    skeleton.update(idleLandmarks);
  }
  updateIdleHandAnimation(time);
  controls.update();
  renderer.render(scene, camera);
}
// ---------------
// Window events
// ---------------
window.addEventListener("resize", () => {
  const width = viewer.clientWidth;
  const height = viewer.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});

window.addEventListener("beforeunload", () => {
  if (liveTrackingSocket) {
    liveTrackingSocket.close();
  }
});

// ---------------
// Helper Functions
// ---------------
function showIdleAngleMessage() {
  const anglePanel = document.getElementById("angle-panel");

  if (anglePanel) {
    anglePanel.innerHTML = `
      <p class="idle-message">
        Place your hand in view to display live joint angles.
      </p>
    `;
  }
}

function enterIdleMode() {
  if (idleMode) {
    return;
  }
  idleMode = true;
  liveTrackingActive = false;
  showIdleAngleMessage();
  setStatus("Place your hand in view");
}

function updateIdleHandAnimation() {

  if (!idleMode) {

    return;

  }

  skeleton.setVisible(true);

}

function resetSkeletonTransform() {

  // No-op: HandSkeleton does not expose a root group.

}

function createIdleHandLandmarks() {
  const points = [
    [0.00, -1.00, 0.00],

    [-0.28, -0.72, 0.02],
    [-0.48, -0.45, 0.04],
    [-0.63, -0.15, 0.06],
    [-0.72, 0.12, 0.08],

    [-0.18, -0.45, 0.00],
    [-0.22, -0.05, 0.00],
    [-0.23, 0.38, 0.00],
    [-0.22, 0.75, 0.00],

    [0.00, -0.40, 0.00],
    [0.00, 0.08, 0.00],
    [0.00, 0.55, 0.00],
    [0.00, 0.95, 0.00],

    [0.18, -0.44, 0.00],
    [0.22, 0.00, 0.00],
    [0.23, 0.42, 0.00],
    [0.22, 0.78, 0.00],

    [0.34, -0.54, 0.00],
    [0.45, -0.18, 0.00],
    [0.50, 0.15, 0.00],
    [0.52, 0.44, 0.00],
  ];

  return points.map(
    ([x, y, z]) =>
      new THREE.Vector3(x, y, z)
  );
}

// -----------------------------------------------------------------------------
// Application startup
// -----------------------------------------------------------------------------
function init() {
  animate();
  startLiveTrackingConnection();

}
try {
  init();
} catch (error) {
  console.error(error);
  document.body.innerHTML = `
    <pre
      style="
        color: white;
        padding: 20px;
        white-space: pre-wrap;
      "
    >${error.message}</pre>
  `;
}





