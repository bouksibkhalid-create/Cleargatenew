import { Font } from '@react-pdf/renderer';

let fontsRegistered = false;

function fontUrl(path: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}${path}`;
}

export function registerFonts() {
  if (fontsRegistered) return;

  try {
    Font.register({
      family: 'Inter',
      fonts: [
        { src: fontUrl('/fonts/Inter-Regular.ttf'), fontWeight: 'normal' },
        { src: fontUrl('/fonts/Inter-Medium.ttf'), fontWeight: 500 },
        { src: fontUrl('/fonts/Inter-SemiBold.ttf'), fontWeight: 600 },
        { src: fontUrl('/fonts/Inter-Bold.ttf'), fontWeight: 'bold' },
      ],
    });

    Font.register({
      family: 'RobotoMono',
      fonts: [
        { src: fontUrl('/fonts/RobotoMono-Regular.ttf'), fontWeight: 'normal' },
      ],
    });

    Font.register({
      family: 'Montserrat',
      fonts: [
        { src: fontUrl('/fonts/Montserrat-Regular.ttf'), fontWeight: 'normal' },
        { src: fontUrl('/fonts/Montserrat-Bold.ttf'), fontWeight: 'bold' },
      ],
    });

    Font.register({
      family: 'OpenSans',
      fonts: [
        { src: fontUrl('/fonts/OpenSans-Regular.ttf'), fontWeight: 'normal' },
        { src: fontUrl('/fonts/OpenSans-SemiBold.ttf'), fontWeight: 600 },
      ],
    });
  } catch (err) {
    console.warn('Font registration failed, PDF will use fallback fonts:', err);
  }

  Font.registerHyphenationCallback((word) => [word]);

  fontsRegistered = true;
}
