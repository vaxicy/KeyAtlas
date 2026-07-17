import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import { ToastProvider } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import AppDetail from './pages/AppDetail';
import SearchPage from './pages/SearchPage';
import CategoryPage from './pages/CategoryPage';
import NotFound from './pages/NotFound';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <div className="ka-page" key={location.pathname}>
      <Routes location={location}>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<ErrorBoundary><SearchPage /></ErrorBoundary>} />
          <Route path="/apps/:appId" element={<AppDetail />} />
          <Route path="/category/:categoryId" element={<CategoryPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <AnimatedRoutes />
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
