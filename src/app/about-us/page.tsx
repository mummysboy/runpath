'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import MarketingHeader from '@/components/MarketingHeader';
import MarketingFooter from '@/components/MarketingFooter';
import ConsultationModal from '@/components/ConsultationModal';

export default function AboutUs() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Add animation classes when component mounts
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
      <MarketingHeader activePage="about-us" />

      <main>
        <section className="hero hero-about-us">
          <div className="hero-background"></div>
          <div className="hero-overlay"></div>
          <div className="hero-content anim fade">
            <h1>About Us</h1>
            <p>Building enterprise software that drives real results</p>
          </div>
        </section>

        <section className="about-us">
          <div className="section-header">
            <p className="eyebrow">Our Mission</p>
            <h2>Transforming businesses through custom software solutions</h2>
          </div>
          <div className="text-block anim fade">
            <p>We specialize in creating custom enterprise software solutions that eliminate manual workflows and streamline operations. Our team combines deep technical expertise with a focus on user experience to deliver systems that make a measurable impact on your business.</p>
          </div>
        </section>

        <section className="featured">
          <div className="section-header">
            <p className="eyebrow">Our Approach</p>
            <h2>What sets us apart</h2>
          </div>
          <div className="process-grid">
            <div className="process-card anim from-left">
              <div className="process-image" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80')" }}></div>
              <div className="icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.6" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19a6 6 0 0 0-12 0m12 0a6 6 0 0 1 6 0m-6 0v-2a4 4 0 1 0-8 0v2m8-10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm6 0a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
                </svg>
              </div>
              <h3>Expert Team</h3>
              <p>Our experienced developers and designers work closely with you to understand your unique challenges and deliver tailored solutions.</p>
            </div>
            <div className="process-card anim from-up">
              <div className="process-image" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80')" }}></div>
              <div className="icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.6" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <h3>Proven Results</h3>
              <p>We've helped leading institutions streamline operations, reduce costs, and improve efficiency through our custom software solutions.</p>
            </div>
            <div className="process-card anim from-right">
              <div className="process-image" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&q=80')" }}></div>
              <div className="icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.6" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3>Continuous Support</h3>
              <p>We provide ongoing maintenance, updates, and support to ensure your systems continue to deliver value long after launch.</p>
            </div>
          </div>
        </section>

        <section className="cta">
          <div className="cta-card anim fade">
            <h2>Let's work together</h2>
            <p>Ready to transform your business processes? Get in touch to discuss your project.</p>
            <div className="cta-actions">
              <Link href="/contact" className="primary-btn">Contact Us</Link>
              <Link href="/what-we-do" className="ghost-btn">Learn More</Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
      <ConsultationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
