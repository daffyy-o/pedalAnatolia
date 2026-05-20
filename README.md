# Pedal Anatolia

Graduation project — bicycle routing for Turkey (GraphHopper + Expo).

## Run

**Backend:** `cd backend` → `java -jar graphhopper.jar server config.yml`  
**App:** `cd client` → set `.env` with `EXPO_PUBLIC_GRAPHHOPPER_BASE_URL=http://YOUR_PC_IP:8989` → `npx expo start --go`

## School zone reports

| Who | What |
|-----|------|
| User | Map → **Report**, or Settings → **Report a school zone**, or **long-press** map |
| Developer | Settings → **Developer mode** ON → **Review reports** → **Approve** / **Reject** |

- **Approve missing** → red zone added on map  
- **Approve false** → zone removed on map  
- **Reject** → no change  

Reports are saved on the device (AsyncStorage).

School zones file: `backend/data/school-zones.geojson` — run `python scripts/build_school_model.py` after editing.
