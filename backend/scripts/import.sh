#!/bin/bash
set -e

cd "$(dirname "$0")/.." || exit

# Download GraphHopper if not exists
if [ ! -f "graphhopper.jar" ]; then
    echo "Downloading GraphHopper..."
    curl -L -o graphhopper.jar "https://github.com/graphhopper/graphhopper/releases/download/9.0/graphhopper-web-9.0.jar"
fi

# Download Istanbul OSM data if not exists
if [ ! -f "istanbul-latest.osm.pbf" ]; then
    echo "Downloading Istanbul Region OSM PBF..."
    curl -L -o istanbul-latest.osm.pbf "https://download.bbbike.org/osm/bbbike/Istanbul/Istanbul.osm.pbf"
fi

echo "Running GraphHopper import..."
java -Ddw.graphhopper.datareader.file=istanbul-latest.osm.pbf -jar graphhopper.jar import config.yml
echo "Import finished."
