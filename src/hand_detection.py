import mediapipe as mp
import cv2
import os
import config

# hand detection and landmark estimation
mp_hands = mp.solutions.hands
mp_draw = mp.solutions.drawing_utils

# Initialize the Hands model
hands = mp_hands.Hands(
    static_image_mode=True,
    max_num_hands=config.MAX_HANDS,
    min_detection_confidence=config.MIN_DETECTION_CONFIDENCE
) 

# detect hands and extract landmarks
def detect_hands(image):
    # Convert the BGR image to RGB before processing.
    results = hands.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
    return results