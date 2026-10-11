# GymCals

A personal app for a 12-week gym + calisthenics plan. It's an installable web app (PWA) that works offline, keeps all data on the device, and uses only free resources.

## Features

- **Today**: today's session, a weekly strip, coach tips you can tap through, daily targets and a Sunday week-in-review.
- **Workout logger**:
  - weights and reps pre-filled by the coach (double progression)
  - previous-session column
  - rest timer with vibration, sound and a background notification
  - warm-up checklist, and warm-up sets with plate loading for barbell lifts
  - swap an exercise when equipment is busy
- **Exercise pages**: an embedded YouTube form video, start and finish photos, numbered steps, a common mistake, an anatomical muscle map with tap-to-focus, and your history chart.
- **Plan**: the 12-week phases with a week 7 deload, this week's schedule, and a 5-day mode.
- **Progress**: weight against the target pace, waist, best lifts, skill tests and private progress photos with side-by-side compare.
- **Skills**: push, pull and core levels, a first-pull-up milestone, and test logging.
- **Check-in**: weight, waist, protein quick-add (Indian foods), sleep, steps and recovery. It saves automatically.
- **Settings**: start date, targets, timer alerts, 5-day mode, and JSON backup export and import.
- Light and dark mode follow the phone's setting.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173 — also prints a network URL for your phone
npm run build      # production build in dist/
npm run preview    # serve the build at http://localhost:4173
```

To open it on your phone, connect it to the same Wi-Fi as your computer and open the **Network** URL that `npm run dev` prints. To install it, use the browser menu: **Add to Home screen** on Android or **Share → Add to Home Screen** on iPhone.

Installing as an app and offline mode need HTTPS. A free host such as GitHub Pages or Netlify gives you that. The build uses relative paths, so `dist/` works from any folder.

## Free sources

| What | Source | Licence |
| --- | --- | --- |
| Exercise photos | [free-exercise-db](https://github.com/yuhonas/free-exercise-db) | Public domain |
| Muscle maps | [wger.de](https://wger.de) | CC BY-SA 3.0 |
| Form videos | YouTube embeds from each creator's channel (`src/data/videos.json`) | Embedded, not copied |

`npm run assets` downloads the photos and muscle maps into `public/` again. The video IDs were checked with YouTube's free oEmbed endpoint.

## Code map

- `src/data/`: the plan (`plan.ts`), exercise library (`exercises.ts`), muscle catalog (`muscles.ts`) and videos.
- `src/lib/`: the store (localStorage), coach logic, dates, rest timer, warm-up maths, weekly review and photos (IndexedDB).
- `src/screens/`: one file per screen.
- `src/components/`: tab bar, sheets, body map, video player, charts and rest bar.

All data stays on the device. Progress photos are not included in the JSON backup.
