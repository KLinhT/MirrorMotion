import os 
import pandas as pd

def get_image_files(folder):
    valid_extensions = ('.jpg', '.jpeg', '.png')
    return [f for f in os.listdir(folder) if f.lower().endswith(valid_extensions)]

def save_to_dataframe(data, datapath): 

    df = pd.DataFrame(data)
    df.to_csv(datapath, index=False)