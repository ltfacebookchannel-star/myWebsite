import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const Footer: React.FC = () => {
  const { t } = useLanguage();

  const socialLinks = [
    { name: 'Facebook', url: '#', icon: 'f' },
    { name: 'X', url: '#', icon: 'X' },
    { name: 'YouTube', url: '#', icon: '▶' }
  ];

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center text-gray-medium">
        <div className="flex justify-center space-x-6 mb-4">
            {socialLinks.map(link => (
                 <a key={link.name} href={link.url} className="text-gray-500 hover:text-primary">
                    <span className="sr-only">{link.name}</span>
                    <div className="w-6 h-6 border rounded-full flex items-center justify-center font-bold text-sm">{link.icon}</div>
                 </a>
            ))}
        </div>
        <p>&copy; {new Date().getFullYear()} {t('footer.brand')}. {t('footer.rights')}.</p>
        <p className="text-sm mt-2">{t('footer.tagline')}</p>
      </div>
    </footer>
  );
};

export default Footer;