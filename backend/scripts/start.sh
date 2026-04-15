#!/bin/bash
set -e

cd "$(dirname "$0")/.." || exit

if [ ! -d "graph-cache" ]; then
    echo "Error: graph-cache directory not found. Please run import.sh first."
    exit 1
fi

echo "Starting GraphHopper server..."
java -jar graphhopper.jar server config.yml
