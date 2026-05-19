# Pedal Anatolia Interview Preparation Guide

Generated from the current repository state on 2026-05-18.

This guide is written for a project interview where you may be asked to explain the
codebase, justify technical decisions, trace data flow, or modify the project live.
It covers the project-owned files in this repository. It intentionally does not
walk through `client/node_modules/` or `.git/` internals because those are vendor
dependencies and Git storage, not code written for the project.

## 1. One-Minute Project Summary

Pedal Anatolia is a bicycle routing app for Turkey. The system has two main parts:

1. `backend/`: a self-hosted GraphHopper 9.0 routing server configured with
   OpenStreetMap data and custom bicycle routing profiles.
2. `client/`: an Expo React Native app that lets users search or tap map points,
   request a route from GraphHopper, draw the route on the map, show route details,
   change route preferences, and save routes locally.

The backend is not a custom Node/Express server. It is GraphHopper running from a
Java JAR. Most backend behavior is controlled by `config.yml` and custom model
JSON files. The frontend sends HTTP requests to GraphHopper's `/route` endpoint.

## 2. Architecture Overview

### Main Data Flow

```text
User taps/searches origin and destination
  -> MapScreen stores origin/destination in React state
  -> MapScreen calls fetchRoute(...)
  -> fetchRoute builds GET /route request for GraphHopper
  -> GraphHopper calculates route from imported OSM graph
  -> fetchRoute normalizes the response
  -> MapScreen draws markers/polyline and shows RouteSummary
```

### Search Flow

```text
SearchBar input
  -> geocodeSearch(...)
  -> Nominatim OpenStreetMap search API
  -> user selects a Place
  -> MapScreen converts string lat/lon to numbers
  -> selected point becomes origin or destination
```

### School Zone Preference Flow

```text
SettingsScreen Switch
  -> Zustand preferences store
  -> MapScreen reads avoidSchoolZonesDuringPeakHours
  -> fetchRoute receives avoidSchoolZones boolean
  -> profile=bike or profile=bike_school_zones
  -> GraphHopper applies the selected custom model
```

Important correction: the current code does not check actual time of day. The
setting name says "During Peak Hours", but the boolean immediately switches the
GraphHopper profile whenever it is enabled.

## 3. Technology Stack

| Area | Technology | Purpose |
| --- | --- | --- |
| Mobile/web client | Expo SDK 54, React Native, TypeScript | Cross-platform app code |
| Native mobile map | `react-native-maps` | Android/iOS map rendering |
| Web map | Leaflet + React Leaflet | Browser map rendering |
| Navigation | React Navigation native stack | Map, Settings, Saved Routes screens |
| HTTP | Axios | Calls GraphHopper and Nominatim |
| State | Zustand | Preferences and saved routes |
| Persistence | AsyncStorage through Zustand middleware | Saved routes only |
| Routing backend | GraphHopper 9.0 | Bicycle route calculation |
| Map data | OpenStreetMap PBF | Road network source |
| Build service config | EAS | Expo build profiles |

## 4. Repository Structure

```text
pedalAnatolia/
  README.md
  PROJECT_INTERVIEW_GUIDE.md
  .gitattributes
  .gitignore
  .agents/
    rules/
  backend/
    config.yml
    custom-bike-model.json
    custom-bike-school-model.json
    graphhopper.jar
    istanbul-latest.osm.pbf
    graph-cache/
    scripts/
  client/
    App.tsx
    index.ts
    app.json
    eas.json
    package.json
    package-lock.json
    tsconfig.json
    assets/
    .expo/
    src/
      components/
      lib/
      screens/
      store/
```

## 5. Every File and Its Purpose

### Root Files

| File | Purpose | Interview notes |
| --- | --- | --- |
| `.gitattributes` | Tells Git to auto-detect text files and normalize line endings. | Useful because the repo mixes Windows development and Bash scripts. |
| `.gitignore` | Ignores `docs/` and `.agents/`. | Current repo still has `.agents/` tracked or present locally, so this file may not reflect current Git state perfectly. |
| `README.md` | Main project explanation and setup guide. | It explains the two-part architecture and how to import/start GraphHopper and run Expo. |
| `PROJECT_INTERVIEW_GUIDE.md` | This generated interview guide. | Added to help you prepare for advisor questions. |

### `.agents/rules/`

These files are AI/development guidance files. They are not app runtime code.

| File | Purpose | Interview notes |
| --- | --- | --- |
| `.agents/rules/project.md` | Defines project goals, use cases, tech stack, non-goals, and success criteria. | Good source for explaining motivation and scope. |
| `.agents/rules/architecture.md` | Describes client-server architecture, data flow, API contracts, and deployment nodes. | Some details are slightly older than current code: it says saved trips are not in v1, but current code includes saved routes. |
| `.agents/rules/conventions.md` | Defines coding conventions, error messages, backend config rules, and dependency locks. | Useful when asked why API calls are centralized in `api.ts`. |
| `.agents/rules/progress.md` | Project progress log and known technical notes. | Contains historical decisions like GraphHopper 9.0 and Expo version fixes. |
| `.agents/rules/system-prompt.md` | AI system instructions used during development. | Not part of production behavior. |
| `.agents/rules/tasks.md` | Work package checklist. | Shows WP1-WP4 completion state and future ideas. |

