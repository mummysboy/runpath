'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MarketingHeader from '@/components/MarketingHeader';
import MarketingFooter from '@/components/MarketingFooter';
import ConsultationModal from '@/components/ConsultationModal';

export default function Contact() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
        }
      });
    });

    document.querySelectorAll('.anim').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="page">
      <MarketingHeader activePage="contact" />

      <main>
        <section className="hero hero-contact">
          <div className="hero-background"></div>
          <div className="hero-overlay"></div>
          <div className="hero-content anim fade">
            <h1>Get In Touch</h1>
            <p>Ready to eliminate manual processes? Let's discuss how we can help streamline your operations.</p>
          </div>
        </section>

        <section className="cta">
          <div className="cta-card anim fade">
            <h2>Ready to eliminate manual processes?</h2>
            <p>Let us streamline your operations with custom software built specifically for your needs.</p>
            <div className="cta-actions">
              <button className="primary-btn consultation-btn" onClick={() => setIsModalOpen(true)}>
                Schedule Your Free Consultation
              </button>
              <Link href="/what-we-do" className="ghost-btn">Explore Solutions</Link>
            </div>
          </div>
        </section>

        <section className="contact-info">
          <div className="section-header">
            <p className="eyebrow">Contact Information</p>
            <h2>Ways to reach us</h2>
          </div>
          <div className="replace-grid">
            <div className="replace-card anim from-left">
              <div className="icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.6" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
              </div>
              <h3>Email</h3>
              <p><a href="mailto:hello@runpath.com" style={{ color: '#5ea0ff' }}>hello@runpath.com</a></p>
            </div>
            <div className="replace-card anim from-right">
              <div className="icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.6" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                </svg>
              </div>
              <h3>Phone</h3>
              <p>Available upon request</p>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
      <ConsultationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
