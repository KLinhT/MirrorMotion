import numpy as np
from config import JOINTS

def calculate_angles(a, b, c):
    # Calculate the vectors
    ba = a - b
    bc = c - b

    # Calculate the cosine of the angle using the dot product formula
    cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))

    # Clip the cosine value to the range [-1, 1] to avoid numerical issues
    cosine_angle = np.clip(cosine_angle, -1.0, 1.0)

    # Calculate the angle in radians and then convert to degrees
    angle = np.arccos(cosine_angle)
    return np.degrees(angle)

def calculate_joint_angles(landmarks):

    angles = {}

    for joint_name, (a_idx, b_idx, c_idx) in JOINTS.items():

        angles[joint_name] = calculate_angles(
            landmarks[a_idx],
            landmarks[b_idx],
            landmarks[c_idx]
        )

    return angles