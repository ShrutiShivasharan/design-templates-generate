# Template Studio (Next.js, no database)

Upload a design image, turn it into a reusable template, then fill it with photos and text and download a ZIP.

## Run
1. Install Node.js 18+.
2. `npm install`
3. `npm run dev` and open http://localhost:3000

Production: `npm run build && npm start`

## How it works
- **Templates** (`/templates`): create, edit, duplicate, rename and delete. Upload a design image and the app finds photo and text areas in the browser. Drag boxes to move or resize them, then style each one.
- **Create design** (`/create`): pick a template, add photos and text, see the design build live.
- **Download**: PNG, or a ZIP with `images/`, `details.json` (your text) and `design-preview.png`.
- Storage is IndexedDB in your browser. Nothing is uploaded anywhere.

Detection is a heuristic (colour and density analysis), so always check the boxes it finds. Works best on clean designs with a plain background.
