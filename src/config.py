INPUT_FOLDER = "input_images"
OUTPUT_FOLDER = "output_images"

LANDMARK_CSV = "data/normalized_landmarks.csv"
ANGLE_CSV = "data/joint_angles.csv"

MAX_HANDS = 1
MIN_DETECTION_CONFIDENCE = 0.5

JOINTS = {

    # Thumb
    "thumb_mcp": (1, 2, 3),
    "thumb_ip":  (2, 3, 4),

    # Index
    "index_mcp": (0, 5, 6),
    "index_pip": (5, 6, 7),
    "index_dip": (6, 7, 8),

    # Middle
    "middle_mcp": (0, 9, 10),
    "middle_pip": (9, 10, 11),
    "middle_dip": (10, 11, 12),

    # Ring
    "ring_mcp": (0, 13, 14),
    "ring_pip": (13, 14, 15),
    "ring_dip": (14, 15, 16),

    # Pinky
    "pinky_mcp": (0, 17, 18),
    "pinky_pip": (17, 18, 19),
    "pinky_dip": (18, 19, 20),
}