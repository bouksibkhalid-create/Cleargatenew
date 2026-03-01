import { Font } from '@react-pdf/renderer';

let fontsRegistered = false;

// Fontsource CDN — serves verified .ttf files (required by @react-pdf/renderer)
const FS = 'https://cdn.jsdelivr.net/fontsource/fonts';

export function registerFonts() {
  if (fontsRegistered) return;

  try {
    Font.register({
      family: 'Inter',
      fonts: [
        { src: `${FS}/inter@latest/latin-400-normal.ttf`, fontWeight: 'normal' },
        { src: `${FS}/inter@latest/latin-500-normal.ttf`, fontWeight: 500 },
        { src: `${FS}/inter@latest/latin-600-normal.ttf`, fontWeight: 600 },
        { src: `${FS}/inter@latest/latin-700-normal.ttf`, fontWeight: 'bold' },
      ],
    });

    Font.register({
      family: 'RobotoMono',
      fonts: [
        { src: `${FS}/roboto-mono@latest/latin-400-normal.ttf`, fontWeight: 'normal' },
      ],
    });
  } catch (err) {
    console.warn('Font registration failed, PDF will use fallback fonts:', err);
  }

  Font.registerHyphenationCallback((word) => [word]);

  fontsRegistered = true;
}
