import numpy as np
from config import JOINTS

def calculate_angles(a, b, c):

    ba = a - b
    bc = c - b
    ba_length = np.linalg.norm(ba)
    bc_length = np.linalg.norm(bc)

    if ba_length == 0 or bc_length == 0:
        return float("nan")

    cosine_angle = np.dot(ba, bc) / (ba_length * bc_length)

    cosine_angle = np.clip(
        cosine_angle,
        -1.0,
        1.0,
    )
    
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