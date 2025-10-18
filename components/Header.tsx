import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_LINKS } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { Globe } from 'lucide-react';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const langMenuRef = useRef<HTMLDivElement>(null);

  const languages = {
    en: { name: 'English', flag: '🇬🇧' },
    fr: { name: 'Français', flag: '🇫🇷' },
    ar: { name: 'العربية', flag: '🇸🇦' },
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const linkClasses = "text-gray-medium hover:text-primary transition-colors duration-200";
  const activeLinkClasses = "text-primary font-semibold";

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <NavLink to="/" className="flex items-center gap-2 text-2xl font-bold text-gray-dark">
              <span role="img" aria-label="idea icon">💡</span>
              <span>{t('header.title')}</span>
            </NavLink>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <nav className="flex items-center space-x-8">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.key}
                  to={link.path}
                  className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : ''}`}
                >
                  {t(`nav.${link.key}`)}
                </NavLink>
              ))}
            </nav>
            <div className="relative" ref={langMenuRef}>
              <button onClick={() => setIsLangMenuOpen(!isLangMenuOpen)} className="flex items-center gap-2 text-gray-medium hover:text-primary transition-colors">
                <Globe size={20} />
                <span>{languages[language as keyof typeof languages].name}</span>
              </button>
              {isLangMenuOpen && (
                <div className="absolute end-0 mt-2 w-40 bg-white rounded-md shadow-lg py-1">
                  {Object.entries(languages).map(([code, { name, flag }]) => (
                    <button
                      key={code}
                      onClick={() => {
                        setLanguage(code);
                        setIsLangMenuOpen(false);
                      }}
                      className="w-full text-start flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <span>{flag}</span> {name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="md:hidden flex items-center gap-2">
             {/* Mobile language switcher can be added here if needed */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-medium hover:text-gray-dark hover:bg-gray-soft focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
            >
              <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.key}
                to={link.path}
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) => `block px-3 py-2 rounded-md text-base font-medium ${linkClasses} ${isActive ? activeLinkClasses : ''}`}
              >
                {t(`nav.${link.key}`)}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;