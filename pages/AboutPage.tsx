import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const AboutPage: React.FC = () => {
  const [formState, setFormState] = useState({ name: '', email: '', message: '' });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { t } = useLanguage();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { id, value } = e.target;
      setFormState(prevState => ({ ...prevState, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      console.log('Form submitted:', formState);
      setIsSubmitted(true);
      setFormState({ name: '', email: '', message: '' });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
      <h1 className="text-3xl font-bold text-gray-dark flex items-center gap-3">
        {t('about.title')} <Heart className="text-red-500" />
      </h1>
      <div className="prose max-w-none text-gray-medium">
        <p>{t('about.p1')}</p>
        <p>{t('about.p2')}</p>
        <p>{t('about.p3')}</p>
        <ul>
          <li><strong>{t('about.li1_strong')}:</strong> {t('about.li1_text')}</li>
          <li><strong>{t('about.li2_strong')}:</strong> {t('about.li2_text')}</li>
          <li><strong>{t('about.li3_strong')}:</strong> {t('about.li3_text')}</li>
          <li><strong>{t('about.li4_strong')}:</strong> {t('about.li4_text')}</li>
        </ul>
        <h2 className="text-2xl font-bold text-gray-dark mt-8">{t('about.contactTitle')}</h2>
        <p>{t('about.contactText')}</p>
      </div>

      {isSubmitted ? (
        <div className="text-center p-8 bg-green-100 text-green-800 rounded-lg border border-green-200">
            <h3 className="text-2xl font-bold">{t('about.form.thanks')}</h3>
            <p>{t('about.form.feedback')}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">{t('about.form.name')}</label>
            <input type="text" id="name" value={formState.name} onChange={handleChange} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">{t('about.form.email')}</label>
            <input type="email" id="email" value={formState.email} onChange={handleChange} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary" />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">{t('about.form.message')}</label>
            <textarea id="message" rows={4} value={formState.message} onChange={handleChange} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"></textarea>
          </div>
          <button type="submit" className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark transition-colors">
            {t('about.form.send')}
          </button>
        </form>
      )}
    </div>
  );
};

export default AboutPage;