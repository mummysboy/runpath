'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export default function MarketingHeader({ activePage }: { activePage?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const topbar = document.getElementById('topbar');
      if (topbar) {
        if (window.scrollY > 50) {
          topbar.classList.add('scrolled');
        } else {
          topbar.classList.remove('scrolled');
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="topbar" id="topbar">
      <div className="topbar-container">
        <div className="brand">
          <Link href="/">
            <Image
              src="/RunpathLabs_Logo-Combined_Reversed.png"
              alt="Runpath logo"
              width={550}
              height={140}
              className="logo"
              priority
            />
          </Link>
        </div>
        <nav className={`nav-menu ${menuOpen ? 'active' : ''}`} id="navMenu">
          <Link href="/" className={`nav-link ${activePage === 'home' ? 'active' : ''}`}>
            Home
          </Link>
          <Link href="/about-us" className={`nav-link ${activePage === 'about-us' ? 'active' : ''}`}>
            About Us
          </Link>
          <Link href="/what-we-do" className={`nav-link ${activePage === 'what-we-do' ? 'active' : ''}`}>
            What We Do
          </Link>
          <Link href="/case-studies" className={`nav-link ${activePage === 'case-studies' ? 'active' : ''}`}>
            Case Studies
          </Link>
          <Link href="/contact" className={`nav-link ${activePage === 'contact' ? 'active' : ''}`}>
            Contact
          </Link>
          <Link href="/login" className="nav-link">
            Login
          </Link>
        </nav>
        <button 
          className={`menu-button ${menuOpen ? 'active' : ''}`}
          id="menuButton"
          aria-label="Open menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </header>
  );
}
