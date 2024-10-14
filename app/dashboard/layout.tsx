// app/dashboard/layout.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import PasswordPrompt from '../components/SecureAccessPrompt';
import { LayoutDashboard, Monitor, Settings, LogOut, Bell, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/protectpage');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const handleAuthSuccess = () => {
      setIsAuthenticated(true);
    };

    window.addEventListener('auth-success', handleAuthSuccess);

    return () => {
      window.removeEventListener('auth-success', handleAuthSuccess);
    };
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen bg-black text-white">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <PasswordPrompt />;
  }

  const navLinks = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/monitors', label: 'Monitors', icon: Monitor },
    { href: '/dashboard/incidents', label: 'Incidents', icon: AlertCircle },   
    { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
    { href: '/', label: 'Logout', icon: LogOut },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white relative">
      <main className="pb-20">
        <div className="container mx-auto px-4 py-8">
          {children}
        </div>
      </main>
      <nav className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 rounded-full shadow-lg p-2">
        <ul className="flex space-x-1">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} passHref>
                <Button
                  variant={pathname === link.href ? "secondary" : "ghost"}
                  className={`rounded-full transition-all duration-200 ${
                    pathname === link.href
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                  title={link.label}
                >
                  <link.icon className="h-5 w-5" />
                </Button>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}