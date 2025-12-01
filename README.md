# Pakistan Cricket Chairman

A browser-based management simulator where you lead Pakistan cricket through scheduling, player development, and financial decisions. Open `index.html` in a modern browser to play.

## Saving and loading

The game automatically saves progress in your browser's `localStorage` every 60 seconds and before closing the tab. Use the in-game **Save Game** and **Load Game** buttons to manage saves manually.

## Development notes

- Core logic lives in `main.js` and UI helpers in `ui.js`.
- Player data and initial pundits are stored in `players.js`.
- Persistence utilities, including save/load handling, are in `persistence.js`.
