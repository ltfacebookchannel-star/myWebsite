
import { WEATHER_API_BASE, CURRENCY_API_BASE } from '../constants';
import { WeatherData, CurrencyData } from '../types';

export const getWeatherData = async (latitude: number, longitude: number): Promise<WeatherData> => {
  const params = `?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
  const response = await fetch(`${WEATHER_API_BASE}${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch weather data');
  }
  return response.json();
};

export const getCurrencyRates = async (base: string = 'USD'): Promise<CurrencyData> => {
  const response = await fetch(`${CURRENCY_API_BASE}?base=${base}`);
  if (!response.ok) {
    throw new Error('Failed to fetch currency data');
  }
  return response.json();
};