### Backend Files

| File | Purpose | Interview notes |
| --- | --- | --- |
| `backend/config.yml` | GraphHopper server and routing profile configuration. | Defines `bike` and `bike_school_zones` profiles and binds HTTP server to `0.0.0.0:8989`. |
| `backend/custom-bike-model.json` | Base bike routing custom model. | Blocks motorways/trunks and strongly discourages primary roads. |
| `backend/custom-bike-school-model.json` | Bike model with school-zone penalty. | Adds a GeoJSON polygon and penalizes roads inside it with `multiply_by: 0.1`. |
| `backend/graphhopper.jar` | GraphHopper web server JAR. | Manifest shows `Main-Class: com.graphhopper.application.GraphHopperApplication`; built with Java 17. |
| `backend/istanbul-latest.osm.pbf` | Istanbul OpenStreetMap extract. | Source graph data imported into GraphHopper. It is binary OSM PBF, not source code. |
| `backend/scripts/import.sh` | Downloads GraphHopper/data if missing and runs graph import. | Used when graph-cache is missing or when model/data changes require reimport. |
| `backend/scripts/start.sh` | Starts GraphHopper server from existing graph cache. | Fails early if `graph-cache/` is missing. |

### Backend Graph Cache Files

`backend/graph-cache/` is generated by GraphHopper import. These files are runtime
data structures, not hand-written source. If `config.yml`, the OSM PBF, encoded
values, or custom model profiles change, you may need to delete/regenerate this
cache by rerunning `scripts/import.sh`.

| File | Purpose |
| --- | --- |
| `backend/graph-cache/properties.txt` | Human-readable metadata about the imported graph, profiles, encoded values, and import date. |
| `backend/graph-cache/properties` | Binary-backed GraphHopper property store containing similar metadata. |
| `backend/graph-cache/nodes` | Graph node storage. |
| `backend/graph-cache/edges` | Graph edge storage. |
| `backend/graph-cache/geometry` | Edge geometry storage used to reconstruct route shapes. |
| `backend/graph-cache/location_index` | Spatial lookup index that maps coordinates to nearby graph edges. |
| `backend/graph-cache/edgekv_keys` | Key storage for edge key/value metadata. |
| `backend/graph-cache/edgekv_vals` | Value storage for edge key/value metadata. |

Observed graph metadata:

```text
datareader.import.date=2026-04-29T21:04:44Z
datareader.data.date=2026-04-10T23:00:00Z
profiles=bike, bike_school_zones
```

### Client Config and Entry Files

| File | Purpose | Interview notes |
| --- | --- | --- |
| `client/package.json` | Defines scripts and dependencies. | Main scripts are `start`, `android`, `ios`, and `web`. |
| `client/package-lock.json` | Exact dependency resolution. | Ensures repeatable npm installs. |
| `client/tsconfig.json` | TypeScript config. | Extends Expo base config and enables `strict: true`. |
| `client/app.json` | Expo app metadata and native config. | Contains app icons, package name, Android Google Maps API key, and EAS project id. |
| `client/eas.json` | Expo Application Services build profiles. | Defines development, preview, and production builds. |
| `client/index.ts` | Expo root registration. | Calls `registerRootComponent(App)`. |
| `client/App.tsx` | Top-level navigation setup. | Creates stack navigator with `Map`, `Settings`, and `SavedRoutes`. |
| `client/.gitignore` | Ignores node modules, Expo output, native generated folders, secrets, and TS build info. | `.expo/` is ignored, but local `.expo` files are present. |

### Client Expo Local Files

These are generated by Expo local development and normally should not be committed.

| File | Purpose |
| --- | --- |
| `client/.expo/README.md` | Explains that `.expo` is local Expo state. |
| `client/.expo/settings.json` | Local Expo server setting, currently `urlRandomness`. |
| `client/.expo/devices.json` | Recently connected development devices. |
| `client/.expo/web/cache/production/images/favicon/.../favicon-48.png` | Generated web favicon cache. |

### Client Assets

| File | Purpose |
| --- | --- |
| `client/assets/icon.png` | 1024x1024 Expo app icon. |
| `client/assets/adaptive-icon.png` | 1024x1024 Android adaptive icon foreground. |
| `client/assets/splash-icon.png` | 1024x1024 splash image. |
| `client/assets/favicon.png` | 48x48 web favicon. |

### Client Source Files

