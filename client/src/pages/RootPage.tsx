import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Home } from './Home';
import { Landing } from './Landing';

export function RootPage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  return (
    <Layout>
      <Home />
    </Layout>
  );
}
