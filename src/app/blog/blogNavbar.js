'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function BlogNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Check if we've scrolled past the hero section (90vh)
      const isScrolled = window.scrollY > window.innerHeight - 50;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${
        scrolled ? 'backdrop-blur-sm shadow-sm bg-gray-50' : 'bg-transparent'
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
              className={`border-secondary hover:border-amber-600 ${
                scrolled
                  ? 'text-emerald-700 bg-transparent hover:text-emerald-700'
                  : 'text-white bg-transparent hover:text-white'
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
  );
}
