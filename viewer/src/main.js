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
let angleMap = new Map();


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
  liveTrackingSocket = connectLiveTracking({
    onOpen: () => {
      liveTrackingActive = true;
      setStatus("Live tracking connected");
    },
    onFrame: ({ landmarks, angles }) => {
      console.log("Received angles:", angles);
      liveTrackingActive = true;
      const centeredLandmarks = centerLandmarks(landmarks);
      skeleton.update(centeredLandmarks);
      skeleton.setVisible(true);
      if (angles) {
        updateAnglePanel(angles);
      }
      setStatus("Hand detected");
    },

    onHandLost: () => {
      skeleton.setVisible(false);
      setStatus("No hand detected");
    },

    onClose: () => {
      liveTrackingActive = false;
      liveTrackingSocket = null;
      skeleton.setVisible(false);
      setStatus("Tracking backend disconnected");
    },

    onError: error => {
      liveTrackingActive = false;
      skeleton.setVisible(false);
      console.error(
        "Live-tracking connection error:",
        error
      );
      setStatus("Unable to connect to tracking backend");
    },

  });

}

// ---------------
// Animation Loop
// ---------------
function animate() {
  requestAnimationFrame(animate);
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





