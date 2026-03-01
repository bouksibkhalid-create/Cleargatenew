import { Font } from '@react-pdf/renderer';

let fontsRegistered = false;

export function registerFonts() {
  if (fontsRegistered) return;

  Font.register({
    family: 'Inter',
    fonts: [
      { src: '/fonts/Inter-Regular.ttf', fontWeight: 'normal' },
      { src: '/fonts/Inter-Medium.ttf', fontWeight: 500 },
      { src: '/fonts/Inter-SemiBold.ttf', fontWeight: 600 },
      { src: '/fonts/Inter-Bold.ttf', fontWeight: 'bold' },
    ],
  });

  Font.register({
    family: 'RobotoMono',
    fonts: [
      { src: '/fonts/RobotoMono-Regular.ttf', fontWeight: 'normal' },
    ],
  });

  Font.register({
    family: 'Montserrat',
    fonts: [
      { src: '/fonts/Montserrat-Regular.ttf', fontWeight: 'normal' },
      { src: '/fonts/Montserrat-Bold.ttf', fontWeight: 'bold' },
    ],
  });

  Font.register({
    family: 'OpenSans',
    fonts: [
      { src: '/fonts/OpenSans-Regular.ttf', fontWeight: 'normal' },
      { src: '/fonts/OpenSans-SemiBold.ttf', fontWeight: 600 },
    ],
  });

  Font.registerHyphenationCallback((word) => [word]);

  fontsRegistered = true;
}
