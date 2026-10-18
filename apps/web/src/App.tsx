import { Routes, Route } from 'react-router-dom';
import SiteLayout from './shop/components/SiteLayout';
import HomePage from './shop/pages/HomePage';
import CollectionPage from './shop/pages/CollectionPage';
import StoriesPage from './shop/pages/StoriesPage';
import ReviewsPage from './shop/pages/ReviewsPage';
import ContactPage from './shop/pages/ContactPage';
import FittingPage from './shop/pages/FittingPage';

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
