'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Do not show sidebar on login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: '📊' },
    { name: 'Passengers', path: '/admin/passengers', icon: '👥' },
    { name: 'Families', path: '/admin/families', icon: '👨‍👩‍👧' },
    { name: 'Train', path: '/admin/train', icon: '🚆' },
    { name: 'Hotels', path: '/admin/hotels', icon: '🏨' },
  ];

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between">
        <div className="font-bold text-lg text-slate-800 flex items-center gap-2">
          <span>🚆</span> Admin
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-2xl"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <nav className={`${mobileMenuOpen ? 'block' : 'hidden'} md:block w-full md:w-64 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col h-auto md:min-h-screen`}>
        <div className="hidden md:flex p-6 font-bold text-xl text-slate-800 items-center gap-2 border-b border-slate-100">
          <span>🚆</span> Admin Panel
        </div>
        
        <div className="flex-1 py-4 px-3 space-y-1">
          {navItems.map(item => (
            <Link 
              key={item.path} 
              href={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                pathname === item.path ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </div>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-3 w-full text-left rounded-xl text-red-600 hover:bg-red-50 transition-colors"
          >
            <span className="text-xl">🚪</span>
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
