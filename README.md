# Romantic Date Invitation Web App

A responsive, single-page romantic date invitation. It lets your wife:

1. Accept the invitation.
2. Pick a future date and time.
3. Choose food.
4. Choose a place.
5. View a polished date summary.
6. Copy the plan, save it as a PNG, or share the PNG through the phone's native share sheet.

## Run it

### Easiest
Open `index.html` in a modern browser. The planning flow, copy fallback and image download work directly.

### Recommended for full sharing and installation
Serve the folder through localhost or deploy it to any HTTPS static host:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

Web Share with image files requires a compatible browser and usually HTTPS or localhost. On iPhone/Android, tapping a platform button creates the image and opens the native share sheet; choose WhatsApp, Messenger, Facebook, Instagram or Messages there. Browsers do not allow websites to silently preselect an installed social app or upload an image without user confirmation.

## Personalise it

At the top of `app.js`, edit `APP_CONFIG` if desired. Food and place choices are also defined near the top of that file.

## Files

- `index.html` – app structure
- `styles.css` – romantic responsive design
- `app.js` – calendar, selections, summary image, copy/share logic
- `manifest.webmanifest` and `sw.js` – installable/offline PWA support
- `favicon.svg` – app icon
