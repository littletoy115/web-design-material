import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import SiteLayout from './shop/components/SiteLayout';
import HomePage from './shop/pages/HomePage';
import { pageLoaders } from './shop/routes';

// Home is in the main bundle; every other page is its own chunk.
const CollectionPage = lazy(pageLoaders['/collection']);
const FittingPage = lazy(pageLoaders['/fitting']);
const StoriesPage = lazy(pageLoaders['/stories']);
const ReviewsPage = lazy(pageLoaders['/reviews']);
const ContactPage = lazy(pageLoaders['/contact']);

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/collection" element={<CollectionPage />} />
        <Route path="/fitting" element={<FittingPage />} />
        <Route path="/stories" element={<StoriesPage />} />
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="*" element={<HomePage />} />
      </Route>
    </Routes>
  );
}