| File | Purpose | Main responsibility |
| --- | --- | --- |
| `client/src/lib/api.ts` | GraphHopper API client. | Build route requests, validate Turkey bounds, normalize response, map errors. |
| `client/src/lib/geocoder.ts` | Nominatim API client. | Search for Turkey places and return display name plus coordinates. |
| `client/src/store/preferences.ts` | Zustand preference store. | Hold school-zone avoidance boolean in memory. |
| `client/src/store/savedRoutes.ts` | Zustand persisted saved routes store. | Add, remove, rename, and persist routes with AsyncStorage. |
| `client/src/components/SearchBar.tsx` | Search UI component. | Let user enter text, call geocoder, display result list, emit selected place. |
| `client/src/components/RouteSummary.tsx` | Route summary card. | Format distance/time, show save button, toggle turn-by-turn steps. |
| `client/src/components/InstructionList.tsx` | Turn-by-turn instruction list. | Render GraphHopper instructions with step numbers and distances. |
| `client/src/screens/MapScreen.native.tsx` | Native mobile map screen. | Uses `react-native-maps` for Android/iOS. |
| `client/src/screens/MapScreen.web.tsx` | Browser map screen. | Uses Leaflet/React Leaflet for web. |
| `client/src/screens/MapScreen.d.ts` | Type declaration for platform-specific MapScreen import. | Helps TypeScript resolve `./src/screens/MapScreen`. |
| `client/src/screens/SettingsScreen.tsx` | Preference screen. | Shows switch for school-zone avoidance. |
| `client/src/screens/SavedRoutesScreen.tsx` | Saved routes screen. | Lists saved routes, loads one into map, rename/delete. |

## 6. Backend Code Walkthrough

### `backend/config.yml`

```yaml
graphhopper:
  import.osm.ignored_highways: ""
  graph.encoded_values: bike_priority, bike_access, roundabout, road_class, bike_average_speed
  datareader.file: istanbul-latest.osm.pbf
  graph.location: graph-cache
```

This tells GraphHopper where to read the OSM data from and where to store/load the
imported graph. `graph.encoded_values` declares road attributes that custom models
can use. `road_class` is needed because the custom model checks whether a road is
`MOTORWAY`, `TRUNK`, or `PRIMARY`.

```yaml
profiles:
  - name: bike
    weighting: custom
    custom_model_files: [bike.json, custom-bike-model.json]
  - name: bike_school_zones
    weighting: custom
    custom_model_files: [bike.json, custom-bike-school-model.json]
```

There are two routing profiles:

1. `bike`: normal bicycle route with the base custom model.
2. `bike_school_zones`: bicycle route with the school-zone penalty model.

The frontend selects between these profiles in `api.ts`.

```yaml
server:
  application_connectors:
  - type: http
    port: 8989
    bind_host: 0.0.0.0
```

GraphHopper listens on port `8989`. `0.0.0.0` means it accepts connections from
other devices on the network, not only from `localhost`. This matters when testing
on a physical phone over Wi-Fi.

### `backend/custom-bike-model.json`

```json
{
  "priority": [
    {
      "if": "road_class == MOTORWAY || road_class == TRUNK",
      "multiply_by": 0.0
    },
    {
      "if": "road_class == PRIMARY",
      "multiply_by": 0.2
    }
  ]
}
```

This file changes how GraphHopper ranks roads:

- Motorways and trunk roads get priority multiplied by `0.0`, effectively making
  them unusable for bicycle routes.
- Primary roads get priority multiplied by `0.2`, so they are not impossible but
  are strongly discouraged.

Good interview explanation: "We did not implement a routing algorithm ourselves.
We used GraphHopper's custom model system to change road preference weights."

### `backend/custom-bike-school-model.json`

This extends the base bike model:

```json
{
  "if": "in_school_zone",
  "multiply_by": 0.1
}
```

The condition refers to the GeoJSON feature id:

```json
"id": "school_zone"
```

GraphHopper exposes the area as `in_school_zone`. The penalty makes routes through
that polygon much less attractive.

The current polygon is a mock test area around central Istanbul:

```json
[
  [28.97, 41.01],
  [28.98, 41.01],
  [28.98, 41.02],
  [28.97, 41.02],
  [28.97, 41.01]
]
```

Important coordinate detail: GeoJSON uses `[lon, lat]`, while React Native map
objects use `{ latitude, longitude }`.

### `backend/scripts/import.sh`

Important snippets:

```bash
if [ ! -f "graphhopper.jar" ]; then
    curl -L -o graphhopper.jar "https://github.com/graphhopper/graphhopper/releases/download/9.0/graphhopper-web-9.0.jar"
fi
```

Downloads GraphHopper only if it is missing.

```bash
if [ ! -f "istanbul-latest.osm.pbf" ]; then
    curl -L -o istanbul-latest.osm.pbf "https://download.bbbike.org/osm/bbbike/Istanbul/Istanbul.osm.pbf"
fi
```

Downloads Istanbul OSM data only if missing.

```bash
java -Ddw.graphhopper.datareader.file=istanbul-latest.osm.pbf -jar graphhopper.jar import config.yml
```

Runs the import process. This creates or updates `graph-cache/`.

### `backend/scripts/start.sh`

```bash
if [ ! -d "graph-cache" ]; then
    echo "Error: graph-cache directory not found. Please run import.sh first."
    exit 1
fi
```

