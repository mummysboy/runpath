'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MarketingHeader from '@/components/MarketingHeader';
import MarketingFooter from '@/components/MarketingFooter';
import ConsultationModal from '@/components/ConsultationModal';

export default function WhatWeDo() {
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
      <MarketingHeader activePage="what-we-do" />

      <main>
        <section className="hero hero-what-we-do">
          <div className="hero-background"></div>
          <div className="hero-overlay"></div>
          <div className="hero-content anim fade">
            <h1>What We Do</h1>
            <p>Transforming manual processes into streamlined systems</p>
          </div>
        </section>

        <section className="what-we-do">
          <div className="section-header">
            <p className="eyebrow">Our Services</p>
            <h2>Custom enterprise software that eliminates manual workflows</h2>
          </div>
          <div className="text-block anim fade">
            <p>You would be surprised how many companies still rely on emails and manual PDFs for critical processes. We build the software that replaces those outdated workflows with intelligent, automated systems.</p>
          </div>
        </section>

        <section className="process">
          <div className="section-header">
            <p className="eyebrow">Our Process</p>
            <h2>A proven methodology for building transformative software</h2>
          </div>
          <div className="process-grid">
            <div className="process-card anim from-left">
              <div className="process-image" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80')" }}></div>
              <div className="icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.6" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5.25h6M9 9h6m-6 3.75h4.5M9.75 3h4.5c.966 0 1.75.784 1.75 1.75v14.5a.75.75 0 0 1-.75.75H8.75a.75.75 0 0 1-.75-.75V4.75C8 3.784 8.784 3 9.75 3Z" />
                </svg>
              </div>
              <h3>UX Solutions Assessment</h3>
              <p>We map your current workflows, dependencies, and pain points to uncover automation opportunities.</p>
            </div>
            <div className="process-card anim from-up">
              <div className="process-image" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80')" }}></div>
              <div className="icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.6" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 4.5-6.6 9.9c-.335.5.028 1.1.63 1.1H12L10.5 21l9.6-10.8c.4-.45.068-1.15-.53-1.15H12l1.5-4.55c.2-.6-.45-1.1-.95-.65Z" />
                </svg>
              </div>
              <h3>Prototyping</h3>
              <p>Rapid prototypes to validate flows, align stakeholders, and derisk delivery before heavy build.</p>
            </div>
            <div className="process-card anim from-right">
              <div className="process-image" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1551650975-87deedd944c3?w=600&q=80')" }}></div>
              <div className="icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.6" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
              <h3>Final Development</h3>
              <p>Scalable, secure systems with analytics, alerts, and integrations tailored to your stack.</p>
            </div>
          </div>
        </section>

        <section className="replace">
          <div className="section-header">
            <p className="eyebrow">What We Replace</p>
            <h2>Common manual processes we transform into automated systems</h2>
          </div>
          <div className="replace-grid">
            <div className="replace-card anim from-left">
              <div className="icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.6" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75 12 12l8.25-5.25M4.5 18h15a.75.75 0 0 0 .75-.75V6.75A.75.75 0 0 0 19.5 6h-15a.75.75 0 0 0-.75.75v10.5c0 .414.336.75.75.75Z" />
                </svg>
              </div>
              <h3>Email-Based Workflows</h3>
              <p>Stop losing track of requests buried in inboxes. Centralize everything in one system.</p>
            </div>
            <div className="replace-card anim from-right">
              <div className="icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.6" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5.25h6m-6 3h3M9 9h6m-6 3h6m-6 3h6M9.75 3h4.5c.966 0 1.75.784 1.75 1.75v14.5a.75.75 0 0 1-.75.75H8.75a.75.75 0 0 1-.75-.75V4.75C8 3.784 8.784 3 9.75 3Z" />
                </svg>
              </div>
              <h3>Manual PDFs & Documents</h3>
              <p>Eliminate paper trails and version-control nightmares with digital workflows.</p>
            </div>
            <div className="replace-card anim from-left">
              <div className="icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.6" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19a6 6 0 0 0-12 0m12 0a6 6 0 0 1 6 0m-6 0v-2a4 4 0 1 0-8 0v2m8-10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm6 0a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
                </svg>
              </div>
              <h3>Disconnected Teams</h3>
              <p>Unite departments with shared visibility, tracking, and auditability.</p>
            </div>
            <div className="replace-card anim from-right">
              <div className="icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.6" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5v5.25l2.25 2.25M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <h3>Slow Approval Processes</h3>
              <p>Speed up decisions with automated routing, SLAs, and real-time notifications.</p>
            </div>
          </div>
        </section>

        <section className="cta">
          <div className="cta-card anim fade">
            <h2>Ready to transform your workflows?</h2>
            <p>Let us streamline your operations with custom software built specifically for your needs.</p>
            <div className="cta-actions">
              <button className="primary-btn consultation-btn" onClick={() => setIsModalOpen(true)}>
                Schedule Your Free Consultation
              </button>
              <Link href="/" className="ghost-btn">View Our Work</Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
      <ConsultationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
