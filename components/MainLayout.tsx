import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import AdPlaceholder from './AdPlaceholder';
import { useLanguage } from '../contexts/LanguageContext';

const MainLayout: React.FC = () => {
    const { language } = useLanguage();
    const isRtl = language === 'ar';

    return (
        <div className={`flex flex-col min-h-screen font-sans bg-light text-gray-dark ${isRtl ? 'font-arabic' : ''}`}>
            <Header />
            <div className="flex-grow container mx-auto p-4 md:p-6 lg:p-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    <main className="w-full lg:w-3/4 xl:w-4/5 order-1 lg:order-2 fade-in">
                        <Outlet />
                    </main>
                    <aside className="w-full lg:w-1/4 xl:w-1/5 order-2 lg:order-1 space-y-6">
                        <AdPlaceholder height="h-64" />
                        <AdPlaceholder height="h-64" />
                    </aside>
                </div>
            </div>
            <Footer />
        </div>
    );
}

export default MainLayout;