Prevents confusing startup failures by checking that the imported graph exists.

```bash
java -jar graphhopper.jar server config.yml
```

Starts GraphHopper as a web server.

## 7. Client Code Walkthrough

### `client/index.ts`

```ts
import { registerRootComponent } from 'expo';
import App from './App';
registerRootComponent(App);
```

This is Expo's entry point. It registers `App` so the same project can run in Expo
Go, development builds, native builds, and web.

### `client/App.tsx`

```tsx
const Stack = createNativeStackNavigator();
```

Creates a native stack navigator.

```tsx
<Stack.Navigator initialRouteName="Map">
  <Stack.Screen name="Map" component={MapScreen} />
  <Stack.Screen name="Settings" component={SettingsScreen} />
  <Stack.Screen name="SavedRoutes" component={SavedRoutesScreen} />
</Stack.Navigator>
```

Defines the app screens. `Map` is the first screen. The map screen can navigate to
settings and saved routes through the `navigation` prop.

### `client/src/lib/api.ts`

This is the most important frontend file because it owns the routing backend
contract.

```ts
const BASE_URL = process.env.EXPO_PUBLIC_GRAPHHOPPER_BASE_URL || 
  (Platform.OS === 'web' ? 'http://localhost:8989' : 'http://10.2.122.52:8989');
```

The app can get the backend URL from `EXPO_PUBLIC_GRAPHHOPPER_BASE_URL`. If not
set:

- Web uses `http://localhost:8989`
- Native uses `http://10.2.122.52:8989`

Important inconsistency: `README.md` mentions a different LAN IP (`10.5.57.105`).
If the app cannot reach the backend on a phone, this fallback IP is one of the
first things to check.

```ts
export interface RouteCoordinate {
  lat: number;
  lon: number;
}
```

Internal coordinate type used for API calls. It uses `lat/lon`, not
`latitude/longitude`.

```ts
export interface RouteResponse {
  geometry: {
    type: string;
    coordinates: [number, number][];
  };
  distance: number;
  time: number;
  instructions: RouteInstruction[];
}
```

Normalized response returned to the UI. `coordinates` are `[lon, lat]` because
GraphHopper returns GeoJSON-like coordinates.

```ts
const inTurkeyBounds = (p: RouteCoordinate) =>
  p.lat >= 35.8 && p.lat <= 42.1 && p.lon >= 25.6 && p.lon <= 44.8;
```

Client-side validation that blocks obviously unsupported coordinates before
sending a backend request.

```ts
profile: avoidSchoolZones ? 'bike_school_zones' : 'bike',
points_encoded: false,
```

This selects the backend profile and requests unencoded geometry. `points_encoded:
false` is important because the UI expects raw coordinate arrays, not encoded
polyline strings.

```ts
paramsSerializer: {
  indexes: null
}
```

Axios normally serializes arrays as `point[]=...`. GraphHopper expects repeated
parameters like `point=lat,lon&point=lat,lon`, so this custom serializer matters.

```ts
const path = response.data.paths[0];
```

GraphHopper returns an array of paths. This project uses the first route.

Error handling:

- 400 with no connection/not found: `"No bicycle route found between these points."`
- Axios/network error: `"Could not reach the routing server. Please try again."`
- Bounds failure: `"This point is outside the supported area (Turkey)."`
- Missing geometry: `"Route data is unavailable. Please recalculate."`

### `client/src/lib/geocoder.ts`

```ts
axios.get('https://nominatim.openstreetmap.org/search', {
  params: {
    q: query,
    format: 'json',
    countrycodes: 'tr',
    limit: 5,
  },
  headers: {
    'User-Agent': 'PedalAnatolia/1.0 (Student Project)',
  },
});
```

This calls Nominatim directly from the client. It limits results to Turkey using
`countrycodes: 'tr'`. If the request fails, it logs the error and returns an empty
array instead of crashing the UI.

Advisor talking point: geocoding and routing are separate. Nominatim finds
coordinates from text; GraphHopper calculates paths between coordinates.

### `client/src/store/preferences.ts`

```ts
export const usePreferences = create<PreferencesState>((set) => ({
  avoidSchoolZonesDuringPeakHours: false,
  setAvoidSchoolZones: (avoid) => set({ avoidSchoolZonesDuringPeakHours: avoid }),
}));
```

This creates a simple in-memory Zustand store. It is global to the React app, so
`SettingsScreen` can update the preference and `MapScreen` can read it.

Current limitation: this preference is not persisted. Closing/restarting the app
resets it to `false`.

### `client/src/store/savedRoutes.ts`

```ts
export interface SavedRoute {
  id: string;
  name: string;
  origin: RouteCoordinate;
  destination: RouteCoordinate;
  originName: string;
  destinationName: string;
  timestamp: number;
}
```

This is the saved route data model. It stores both raw coordinates and user-facing
origin/destination names.

