# PWA Icons

Generate PWA icons in these sizes from `favicon.svg`:

- `pwa-192x192.png` (192×192)
- `pwa-512x512.png` (512×512)
- `apple-touch-icon.png` (180×180)
- `favicon.ico` (32×32)

You can use online tools like:
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator

Or use `sharp` from CLI:
```bash
npx sharp-cli -i favicon.svg -o pwa-192x192.png resize 192 192
npx sharp-cli -i favicon.svg -o pwa-512x512.png resize 512 512
npx sharp-cli -i favicon.svg -o apple-touch-icon.png resize 180 180
```

Drop the resulting files into this `public/` folder. The manifest in `vite.config.js` already references them.
