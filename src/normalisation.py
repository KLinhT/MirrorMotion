import numpy as np

def normalise_landmarks(coords): 

    # wrist coordinates 
    wrist = coords[0]
    
    # normalise by subtracting wrist coordinates
    coords = coords - wrist

    # get the scale factor (distance from wrist to middle MCP) 
    scale = np.linalg.norm(coords[9])

    if scale == 0:
        return None
    
    # normalise by dividing by the scale
    coords = coords / scale
    return coords