```ts
persist(
  (set) => ({ ... }),
  {
    name: 'pedal-anatolia-saved-routes',
    storage: createJSONStorage(() => AsyncStorage),
  }
)
```

Zustand middleware persists the saved routes into AsyncStorage. This is why saved
routes survive app restarts.

```ts
const id = Date.now().toString();
```

Routes use timestamp-based ids. Good enough for a student prototype, but a more
robust production app would use UUIDs.

### `client/src/components/SearchBar.tsx`

State:

```ts
const [query, setQuery] = useState('');
const [results, setResults] = useState<Place[]>([]);
const [isSearching, setIsSearching] = useState(false);
```

The component owns only search UI state. It does not know about routes or maps.

```ts
const result = await geocodeSearch(query);
setResults(result);
```

It delegates HTTP work to `geocoder.ts`.

```ts
onPlaceSelect(place);
setQuery(place.display_name.split(',')[0]);
setResults([]);
```

When a result is selected, the selected place is passed to the parent, the input is
shortened to the first display-name segment, and the result list is hidden.

### `client/src/components/RouteSummary.tsx`

```ts
const formatDistance = (m: number) => {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(2)} km`;
};
```

Converts GraphHopper meters to a user-readable string.

```ts
const formatTime = (ms: number) => {
  const minutes = Math.ceil(ms / 60000);
  ...
};
```

Converts GraphHopper milliseconds to minutes or hours/minutes.

```tsx
{instructions && instructions.length > 0 && (
  <TouchableOpacity onPress={() => setShowSteps(!showSteps)}>
    <Text>{showSteps ? 'Hide Steps' : 'Show Steps'}</Text>
  </TouchableOpacity>
)}
```

The component only shows step controls when GraphHopper returned instructions.

Known display issue: the save button text currently contains mojibake before
`Save Route` instead of a clean star or plain text. If asked to fix UI polish,
this is a simple string encoding cleanup.

### `client/src/components/InstructionList.tsx`

```tsx
<FlatList
  data={instructions}
  keyExtractor={(_, index) => index.toString()}
  renderItem={renderItem}
/>
```

Renders route instructions in a scrollable list. It uses the array index as the
key because instructions do not have stable ids.

```tsx
<Text style={styles.stepNumber}>{index + 1}</Text>
```

Displays human-friendly 1-based step numbers.

### `client/src/screens/SettingsScreen.tsx`

```tsx
const { avoidSchoolZonesDuringPeakHours, setAvoidSchoolZones } = usePreferences();
```

Reads and writes the global preference.

```tsx
<Switch
  value={avoidSchoolZonesDuringPeakHours}
  onValueChange={setAvoidSchoolZones}
/>
```

The switch updates Zustand directly. There is no backend call here. The backend
profile changes the next time a route is calculated.

### `client/src/screens/SavedRoutesScreen.tsx`

```tsx
const { routes, removeRoute, renameRoute } = useSavedRoutes();
```

Reads saved routes and store actions from Zustand.

```tsx
navigation.navigate('Map', {
  loadRoute: {
    origin: route.origin,
    destination: route.destination,
    originName: route.originName,
    destinationName: route.destinationName,
  }
});
```

When a saved route is selected, this navigates back to the map and passes the route
through navigation params.

```tsx
renameRoute(editingRouteId, newName.trim());
```

The rename modal only saves non-empty route names.

Known display issue: route details contain mojibake where a clean arrow or plain
`to` should be used.

### `client/src/screens/MapScreen.native.tsx`

This is the native Android/iOS map implementation.

Important state:

```ts
const [origin, setOrigin] = useState<RouteCoordinate | null>(null);
const [destination, setDestination] = useState<RouteCoordinate | null>(null);
const [route, setRoute] = useState<RouteResponse | null>(null);
const [errorText, setErrorText] = useState<string | null>(null);
const [loading, setLoading] = useState(false);
```

The screen stores selected points, current route result, loading state, and error
message.

```ts
const mapRef = useRef<MapView>(null);
```

Native map reference used to call `fitToCoordinates`.

```ts
useEffect(() => {
  if (navRoute?.params?.loadRoute) {
    ...
    calculateRoute(lOrg, lDest);
  }
}, [navRoute?.params?.loadRoute]);
```

When the saved-routes screen sends route data back, this effect loads the origin
and destination and recalculates the route.

```ts
useEffect(() => {
  if (route && route.geometry.coordinates.length > 0) {
    const coords = route.geometry.coordinates.map(c => ({ latitude: c[1], longitude: c[0] }));
    mapRef.current?.fitToCoordinates(coords, ...);
  }
}, [route]);
```

GraphHopper coordinates are `[lon, lat]`, so the map conversion is:

- `latitude = c[1]`
- `longitude = c[0]`

```ts
const calculateRoute = async (start, end) => {
  setLoading(true);
  setErrorText(null);
  setRoute(null);
  try {
    const response = await fetchRoute(start, end, avoidSchoolZonesDuringPeakHours);
    setRoute(response);
  } catch (err: any) {
    setErrorText(err.message || 'An error occurred fetching the route.');
  } finally {
    setLoading(false);
  }
};
```

This is the main route orchestration function on the UI side. It clears stale
route/error state, calls the API layer, and updates UI state.

```ts
const handleMapPress = (e: any) => {
  if (!origin) {
    setOrigin(...);
  } else if (!destination) {
    setDestination(...);
    calculateRoute(origin, dest);
  } else {
    setOrigin(...);
    setDestination(null);
    setRoute(null);
    setErrorText(null);
  }
};
```

Tap behavior:

1. First tap sets origin.
2. Second tap sets destination and calculates route.
3. Third tap resets and starts a new origin.

```tsx
<Polygon coordinates={mockSchoolZone} ... />
```

Draws a visible mock school zone on the map. This is a visual aid and does not
itself affect routing. Routing is affected by the backend custom model.

```tsx
{route && (
  <Polyline 
    coordinates={route.geometry.coordinates.map(c => ({ latitude: c[1], longitude: c[0] }))}
    strokeColor="#4A90E2"
    strokeWidth={4}
  />
)}
```

Draws the route line after successful backend response.

### `client/src/screens/MapScreen.web.tsx`

This mirrors the native map screen but uses Leaflet for browser compatibility.

```ts
if (Platform.OS === 'web') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
  });
}
```

Fixes Leaflet marker icon paths in bundled web builds.

```ts
const MapEventHandler = ({ handleMapPress }) => {
  useMapEvents({
    click: (e) => {
      handleMapPress({ nativeEvent: { coordinate: { latitude: e.latlng.lat, longitude: e.latlng.lng } } });
    },
  });
  return null;
};
```

Adapts Leaflet click events into the same shape used by `react-native-maps`. This
lets most route selection logic remain the same between native and web.

```ts
const bounds = L.latLngBounds(route.geometry.coordinates.map(c => [c[1], c[0]]));
map.fitBounds(bounds, { padding: [50, 50] });
```

Fits the Leaflet map to the returned route.

```tsx
<TileLayer
  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
