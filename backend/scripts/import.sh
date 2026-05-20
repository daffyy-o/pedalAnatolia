#!/bin/bash
set -e

cd "$(dirname "$0")/.." || exit

PBF_FILE="${PBF_FILE:-turkey-260226.osm.pbf}"

if [ ! -f "graphhopper.jar" ]; then
    echo "Downloading GraphHopper..."
    curl -L -o graphhopper.jar "https://github.com/graphhopper/graphhopper/releases/download/9.0/graphhopper-web-9.0.jar"
fi

if [ ! -f "$PBF_FILE" ]; then
    echo "Error: $PBF_FILE not found in backend/."
    exit 1
fi

echo "Building school zone routing config from data/school-zones.geojson ..."
python3 scripts/build_school_model.py

echo "Running GraphHopper import on $PBF_FILE ..."
java -Ddw.graphhopper.datareader.file="$PBF_FILE" -jar graphhopper.jar import config.yml
echo "Done. Start server: java -jar graphhopper.jar server config.yml"
