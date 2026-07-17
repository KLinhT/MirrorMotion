
import * as THREE from "three";

const DEFAULT_SOCKET_URL = "ws://localhost:8765";
const LANDMARK_SCALE = 2;

export function liveLandmarksToVectors(landmarks) {
  if (!Array.isArray(landmarks) || landmarks.length !== 21) {
    throw new Error(
      `Expected 21 landmarks, received ${landmarks?.length ?? 0}.`
    );
  }

  return landmarks.map((landmark) => {
    return new THREE.Vector3(
      -Number(landmark.x) * LANDMARK_SCALE,
      -Number(landmark.y) * LANDMARK_SCALE,
      Number(landmark.z) * LANDMARK_SCALE
    );
  });
}

export function connectLiveTracking({
  url = DEFAULT_SOCKET_URL,
  onFrame,
  onHandLost,
  onOpen,
  onClose,
  onError,
} = {}) {
  const socket = new WebSocket(url);

  socket.addEventListener("open", () => {
    console.log("Connected to MirrorMotion tracking backend.");
    onOpen?.();
  });

  socket.addEventListener("message", (event) => {
    try {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case "hand_tracking_frame":
          onFrame?.({
            landmarks: liveLandmarksToVectors(
              message.landmarks
            ),
            angles: message.angles,
          });
          break;

        case "hand_tracking_status":
          if (message.hand_detected === false) {
            onHandLost?.();
          }
          break;

        case "tracking_stopped":
          onHandLost?.();
          break;

        case "connection_status":
          console.log("Tracking backend confirmed connection.");
          break;

        default:
          console.debug(
            "Unhandled tracking message:",
            message
          );
      }
    } catch (error) {
      console.error(
        "Could not process tracking message:",
        error
      );
    }
  });

  socket.addEventListener("close", () => {
    console.log("Tracking backend disconnected.");
    onClose?.();
  });

  socket.addEventListener("error", (event) => {
    console.error("Tracking WebSocket error:", event);
    onError?.(event);
  });

  return socket;
}