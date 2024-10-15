'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Github, Twitter, Linkedin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'

export default function EnhancedPasswordPrompt() {
  const [password, setPassword] = useState('')
  const [csrfToken, setCsrfToken] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showPassword, setShowPassword] = useState(false)

  const fetchCSRFToken = async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await fetch('/api/protectpage')
      console.log('CSRF fetch response status:', response.status)
      const data = await response.json()
      console.log('CSRF fetch response data:', data)
      if (data.csrfToken) {
        setCsrfToken(data.csrfToken)
      } else {
        throw new Error('CSRF token not found in response')
      }
    } catch (error) {
      console.error('Error fetching CSRF token:', error)
      setError('Failed to initialize. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCSRFToken()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!csrfToken) {
      setError('CSRF token is missing. Please try again.')
      return
    }

    console.log('Submitting with password:', password)
    console.log('CSRF Token:', csrfToken)

    try {
      const response = await fetch('/api/protectpage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password, csrfToken }),
      })

      console.log('Response status:', response.status)

      if (response.ok) {
        window.dispatchEvent(new Event('auth-success'))
      } else {
        const data = await response.json()
        setError(data.message || 'Authentication failed')
        console.error('Authentication error:', data)
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
      console.error('Fetch error:', error)
    }
  }

  const socialLinks = [
    { icon: Github, href: 'https://github.com/yourusername' },
    { icon: Twitter, href: 'https://twitter.com/yourusername' },
    { icon: Linkedin, href: 'https://linkedin.com/in/yourusername' },
  ]

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-black to-zinc-900">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
          <CardContent className="p-8">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex justify-center mb-6"
            >
              <Image
                src="/github/Uptim logo.png"
                alt="Uptim Logo"
                width={120}
                height={120}
                className="rounded-full"
              />
            </motion.div>
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex justify-center items-center h-32"
                >
                  <div className="text-white text-2xl font-light">Loading...</div>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-zinc-800/50 border-zinc-700 text-white placeholder-zinc-500 focus:border-teal-500 focus:ring-teal-500"
                        placeholder="Enter password"
                        required
                      />
                      <motion.button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-200"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </motion.button>
                    </div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-md transition-all duration-200 ease-in-out transform hover:shadow-lg"
                      >
                        Unlock
                      </Button>
                    </motion.div>
                  </form>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-4"
                    >
                      <p className="text-red-400 text-sm mb-2">{error}</p>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          onClick={fetchCSRFToken}
                          variant="outline"
                          className="w-full bg-transparent border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white font-medium py-2 px-4 rounded-md transition-all duration-200 ease-in-out"
                        >
                          Retry
                        </Button>
                      </motion.div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mt-8 flex space-x-4"
      >
        {socialLinks.map((link, index) => (
          <motion.a
            key={index}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 hover:text-white transition-colors duration-200"
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          >
            <link.icon size={24} />
          </motion.a>
        ))}
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="mt-4 text-zinc-500 text-sm"
      >
        Version 0.2.0
      </motion.div>
    </div>
  )
}