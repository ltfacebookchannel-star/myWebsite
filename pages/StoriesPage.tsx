import React, { useState, useEffect, useCallback } from 'react';
import { generateMoralStory } from '../services/geminiService';
import { MoralStory } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const StoriesPage: React.FC = () => {
  const [story, setStory] = useState<MoralStory | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { language, t } = useLanguage();

  const fetchNewStory = useCallback(async (cacheResult: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      setStory(null);
      const generatedStory = await generateMoralStory(language);
      if (!generatedStory || !generatedStory.title || !generatedStory.paragraphs) {
          throw new Error("Received an invalid story format.");
      }
      setStory(generatedStory);
      
      if (cacheResult) {
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem(`dailyStory_${language}`, JSON.stringify({ story: generatedStory, date: today }));
      }
    } catch (err) {
      setError(t('stories.loadError'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [language, t]);

  useEffect(() => {
    const loadInitialStory = () => {
      const today = new Date().toISOString().split('T')[0];
      const cachedStoryData = localStorage.getItem(`dailyStory_${language}`);

      if (cachedStoryData) {
        try {
            const { story: cachedStory, date } = JSON.parse(cachedStoryData);
            if (date === today) {
                setStory(cachedStory);
                setLoading(false);
                return;
            }
        } catch (e) {
            console.error("Failed to parse cached story, fetching new one.", e);
        }
      }
      fetchNewStory(true);
    };
    
    loadInitialStory();
  }, [language, fetchNewStory]);


  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-6"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      );
    }

    if (error) {
        return <p className="text-center text-red-500">{error}</p>
    }

    if (story) {
      return (
        <div className="text-center">
          <h2 className="text-3xl font-bold text-primary mb-6">{story.title}</h2>
          <div className="space-y-4 text-gray-dark text-lg text-start">
            {story.paragraphs.map((p, index) => (
              <p key={index}>{p}</p>
            ))}
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-dark">{t('nav.stories')}</h1>
      <p className="text-gray-medium">{t('stories.description')}</p>

      <div className="bg-white rounded-xl shadow-lg p-8 min-h-[400px] flex flex-col justify-center">
        {renderContent()}
      </div>
       <div className="text-center">
        <button
          onClick={() => fetchNewStory(false)}
          disabled={loading}
          className="bg-secondary text-white font-bold py-2 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:bg-gray-400"
        >
          {loading ? t('stories.loading') : t('stories.readAnother')}
        </button>
      </div>
    </div>
  );
};

export default StoriesPage;