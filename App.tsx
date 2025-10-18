import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import HomePage from './pages/HomePage';
import DailyToolsPage from './pages/DailyToolsPage';
import StoriesPage from './pages/StoriesPage';
import WeatherPage from './pages/WeatherPage';
import AboutPage from './pages/AboutPage';
import PDFToolsPage from './pages/PDFToolsPage';
import ImageToolsPage from './pages/ImageToolsPage';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/daily-tools" element={<DailyToolsPage />} />
          <Route path="/pdf-tools" element={<PDFToolsPage />} />
          <Route path="/image-tools" element={<ImageToolsPage />} />
          <Route path="/stories" element={<StoriesPage />} />
          <Route path="/weather" element={<WeatherPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;