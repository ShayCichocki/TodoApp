import { Link } from 'react-router-dom';

export const NotFound: React.FC = () => {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center">
      <h1 className="mb-4 text-6xl font-bold text-forest-900">404</h1>
      <p className="mb-8 text-xl text-forest-700">Page not found</p>
      <Link
        to="/"
        className="rounded-md bg-forest-600 px-6 py-3 text-white hover:bg-forest-700"
      >
        Go Home
      </Link>
    </div>
  );
};
