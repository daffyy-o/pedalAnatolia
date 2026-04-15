# Pedal Anatolia

Welcome to **Pedal Anatolia**! We are **Ali Faris Taha TAHA** and **Defne OKTEM**, and this is our final graduation project (COMP/SOFT4902/4912).

We built this bicycle-only routing and trip planning application because we saw a gap in navigation tools for cyclists in Turkey. While standard apps often route users onto fast, stressful motorways, our tool uses OpenStreetMap data and the GraphHopper routing engine to prioritize safer, cyclable paths.

## Our Project Components
We have split the system into two main parts:
1. **`backend/`**: This is where we host the GraphHopper v9 engine. We've configured custom JSON models and import scripts to process the cyclic road graphs specifically for Turkey's road network.
2. **`client/`**: This is our mobile application. We built it using React Native (Expo) so it can run on both Android and iOS, hooking directly into our backend.

## How We Set Up the Routing Server (Backend)

We designed our backend to be easily reproducible by other students. All our scripts use standard OS commands or `bash`. You will need Java 17+ installed.

1. `cd backend`
2. Run `./scripts/import.sh`. Our script will autonomously:
   - Download the required `graphhopper-web-9.0.jar`.
   - Download the latest regional `.osm.pbf` (we used Istanbul for our development testing).
   - Generate the internal graph format using the custom models we defined in `config.yml`.
3. Start our server using `./scripts/start.sh`:
   - The API will be available at `http://localhost:8989/route`.
   - **Note:** We configured `config.yml` with `bind_host: 0.0.0.0` so we can connect our physical phones to the same Wi-Fi.

## How We Set Up the Mobile Client (WP2)

Our client is a standard SDK 50+ Expo cross-platform codebase.

1. Ensure Node.js is installed.
2. `cd client/`
3. Run `npm install`.
4. We've set the backend URL in `src/lib/api.ts`. Currently, we have it configured to Ali's PC LAN IP (`10.5.57.105`) so we can test on our actual phones.
5. Start Expo:
   ```bash
   npx expo start
   ```
   *Note: If you encounter a native crash on Android, we've locked the `react-native-screens` version to `~4.16.0` to ensure stability.*

## Custom School/University Zones (WP3)

For our school zone implementation, we integrated the logic directly into the GraphHopper Custom Model. Our isolated backend profile, `bike_school_zones`, allows us to apply high route penalties dynamically to specific zones. You can explore how we defined the area logic in `backend/custom-bike-school-model.json`.
