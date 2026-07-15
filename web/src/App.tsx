import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import AppDetail from './pages/AppDetail';
import SearchPage from './pages/SearchPage';
import CategoryPage from './pages/CategoryPage';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<ErrorBoundary><SearchPage /></ErrorBoundary>} />
            <Route path="/apps/:appId" element={<AppDetail />} />
            <Route path="/category/:categoryId" element={<CategoryPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
