# Pedal Anatolia

Graduation project for bicycle routing in Turkey using GraphHopper, Expo, and Supabase.

## Supabase setup

1. Create a Supabase project.
2. Open the project's SQL Editor.
3. Run all of `client/supabase-schema.sql`.
4. In `client/.env`, configure:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

5. In Supabase Authentication -> Sign In / Providers, keep Email enabled and turn off `Confirm email` so registration creates a session immediately.
6. Register the first account through the app.
7. Promote that account from the SQL Editor:

```sql
update public.profiles
set role = 'admin'
where email = 'your-admin-email@example.com';
```

New registrations are always regular users. Passwords are managed by Supabase Auth and are never stored in the public database or local app state.

## Run

Start GraphHopper:

```powershell
cd backend
java -jar graphhopper.jar server config.yml
```

Start the Expo app:

```powershell
cd client
npx expo start -c
```

Use `EXPO_PUBLIC_GRAPHHOPPER_BASE_URL=http://YOUR_PC_IP:8989` when automatic backend discovery is not suitable.

## Data model

- `auth.users`: credentials and authentication sessions, managed by Supabase.
- `public.profiles`: name, age, email mirror, and application role.
- `public.user_monthly_distances`: monthly route totals.
- `public.school_zone_reports`: submitted and reviewed school-zone reports.

Row Level Security restricts profiles and distances to their owner or an admin. Only admins can approve or reject school-zone reports.
