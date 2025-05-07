'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function BlogLayout({ children }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Check if we've scrolled past the hero section (90vh)
      const isScrolled = window.scrollY > window.innerHeight * 0.9 - 100;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Fixed position navbar with conditional styling */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${
          scrolled ? 'bg-white/80 backdrop-blur-sm shadow-sm' : 'bg-transparent'
        }`}
      >
        <div className="flex h-[10vh] items-center justify-between w-full">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative">
              <Image
                src="/icons/android-chrome-192x192.png"
                alt="Fincapy Logo"
                width={60}
                height={60}
                className="h-[60px] w-[60px] sm:ml-[9px] ml-[1px]"
                priority
              />
            </div>
          </Link>
          <div className="flex items-center gap-3 sm:px-7 px-3">
            <Link href="/signin">
              <Button
                variant="outline"
                className={`border-secondary hover:border-amber-600 hover:text-amber-700 ${
                  scrolled
                    ? 'text-emerald-700 bg-transparent'
                    : 'text-white bg-transparent'
                }`}
              >
                Sign In
              </Button>
            </Link>
            <Link href="/#waitlist">
              <Button className="bg-primary text-gray-900 hover:bg-amber-600 border border-amber-600">
                Join the waitlist
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}
