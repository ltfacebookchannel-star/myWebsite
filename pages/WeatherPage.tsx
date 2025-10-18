import React, { useState, useEffect, useCallback } from 'react';
import { getWeatherData } from '../services/apiService';
import { WeatherData } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { Sun, Cloud, CloudRain, CloudSnow, Wind } from 'lucide-react';

const WeatherPage: React.FC = () => {
  const [city, setCity] = useState<string>('London');
  const [searchQuery, setSearchQuery] = useState<string>('London');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { language, t } = useLanguage();

  const fetchWeather = useCallback(async (cityName: string) => {
    if (!cityName) return;

    const fetchCoordinates = async (name: string) => {
      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${name}&count=1&language=en&format=json`);
      if (!response.ok) throw new Error(t('weather.coordError'));
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return { latitude: data.results[0].latitude, longitude: data.results[0].longitude };
      }
      throw new Error(t('weather.cityNotFound', { city: name }));
    };

    setLoading(true);
    setError(null);
    setWeather(null);
    try {
      const { latitude, longitude } = await fetchCoordinates(cityName);
      const data = await getWeatherData(latitude, longitude);
      setWeather(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchWeather(searchQuery);
  }, [searchQuery, fetchWeather]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (city.trim()) {
      setSearchQuery(city);
    }
  };

  const getWeatherIcon = (code: number, size: string = 'w-16 h-16') => {
    const className = `${size}`;
    if ([0, 1].includes(code)) return <Sun className={`${className} text-yellow-400`} />;
    if ([2, 3].includes(code)) return <Cloud className={`${className} text-gray-400`} />;
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return <CloudRain className={`${className} text-blue-400`} />;
    if ([71, 73, 75, 77, 85, 86].includes(code)) return <CloudSnow className={`${className} text-blue-200`} />;
    return <Sun className={`${className} text-yellow-400`} />;
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-dark">{t('nav.weather')}</h1>
      <p className="text-gray-medium">{t('weather.description')}</p>

      <div className="bg-white rounded-xl shadow-lg p-8">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 mb-8">
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder={t('weather.placeholder')}
            className="flex-grow p-3 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-white py-3 px-6 rounded-md hover:bg-primary-dark transition-colors disabled:bg-gray-400"
          >
            {loading ? t('weather.searching') : t('weather.search')}
          </button>
        </form>

        {loading && <div className="text-center p-4">{t('weather.loading')}</div>}
        {error && <p className="text-red-500 text-center p-4">{error}</p>}
        
        {weather && (
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-dark capitalize">{searchQuery}</h2>
            <div className="flex justify-center my-4">
                {getWeatherIcon(weather.current.weather_code, 'w-24 h-24')}
            </div>
            <p className="text-6xl font-extrabold text-gray-dark">{Math.round(weather.current.temperature_2m)}°C</p>
            <div className="flex justify-center items-center gap-4 mt-4 text-gray-medium">
                <Wind className="w-6 h-6" />
                <span>{weather.current.wind_speed_10m} km/h</span>
            </div>
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                {weather.daily.time.slice(1, 5).map((time, index) => (
                    <div key={time} className="bg-light p-4 rounded-lg">
                        <p className="font-semibold">{new Date(time).toLocaleDateString(language, { weekday: 'short' })}</p>
                        <div className="flex justify-center my-2">{getWeatherIcon(weather.daily.weather_code[index+1], 'w-10 h-10')}</div>
                        <p className="text-sm font-semibold">
                            {Math.round(weather.daily.temperature_2m_max[index+1])}° / {Math.round(weather.daily.temperature_2m_min[index+1])}°
                        </p>
                    </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherPage;