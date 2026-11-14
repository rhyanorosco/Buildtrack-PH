# BuildTrack PH

House Construction Cost & Resource Management — React Native + Expo Go (JavaScript, Expo Router, AsyncStorage).

## Run it (Windows + Android phone)

Requirements: Node.js LTS installed on your PC, and the **Expo Go** app from the Google Play Store on your phone.

```bash
cd C:\Users\RHYAN\ARONG\buildtrack-ph
npm install
npx expo install expo@latest     # match the SDK that the current Expo Go app supports
npx expo install --fix           # align every Expo package to that SDK
npx expo start
```

Then open Expo Go on your phone and scan the QR code shown in the terminal.
Your phone and PC must be on the same Wi-Fi. If it can't connect, run `npx expo start --tunnel`.

Press `r` in the terminal to reload, or shake the phone to open the developer menu.

## Folder structure

```
app/                     Expo Router routes (file = screen)
  _layout.jsx            Root: safe area + ProjectProvider + loading/error gate
  (tabs)/_layout.jsx     Bottom tab bar
  (tabs)/index.jsx       Home / Dashboard
  (tabs)/projects.jsx    Projects
  (tabs)/resources.jsx   Materials | Equipment | Manpower
  (tabs)/expenses.jsx    Expense log
  (tabs)/reports.jsx     Cost summary, budget vs actual, progress
  (tabs)/settings.jsx    Wage references, disclaimer, reset data
components/              Reusable UI (cards, buttons, bars, badges)
constants/               Theme colors/spacing + statuses & categories
context/                 ProjectContext — app-wide data for all screens
data/                    SAMPLE data (labelled Sample / User-Editable)
services/                storage.js (AsyncStorage), dataService.js, budgetService.js
utils/                   currency.js, dates.js, calculations.js (all formulas), id.js
```

## Data rules

- All prices and wages are **sample data**, each with location, date and source. They are not live market rates.
- Government minimum wage references (DOLE/NWPC Wage Orders) are kept separate from project wages. They start out empty and you fill them in.
- **Actual spending = recorded expenses.** Estimates come from the resource plans.
- Estimates are only for preliminary planning. They don't replace professional plans or engineers.
