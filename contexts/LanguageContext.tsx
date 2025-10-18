import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { translations } from '../translations';

type Language = 'en' | 'fr' | 'ar';

interface LanguageContextType {
    language: Language;
    setLanguage: (language: string) => void;
    t: (key: string, replacements?: { [key: string]: string | number }) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>(() => {
        const savedLang = localStorage.getItem('language');
        return (savedLang && ['en', 'fr', 'ar'].includes(savedLang)) ? savedLang as Language : 'en';
    });

    useEffect(() => {
        localStorage.setItem('language', language);
        document.documentElement.lang = language;
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    }, [language]);

    const setLanguage = (lang: string) => {
        if (['en', 'fr', 'ar'].includes(lang)) {
            setLanguageState(lang as Language);
        }
    };
    
    const t = useCallback((key: string, replacements?: { [key: string]: string | number }): string => {
        const keys = key.split('.');
        let result = translations[language] as any;
        for (const k of keys) {
            result = result?.[k];
            if (result === undefined) {
                // Fallback to English if translation is missing
                result = translations['en'] as any;
                for (const fk of keys) {
                    result = result?.[fk];
                }
                break;
            }
        }
        
        if (typeof result !== 'string') {
            return key; // Return the key if no string found
        }
        
        if (replacements) {
            Object.keys(replacements).forEach(placeholder => {
                result = result.replace(`{{${placeholder}}}`, String(replacements[placeholder]));
            });
        }

        return result;
    }, [language]);

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
