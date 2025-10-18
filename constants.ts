export interface NavLink {
  key: string;
  path: string;
}

export const NAV_LINKS: NavLink[] = [
  { key: 'home', path: '/' },
  { key: 'dailyTools', path: '/daily-tools' },
  { key: 'pdfTools', path: '/pdf-tools' },
  { key: 'imageTools', path: '/image-tools' },
  { key: 'stories', path: '/stories' },
  { key: 'weather', path: '/weather' },
  { key: 'about', path: '/about' },
];

export const WEATHER_API_BASE = 'https://api.open-meteo.com/v1/forecast';
export const CURRENCY_API_BASE = 'https://api.exchangerate.host/latest';