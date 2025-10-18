export interface NavLink {
  key: string;
  path: string;
}

export interface WeatherData {
  current: {
    temperature_2m: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  }
}

export interface CurrencyData {
  success: boolean;
  base: string;
  date: string;
  rates: { [key: string]: number };
}

export interface MoralStory {
  title: string;
  paragraphs: string[];
}