import asyncio
import json

import cv2
import mediapipe as mp
import numpy as np
from websockets.asyncio.server import serve

import angle_calculation
import normalisation


HOST = "localhost"
PORT = 8765

connected_clients = set()


def landmarks_to_array(hand_landmarks):
    """Convert MediaPipe landmarks into a NumPy coordinate array."""
    return np.array(
        [
            (landmark.x, landmark.y, landmark.z)
            for landmark in hand_landmarks.landmark
        ],
        dtype=np.float64,
    )


def landmarks_to_payload(normalised_landmarks):
    """Convert normalized NumPy coordinates into JSON-safe data."""
    return [
        {
            "id": index,
            "x": float(coordinates[0]),
            "y": float(coordinates[1]),
            "z": float(coordinates[2]),
        }
        for index, coordinates in enumerate(normalised_landmarks)
    ]


def angles_to_payload(angles):
    """Convert NumPy angle values into JSON-safe Python floats."""
    return {
        joint_name: float(angle)
        for joint_name, angle in angles.items()
    }


def process_hand(hand_landmarks):
    """Run one detected hand through the existing project pipeline."""
    raw_coordinates = landmarks_to_array(hand_landmarks)

    normalised_coordinates = normalisation.normalise_landmarks(
        raw_coordinates
    )

    if normalised_coordinates is None:
        return None

    angles = angle_calculation.calculate_joint_angles(
        normalised_coordinates
    )

    return {
        "type": "hand_tracking_frame",
        "landmarks": landmarks_to_payload(
            normalised_coordinates
        ),
        "angles": angles_to_payload(angles),
    }


async def handle_client(websocket):
    """Register a connected frontend viewer."""
    connected_clients.add(websocket)

    print(
        f"Viewer connected. "
        f"Active viewers: {len(connected_clients)}"
    )

    try:
        await websocket.send(
            json.dumps(
                {
                    "type": "connection_status",
                    "connected": True,
                }
            )
        )

        await websocket.wait_closed()

    finally:
        connected_clients.discard(websocket)

        print(
            f"Viewer disconnected. "
            f"Active viewers: {len(connected_clients)}"
        )


async def broadcast_payload(payload):
    """Send one payload to every connected viewer."""
    if not connected_clients:
        return

    message = json.dumps(
        payload,
        separators=(",", ":"),
    )

    clients = list(connected_clients)

    results = await asyncio.gather(
        *[
            client.send(message)
            for client in clients
        ],
        return_exceptions=True,
    )

    for client, result in zip(clients, results):
        if isinstance(result, Exception):
            connected_clients.discard(client)


async def run_tracking():
    camera = cv2.VideoCapture(0)

    if not camera.isOpened():
        raise RuntimeError("Could not open webcam.")

    mp_hands = mp.solutions.hands
    mp_drawing = mp.solutions.drawing_utils

    print("Live hand tracking started.")
    print(f"WebSocket available at ws://{HOST}:{PORT}")
    print("Press Q in the camera window to stop.")

    try:
        with mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=1,
            model_complexity=1,
            min_detection_confidence=0.6,
            min_tracking_confidence=0.6,
        ) as hands:
            while camera.isOpened():
                success, frame = camera.read()

                if not success:
                    print("Could not read webcam frame.")
                    break

                rgb_frame = cv2.cvtColor(
                    frame,
                    cv2.COLOR_BGR2RGB,
                )

                results = hands.process(rgb_frame)

                if results.multi_hand_landmarks:
                    hand_landmarks = (
                        results.multi_hand_landmarks[0]
                    )

                    payload = process_hand(
                        hand_landmarks
                    )

                    if payload is not None:
                        await broadcast_payload(payload)

                    mp_drawing.draw_landmarks(
                        frame,
                        hand_landmarks,
                        mp_hands.HAND_CONNECTIONS,
                    )
                else:
                    await broadcast_payload(
                        {
                            "type": "hand_tracking_status",
                            "hand_detected": False,
                        }
                    )

                cv2.imshow(
                    "MirrorMotion Live Tracking",
                    frame,
                )

                if cv2.waitKey(1) & 0xFF == ord("q"):
                    break

                # Give the WebSocket server time to send messages
                # and accept new connections.
                await asyncio.sleep(0)

    finally:
        camera.release()
        cv2.destroyAllWindows()

        await broadcast_payload(
            {
                "type": "tracking_stopped",
            }
        )

        print("Live hand tracking stopped.")


async def main():
    async with serve(handle_client, HOST, PORT):
        await run_tracking()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nServer interrupted.")