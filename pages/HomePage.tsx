import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getQuoteOfTheDay } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';
import { SlidersHorizontal, BookOpen, Sun, Info, FileCog, Image as ImageIcon } from 'lucide-react';

const HomePage: React.FC = () => {
  const [quote, setQuote] = useState<string>('');
  const { t } = useLanguage();

  useEffect(() => {
    const fetchQuote = async () => {
      const today = new Date().toISOString().split('T')[0];
      const cachedQuoteData = localStorage.getItem('dailyQuote');

      if (cachedQuoteData) {
        try {
          const { quote: cachedQuote, date } = JSON.parse(cachedQuoteData);
          if (date === today) {
            setQuote(cachedQuote);
            return;
          }
        } catch (e) {
            console.error("Failed to parse cached quote, fetching new one.", e);
        }
      }
      
      setQuote(t('home.loadingQuote'));
      const dailyQuote = await getQuoteOfTheDay();
      setQuote(dailyQuote);
      localStorage.setItem('dailyQuote', JSON.stringify({ quote: dailyQuote, date: today }));
    };
    fetchQuote();
  }, [t]);

  const features = [
    { name: 'dailyTools', path: '/daily-tools', icon: <SlidersHorizontal size={24} /> },
    { name: 'pdfTools', path: '/pdf-tools', icon: <FileCog size={24} /> },
    { name: 'imageTools', path: '/image-tools', icon: <ImageIcon size={24} /> },
    { name: 'stories', path: '/stories', icon: <BookOpen size={24} /> },
    { name: 'weather', path: '/weather', icon: <Sun size={24} /> },
    { name: 'about', path: '/about', icon: <Info size={24} /> },
  ];

  return (
    <div className="space-y-12">
      <section className="text-center bg-white p-10 rounded-xl shadow-lg">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-dark">{t('home.welcome')} <span className="text-primary">{t('header.title')}</span></h1>
        <p className="mt-4 text-lg text-gray-medium max-w-2xl mx-auto">{t('home.description')}</p>
      </section>

      <section>
        <div className="bg-primary text-white p-8 rounded-xl shadow-lg text-center">
            <h2 className="text-2xl font-bold mb-2">{t('home.quoteTitle')}</h2>
            <blockquote className="text-lg italic">
              "{quote || t('home.loadingQuote')}"
            </blockquote>
        </div>
      </section>

      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <Link to={feature.path} key={feature.name} className="block group">
                <div className="bg-white p-8 rounded-xl shadow-lg h-full transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="text-primary">{feature.icon}</div>
                        <h3 className="text-2xl font-bold text-gray-dark">{t(`nav.${feature.name}`)}</h3>
                    </div>
                    <p className="text-gray-medium">{t(`home.feature_${feature.name}`)}</p>
                </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;