/>
```

Uses public OpenStreetMap raster tiles for the web map view.

### `client/src/screens/MapScreen.d.ts`

```ts
declare const MapScreen: React.FC;
export default MapScreen;
```

This gives TypeScript a module declaration for the platform-specific map screen.
`App.tsx` imports `./src/screens/MapScreen`, and Metro/Expo selects
`MapScreen.native.tsx` or `MapScreen.web.tsx` depending on platform.

## 8. Key Data Structures

### `RouteCoordinate`

```ts
{
  lat: number;
  lon: number;
}
```

Used internally for backend calls and saved route storage.

### `Place`

```ts
{
  display_name: string;
  lat: string;
  lon: string;
}
```

Comes from Nominatim. Latitude/longitude are strings, so MapScreen parses them
with `parseFloat`.

### `RouteResponse`

```ts
{
  geometry: {
    type: string;
    coordinates: [number, number][];
  };
  distance: number;
  time: number;
  instructions: RouteInstruction[];
}
```

Normalized GraphHopper response used by map and summary UI.

### `SavedRoute`

```ts
{
  id: string;
  name: string;
  origin: RouteCoordinate;
  destination: RouteCoordinate;
  originName: string;
  destinationName: string;
  timestamp: number;
}
```

Persisted locally using AsyncStorage.

## 9. API Contracts

### GraphHopper Route Request

```text
GET http://<host>:8989/route
  ?point=<originLat>,<originLon>
  &point=<destinationLat>,<destinationLon>
  &profile=bike
  &points_encoded=false
```

For school-zone avoidance:

```text
profile=bike_school_zones
```

### GraphHopper Response Used by Client

```json
{
  "paths": [
    {
      "points": {
        "type": "LineString",
        "coordinates": [[28.97, 41.01], [28.98, 41.02]]
      },
      "distance": 1200,
      "time": 360000,
      "instructions": []
    }
  ]
}
```

### Nominatim Search Request

```text
GET https://nominatim.openstreetmap.org/search
  ?q=<query>
  &format=json
  &countrycodes=tr
  &limit=5
```

Header:

```text
User-Agent: PedalAnatolia/1.0 (Student Project)
```

## 10. How to Run the Project

### Backend

From `backend/`:

```bash
./scripts/import.sh
./scripts/start.sh
```

Expected backend URL:

```text
http://localhost:8989/route
```

On a phone, use the PC's LAN IP instead of `localhost`.

### Client

From `client/`:

```bash
npm install
npm run start
```

Platform-specific:

```bash
npm run android
npm run ios
npm run web
```

If using PowerShell and `npx` is blocked by execution policy, `npx.cmd` works:

```powershell
npx.cmd tsc --noEmit
```

## 11. Verification Done While Writing This Guide

TypeScript compile check:

```powershell
cd client
npx.cmd tsc --noEmit
```

Result: passed with exit code 0.

Note: plain `npx tsc --noEmit` failed in PowerShell because script execution is
disabled for `npx.ps1`; `npx.cmd` bypassed that shell policy issue.

## 12. Common Advisor Questions and Strong Answers

### Why did you use GraphHopper instead of implementing Dijkstra/A* yourself?

GraphHopper already provides a robust routing engine, OSM import pipeline, spatial
indexing, turn instructions, and profile configuration. The project goal was not
to invent a routing engine but to build a bicycle-focused routing system for
Turkey. We used custom models to adapt routing behavior for cyclists.

### What exactly does the backend do?

It imports OSM PBF data into a graph cache and serves `/route` requests. It has
two bicycle profiles: normal bike routing and school-zone-aware bike routing.
The backend does not geocode text and does not store users.

### What exactly does the client do?

The client handles UI, map display, text search, route request construction, route
rendering, preferences, and saved route persistence. It calls GraphHopper for
routes and Nominatim for search.

### Where is the routing algorithm?

Inside GraphHopper. In our repo, we configure it through `backend/config.yml` and
custom model JSON files. The app does not implement shortest path directly.

### How do school zones work?

There are two GraphHopper profiles. The settings toggle makes the client request
`profile=bike_school_zones`. That profile uses `custom-bike-school-model.json`,
which defines a GeoJSON polygon and applies a `0.1` priority multiplier inside
that area.

### Does the visible red polygon control routing?

No. The polygon in `MapScreen.native.tsx` and `MapScreen.web.tsx` is only visual.
Actual routing changes come from the backend custom model.

### What happens if the backend is down?

Axios throws a network error. `fetchRoute` catches it and throws a user-friendly
error: `"Could not reach the routing server. Please try again."`

### Why do you set `points_encoded=false`?

GraphHopper can return encoded polylines, but the client expects a raw coordinate
array. `points_encoded=false` gives a GeoJSON-like `coordinates` array, which is
easy to draw on both React Native Maps and Leaflet.

### Why are coordinates sometimes `[lon, lat]` and sometimes `{lat, lon}`?

GraphHopper/GeoJSON returns `[longitude, latitude]`. React Native Maps expects
objects with `{ latitude, longitude }`. Internal API types use `{ lat, lon }`.
The map screens convert between these formats before rendering.

### Why are there separate native and web MapScreen files?

React Native Maps is for native mobile. Leaflet is for browser/web. Expo platform
resolution picks `MapScreen.native.tsx` or `MapScreen.web.tsx` depending on the
target platform.

### Is the preference persisted?

No. `preferences.ts` uses plain Zustand without persistence. Saved routes are
persisted because `savedRoutes.ts` uses Zustand persist middleware with
AsyncStorage.

### Is the saved route feature backend-based?

No. It is local-only. Routes are saved on the device through AsyncStorage. There
are no user accounts or database.

### What are the biggest current limitations?

- Routing data is currently Istanbul extract, not full Turkey.
- School zone data is a mock polygon, not a real national dataset.
- The school-zone toggle does not check actual peak hours.
- The native backend fallback IP in `api.ts` may not match the README.
- Some UI strings have encoding artifacts before `Save Route` and between route
  endpoints.
- There are no automated tests in the repo.

## 13. Live Modification Recipes

### Change the Backend IP Used by the Phone

File: `client/src/lib/api.ts`

Change:

```ts
Platform.OS === 'web' ? 'http://localhost:8989' : 'http://10.2.122.52:8989'
```

Better live-demo approach:

```powershell
$env:EXPO_PUBLIC_GRAPHHOPPER_BASE_URL="http://<PC-LAN-IP>:8989"
npm run start
```

### Make Preferences Persist After App Restart

File: `client/src/store/preferences.ts`

Use the same pattern as `savedRoutes.ts`:

- Import `persist` and `createJSONStorage`.
- Import `AsyncStorage`.
- Wrap the store with `persist(...)`.
- Choose a storage key like `pedal-anatolia-preferences`.

### Add a Real School Zone

File: `backend/custom-bike-school-model.json`

Add another GeoJSON feature:

```json
{
  "type": "Feature",
  "id": "another_school_zone",
  "properties": {},
  "geometry": {
    "type": "Polygon",
    "coordinates": [
      [
        [lon1, lat1],
        [lon2, lat2],
        [lon3, lat3],
        [lon1, lat1]
      ]
    ]
  }
}
```

Then add a condition:

```json
{
  "if": "in_another_school_zone",
  "multiply_by": 0.1
}
```

After backend model changes, rerun import/start if GraphHopper requires cache
regeneration for the changed profile.

### Change the Road Preference Rules

File: `backend/custom-bike-model.json`

Examples:

- Make primary roads less discouraged: change `0.2` to `0.5`.
- Fully block primary roads: change `0.2` to `0.0`.
- Add a rule for another supported GraphHopper encoded value only if it is present
  in `graph.encoded_values`.

### Add a "Clear Route" Button

Files:

- `client/src/screens/MapScreen.native.tsx`
- `client/src/screens/MapScreen.web.tsx`

Add a handler:

```ts
const clearRoute = () => {
  setOrigin(null);
  setDestination(null);
  setOriginName('Map Point');
  setDestinationName('Map Point');
  setRoute(null);
  setErrorText(null);
};
```

Then add a button near the existing header buttons.

### Fix Mojibake UI Text

Files:

- `client/src/components/RouteSummary.tsx`
- `client/src/screens/SavedRoutesScreen.tsx`

Replace corrupted strings:

```tsx
<Text style={styles.saveButtonText}>Save Route</Text>
```

```tsx
{item.originName} to {item.destinationName}
```

### Add Route Sorting

File: `client/src/screens/SavedRoutesScreen.tsx`

Before rendering:

```ts
const sortedRoutes = [...routes].sort((a, b) => b.timestamp - a.timestamp);
```

Then pass `sortedRoutes` to `FlatList`.

### Add Timeout to Backend Requests

File: `client/src/lib/api.ts`

Inside `axios.get` config:

```ts
timeout: 10000,
```

This prevents the UI from waiting too long when the backend is unreachable.

### Support Full Turkey Data

Backend changes:

1. Replace `istanbul-latest.osm.pbf` with a Turkey PBF.
2. Update `backend/config.yml` `datareader.file`.
3. Delete or regenerate `backend/graph-cache`.
4. Run `backend/scripts/import.sh`.
5. Restart GraphHopper.

Client change:

- Review the Turkey bounding box in `client/src/lib/api.ts`.

## 14. Codebase Weak Points to Be Ready to Discuss

### Backend URL Mismatch

`README.md` says the native client is configured for `10.5.57.105`, but
`client/src/lib/api.ts` currently falls back to `10.2.122.52`.

Strong explanation: LAN IPs change depending on network. The correct long-term
solution is to use `EXPO_PUBLIC_GRAPHHOPPER_BASE_URL` instead of hardcoding a
personal machine IP.

### School Zone Toggle Name Is Over-Specific

The state is called `avoidSchoolZonesDuringPeakHours`, but the code does not
check current time. It always uses the school-zone profile when enabled.

Strong explanation: the backend profile is implemented; time-window logic is a
future frontend condition or backend policy addition.

### Local Saved Routes Are Implemented Despite Older Docs Saying No

`.agents/rules/architecture.md` says saved trips are not in v1. Current code has
`SavedRoutesScreen.tsx` and `savedRoutes.ts`.

Strong explanation: the documentation is partially stale because saved routes were
added later as a local-only feature, not as a backend user-account feature.

### Generated Files Are Present

`client/.expo/` and `backend/graph-cache/` are generated. The cache is useful for
demo speed, but normally teams avoid committing local/generated files unless they
have a reason.

Strong explanation: `graph-cache` lets the demo start without reimporting OSM data.
`.expo/` is local development state and should usually remain ignored.

### No Automated Tests

The repo currently has TypeScript strict mode and compiles, but no unit/integration
test files.

Strong explanation: manual smoke testing covered the MVP; automated tests would be
the next quality step. Good targets are `api.ts` error handling, Zustand store
actions, and component rendering.

## 15. Best Files to Open During a Live Interview

If asked about architecture:

- `README.md`
- `backend/config.yml`
- `client/src/lib/api.ts`
- `client/src/screens/MapScreen.native.tsx`

If asked about routing:

- `backend/config.yml`
- `backend/custom-bike-model.json`
- `backend/custom-bike-school-model.json`
- `client/src/lib/api.ts`

If asked about UI flow:

- `client/App.tsx`
- `client/src/screens/MapScreen.native.tsx`
- `client/src/components/SearchBar.tsx`
- `client/src/components/RouteSummary.tsx`

If asked about persistence:

- `client/src/store/savedRoutes.ts`
- `client/src/screens/SavedRoutesScreen.tsx`
- `client/src/store/preferences.ts`

If asked about web support:

- `client/src/screens/MapScreen.web.tsx`
- `client/src/screens/MapScreen.d.ts`

## 16. Short Glossary

| Term | Meaning in this project |
| --- | --- |
| GraphHopper | Java routing engine used as backend. |
| OSM | OpenStreetMap, the source of road network data. |
| PBF | Binary OSM extract format used for import. |
| Graph cache | GraphHopper's imported, optimized routing data on disk. |
| Custom model | GraphHopper JSON rules that adjust road priority/speed. |
| Profile | Named routing behavior, such as `bike` or `bike_school_zones`. |
| Nominatim | OSM-based geocoding service used for text search. |
| Zustand | Lightweight global state library for React. |
| AsyncStorage | React Native persistent key/value storage. |
| Leaflet | Browser map rendering library used for web target. |
| React Native Maps | Native map rendering library used for Android/iOS. |

## 17. Final Mental Model

Remember this distinction:

- The backend decides which roads are good or bad for cycling.
- The frontend decides what the user selected, which profile to ask for, and how
  to display the returned route.

If you can explain `config.yml`, the two custom model JSON files, `api.ts`, and
the two MapScreen implementations, you can answer most technical questions about
this project.
