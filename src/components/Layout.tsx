import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

export function Layout() {
  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
