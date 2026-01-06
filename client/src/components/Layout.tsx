import { ReactNode } from 'react';
import { Navigation } from './Navigation';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-sage-50">
      <Navigation />
      <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
    </div>
  );
};
