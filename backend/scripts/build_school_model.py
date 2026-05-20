#!/usr/bin/env python3
"""
Reads backend/data/school-zones.geojson and updates:
  - backend/custom-bike-school-model.json  (for GraphHopper routing)
  - client/src/data/school-zones.json      (for the map red areas)

Run from backend/:
  python scripts/build_school_model.py
"""

import json
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent
SOURCE = BACKEND / "data" / "school-zones.geojson"
CUSTOM_MODEL = BACKEND / "custom-bike-school-model.json"
CLIENT_JSON = BACKEND.parent / "client" / "src" / "data" / "school-zones.json"


def main() -> None:
    if not SOURCE.is_file():
        raise SystemExit(f"Missing {SOURCE}")

    data = json.loads(SOURCE.read_text(encoding="utf-8"))
    features = data.get("features", [])

    base = json.loads((BACKEND / "custom-bike-model.json").read_text(encoding="utf-8"))
    priority = list(base.get("priority", []))
    for f in features:
        zone_id = f.get("id")
        if not zone_id:
            raise SystemExit("Each school zone needs an 'id' (e.g. zone_1)")
        priority.append({"if": f"in_{zone_id}", "multiply_by": 0.1})

    model = {
        "priority": priority,
        "areas": {"type": "FeatureCollection", "features": features},
    }

    CUSTOM_MODEL.write_text(json.dumps(model, indent=2), encoding="utf-8")
    CLIENT_JSON.parent.mkdir(parents=True, exist_ok=True)
    CLIENT_JSON.write_text(json.dumps(data, indent=2), encoding="utf-8")

    print(f"Updated {CUSTOM_MODEL.name} with {len(features)} zone(s)")
    print(f"Copied map data to {CLIENT_JSON}")


if __name__ == "__main__":
    main()
