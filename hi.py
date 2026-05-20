import os
import cv2
import mediapipe as mp
import pandas as pd

# ============================================================
# CONFIG
# ============================================================

INPUT_FOLDER = "input_images"
OUTPUT_FOLDER = "output_images"
CSV_OUTPUT = "hand_landmarks.csv"

os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# ============================================================
# MEDIAPIPE
# ============================================================

mp_hands = mp.solutions.hands
mp_draw = mp.solutions.drawing_utils

hands = mp_hands.Hands(
    static_image_mode=True,
    max_num_hands=1,
    min_detection_confidence=0.5
)

# ============================================================
# STORAGE
# ============================================================

all_rows = []

# ============================================================
# PROCESS IMAGES
# ============================================================

for filename in os.listdir(INPUT_FOLDER):

    image_path = os.path.join(INPUT_FOLDER, filename)

    # read image and convert to RGB as mediapipe expects RGB input
    image = cv2.imread(image_path)
    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    # process with mediapipe
    results = hands.process(rgb_image)

    # hand landmarks
    hand_landmarks = results.multi_hand_landmarks[0]

    # ========================================================
    # DRAW LANDMARKS
    # ========================================================

    overlay = image.copy()

    mp_draw.draw_landmarks(
        overlay,
        hand_landmarks,
        mp_hands.HAND_CONNECTIONS
    )

    # save overlay image
    cv2.imwrite(
        os.path.join(OUTPUT_FOLDER, filename),
        overlay
    )

    # ========================================================
    # NORMALISE TO WRIST
    # ========================================================

    wrist = hand_landmarks.landmark[0]

    row = {
        "image": filename
    }

    for idx, lm in enumerate(hand_landmarks.landmark):

        row[f"x_{idx}"] = lm.x - wrist.x
        row[f"y_{idx}"] = lm.y - wrist.y
        row[f"z_{idx}"] = lm.z - wrist.z

    all_rows.append(row)

    print(f"Processed {filename}")

# ============================================================
# SAVE CSV
# ============================================================

df = pd.DataFrame(all_rows)
df.to_csv(CSV_OUTPUT, index=False)