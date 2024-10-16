// app/components/status-nav.tsx

"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Activity, BarChart2, Menu } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navItems = [
  { name: "Admin", icon: BarChart2, href: "/dashboard" },
]

export default function Navbar() {
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-11/12 max-w-5xl">
      <nav className="bg-gray-950/30 backdrop-blur-md text-gray-100 rounded-full shadow-lg">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center space-x-4"
            >
              <Link href="/" className="flex items-center space-x-2">
                <Image
                  src="/github/Uptim logo.png"
                  alt="Uptime.Pinguin Logo"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                <span className="text-xl font-bold">Uptime.Pinguin</span>
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-2">
              {navItems.map((item) => (
                <motion.div key={item.name} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link href={item.href} className="flex items-center space-x-2 px-3 py-2 rounded-full hover:bg-gray-800/50 transition-colors">
                    <item.icon className="h-4 w-4 text-blue-400" />
                    <span>{item.name}</span>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-gray-100 rounded-full">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-gray-900/70 backdrop-blur-md text-gray-100 border-gray-800 rounded-2xl mt-2">
                  {navItems.map((item) => (
                    <DropdownMenuItem key={item.name} asChild>
                      <Link href={item.href} className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-800/50 rounded-xl transition-colors">
                        <item.icon className="h-5 w-5 text-blue-400" />
                        <span>{item.name}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>
    </div>
  )
}
