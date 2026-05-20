import cv2 
import os
from hand_detection import detect_hands, mp_draw, mp_hands

def draw_landmarks(image, hand_landmarks):
    overlay = image.copy()

    mp_draw.draw_landmarks(
        overlay,
        hand_landmarks,
        mp_hands.HAND_CONNECTIONS
    )

    return overlay