
import React, { useEffect, useState, useMemo, lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CookieBar from './components/CookieBar';
import { supabase } from './src/supabaseClient';

// Lazy load pages for better code splitting
const Home = lazy(() => import('./pages/Home'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPostDetail = lazy(() => import('./pages/BlogPostDetail'));
const SpecializationDetail = lazy(() => import('./pages/SpecializationDetail'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const Contact = lazy(() => import('./pages/Contact'));
const Backstage = lazy(() => import('./pages/Backstage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const NotFound = lazy(() => import('./pages/NotFound'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    const statsStr = localStorage.getItem('jakub_minka_stats');
    const stats = statsStr ? JSON.parse(statsStr) : {
      totalVisits: 0,
      dailyVisits: {},
      pageVisits: {},
      categoryVisits: {}
    };

    const today = new Date().toISOString().split('T')[0];
    stats.totalVisits += 1;
    stats.dailyVisits[today] = (stats.dailyVisits[today] || 0) + 1;
    const path = location.pathname;
    stats.pageVisits[path] = (stats.pageVisits[path] || 0) + 1;

    if (path.includes('/specializace/')) {
      const catId = path.split('/').pop();
      if (catId) stats.categoryVisits[catId] = (stats.categoryVisits[catId] || 0) + 1;
    }

    localStorage.setItem('jakub_minka_stats', JSON.stringify(stats));
    window.dispatchEvent(new Event('storage'));
  }, [location.pathname]);

  return null;
};

const AppContent = () => {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  const isContactPage = location.pathname === '/kontakt';

  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      <AnalyticsTracker />
      {!isAdminPage && <Navbar />}
      <main className="flex-grow">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-[#007BFF] border-t-transparent rounded-full animate-spin"></div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:id" element={<BlogPostDetail />} />
            <Route path="/specializace/:id" element={<SpecializationDetail />} />
            <Route path="/projekt/:id" element={<ProjectDetail />} />
            <Route path="/jak-pracuji" element={<Backstage />} />
            <Route path="/kontakt" element={<Contact />} />
            <Route path="/ochrana-soukromi" element={<PrivacyPolicy />} />
            <Route path="/podminky-spoluprace" element={<TermsOfService />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      {!isAdminPage && !isContactPage && <Footer />}
      {!isAdminPage && <CookieBar />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
