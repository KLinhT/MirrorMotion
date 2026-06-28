import cv2
import numpy as np

import config
import hand_detection
import normalisation
import angle_calculation
import visualisation
import utils

# Rows for CSV output
landmark_rows = []
angle_rows = []

frame_id = 0

cam = cv2.VideoCapture(1)

while True:
    # Capture frame-by-frame
    ret, frame = cam.read()

    # if there is no image to capture break the loop
    if not ret:
        print("Failed to grab frame")
        break

    # Mirror image
    image = cv2.flip(frame, 1)

    # Detect hand
    result = hand_detection.detect_hands(image)

    # if there are hand landmarks detected
    if result.multi_hand_landmarks:

        frame_id += 1
        hand_landmarks = result.multi_hand_landmarks[0]

        # Extract coordinates
        coords = np.array([
            (lm.x, lm.y, lm.z)
            for lm in hand_landmarks.landmark
        ])

        # Normalise coordinates
        normalised_coords = normalisation.normalise_landmarks(coords)

        # Calculate joint angles
        angles = angle_calculation.calculate_joint_angles(
            normalised_coords
        )

        # Draw landmarks
        image = visualisation.draw_landmarks(
            image,
            hand_landmarks
        )

        # Generate filename similar to image dataset
        filename = f"frame_{frame_id:04d}.jpg"

        # Save landmark row
        landmark_row = {"image": filename}

        for i in range(21):
            landmark_row[f"x_{i}"] = normalised_coords[i][0]
            landmark_row[f"y_{i}"] = normalised_coords[i][1]
            landmark_row[f"z_{i}"] = normalised_coords[i][2]

        landmark_rows.append(landmark_row)

        # Save angle row
        angles["image"] = filename
        angle_rows.append(angles)

        print(f"Captured {filename}")

    cv2.imshow("Live Feed", image)

    key = cv2.waitKey(1) & 0xFF

    if key == ord("q"):
        break

cam.release()
cv2.destroyAllWindows()

# Save CSV files
utils.save_to_dataframe(
    landmark_rows,
    "live_landmarks.csv"
)

utils.save_to_dataframe(
    angle_rows,
    "live_angles.csv"
)

print(f"\nSaved {len(angle_rows)} samples")
print("Created:")
print(" - live_landmarks.csv")
print(" - live_angles.csv")