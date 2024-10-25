'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import PasswordPrompt from '../components/SecureAccessPrompt';
import { LayoutDashboard, Monitor, Settings, LogOut, Bell, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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
    <div className="min-h-screen text-white relative bg-gradient-to-b from-black to-zinc-900">
      <main className="pb-24">
        <div className="container mx-auto px-4 py-8">
          {children}
        </div>
      </main>
      <motion.nav
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="fixed bottom-6 left-0 right-0 flex justify-center items-center px-4"
      >
        <motion.div
          className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-full shadow-lg p-2"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <TooltipProvider>
            <ul className="flex space-x-1">
              {navLinks.map((link) => (
                <motion.li key={link.href} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href={link.href} passHref>
                        <Button
                          variant={pathname === link.href ? "secondary" : "ghost"}
                          className={`rounded-full transition-all duration-200 ${
                            pathname === link.href
                              ? 'bg-teal-600 text-white hover:bg-teal-700'
                              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                          }`}
                        >
                          <link.icon className="h-5 w-5" />
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{link.label}</p>
                    </TooltipContent>
                  </Tooltip>
                </motion.li>
              ))}
            </ul>
          </TooltipProvider>
        </motion.div>
      </motion.nav>
    </div>
  );
}
