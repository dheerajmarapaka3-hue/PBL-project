import json
import re

repdb_path = r"C:\Users\dheer\OneDrive\Desktop\ALL PROJECTS\healthmatee\datasets\RepDB\exercise-dataset-main\exercises.json"
flow_path = r"C:\Users\dheer\OneDrive\Desktop\ALL PROJECTS\healthmatee\datasets\Flow\flow-exercise-dataset-main\data\exercises.json"

with open(repdb_path, "r", encoding="utf-8") as f:
    repdb_data = json.load(f)["exercises"]

with open(flow_path, "r", encoding="utf-8") as f:
    flow_data = json.load(f)

def normalize(name):
    s = name.lower()
    s = re.sub(r"[^a-z0-9]", "", s)
    return s

repdb_map = {normalize(e["name_en"]): e for e in repdb_data}
flow_map = {normalize(e["name"]): e for e in flow_data}

common_keys = set(repdb_map.keys()) & set(flow_map.keys())
print(f"RepDB records: {len(repdb_data)}")
print(f"Flow records: {len(flow_data)}")
print(f"Exact normalized name matches: {len(common_keys)}")

sample_common = list(common_keys)[:10]
print("Sample overlapping names:")
for k in sample_common:
    print(f" - RepDB: '{repdb_map[k]['name_en']}' <--> Flow: '{flow_map[k]['name']}'")
