import pandas as pd
def load_kaggle_data(path: str) -> pd.DataFrame:
    try:
        df = pd.read_csv(path, encoding="utf-8", on_bad_lines="skip")
    except UnicodeDecodeError:
        df = pd.read_csv(path, encoding="latin-1", on_bad_lines="skip")
    df.dropna(how="all", inplace=True)
    print(f"  [kaggle] Loaded {len(df)} rows  |  Columns: {list(df.columns)}")
    return df
def load_enron_data(path: str) -> pd.DataFrame:
    try:
        df = pd.read_csv(path, encoding="utf-8", on_bad_lines="skip")
    except UnicodeDecodeError:
        df = pd.read_csv(path, encoding="latin-1", on_bad_lines="skip")
    df.dropna(how="all", inplace=True)
    print(f"  [enron]  Loaded {len(df)} rows  |  Columns: {list(df.columns)}")
    return df
if __name__ == "__main__":
    import os
    base = os.path.join(os.path.dirname(__file__), "..", "data", "raw")
    for name, loader in [("phishing.csv", load_kaggle_data), ("enron.csv", load_enron_data)]:
        path = os.path.join(base, name)
        if os.path.exists(path):
            df = loader(path)
            print(f"  First row sample: {df.iloc[0].to_dict()}\n")
        else:
            print(f"  File not found: {path}\n")