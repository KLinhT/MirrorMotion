import os 
import cv2
import numpy as np

import config
import hand_detection
import normalisation
import angle_calculation
import visualisation
import utils

# rows for landmark data 
landmark_rows = []
# rows for angle data 
angle_rows = []

# iterate through all images in the input folder
for filename in os.listdir(config.INPUT_FOLDER):

    path = os.path.join(config.INPUT_FOLDER, filename)

    # read the image 
    image = cv2.imread(path)
    result = hand_detection.detect_hands(image)

    # hand landmarks detected
    hand_landmarks = result.multi_hand_landmarks[0]

    # coordinates of each landmark 
    coord = np.array([(lm.x, lm.y, lm.z) for lm in hand_landmarks.landmark])  # Fixed: added parentheses

    # normalise each landmark coordinate
    normalised_coords = normalisation.normalise_landmarks(coord)

    # computed angles 
    angles = angle_calculation.calculate_joint_angles(normalised_coords)

    # overlay the landmarks on the images 
    overlay = visualisation.draw_landmarks(image, hand_landmarks)

    cv2.imwrite(
        os.path.join(config.OUTPUT_FOLDER, filename), 
        overlay
    )

    # Save landmark row
    row = {"image": filename}

    for i in range(21):
        row[f"x_{i}"] = normalised_coords[i][0]
        row[f"y_{i}"] = normalised_coords[i][1]
        row[f"z_{i}"] = normalised_coords[i][2]

    landmark_rows.append(row)

    angles["image"] = filename
    angle_rows.append(angles)

utils.save_to_dataframe(landmark_rows, config.LANDMARK_CSV)
utils.save_to_dataframe(angle_rows, config.ANGLE_CSV)