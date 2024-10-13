'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

export default function PasswordPrompt() {
  const [password, setPassword] = useState('');
  const [csrfToken, setCsrfToken] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const fetchCSRFToken = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/protectpage');
      console.log('CSRF fetch response status:', response.status);
      const data = await response.json();
      console.log('CSRF fetch response data:', data);
      if (data.csrfToken) {
        setCsrfToken(data.csrfToken);
      } else {
        throw new Error('CSRF token not found in response');
      }
    } catch (error) {
      console.error('Error fetching CSRF token:', error);
      setError('Failed to initialize. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCSRFToken();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!csrfToken) {
      setError('CSRF token is missing. Please try again.');
      return;
    }

    console.log('Submitting with password:', password);
    console.log('CSRF Token:', csrfToken);

    try {
      const response = await fetch('/api/protectpage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password, csrfToken }),
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        window.dispatchEvent(new Event('auth-success'));
      } else {
        const data = await response.json();
        setError(data.message || 'Authentication failed');
        console.error('Authentication error:', data);
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
      console.error('Fetch error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-white text-2xl font-light"
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex justify-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <Lock className="w-16 h-16 text-zinc-400" />
              </motion.div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:border-teal-500 focus:ring-teal-500"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-200"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-md transition-all duration-200 ease-in-out transform hover:translate-y-[-2px] hover:shadow-lg"
              >
                Unlock
              </Button>
            </form>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4"
              >
                <p className="text-red-400 text-sm mb-2">{error}</p>
                <Button
                  onClick={fetchCSRFToken}
                  variant="outline"
                  className="w-full bg-transparent border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white font-medium py-2 px-4 rounded-md transition-all duration-200 ease-in-out"
                >
                  Retry
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}