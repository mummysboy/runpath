'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MarketingHeader from '@/components/MarketingHeader';
import MarketingFooter from '@/components/MarketingFooter';
import ConsultationModal from '@/components/ConsultationModal';

export default function CaseStudies() {
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
      <MarketingHeader activePage="case-studies" />

      <main>
        <section className="hero hero-case-studies">
          <div className="hero-background"></div>
          <div className="hero-overlay"></div>
          <div className="hero-content anim fade">
            <h1>Case Studies</h1>
            <p>Delivering real impact for leading institutions</p>
          </div>
        </section>

        <section className="featured">
          <div className="section-header">
            <p className="eyebrow">Featured Work</p>
            <h2>Transformative solutions that drive measurable results</h2>
          </div>
          <div className="case-studies-grid">
            <article className="case-study-card anim from-up">
              <div className="case-meta">
                <div className="badge">Harvard University</div>
                <h3>Unified HR Management Across 13 Colleges</h3>
                <p>We developed a comprehensive software solution that streamlined the entire HR workflow for 13 colleges spanning hiring, promotions, and compliance.</p>
                <ul>
                  <li>Centralized tracking across all colleges</li>
                  <li>Eliminated manual document handling</li>
                  <li>Full visibility into HR processes</li>
                </ul>
              </div>
              <div className="case-visual">
                <div className="case-image" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=80')" }}></div>
                <div className="stat-card">
                  <div className="stat-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.7" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19a6 6 0 0 0-12 0m12 0a6 6 0 0 1 6 0m-6 0v-2a4 4 0 1 0-8 0v2m8-10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm6 0a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
                    </svg>
                  </div>
                  <div className="stat-copy">
                    <span className="stat-label">Colleges Unified</span>
                    <span className="stat-value">13</span>
                  </div>
                </div>
              </div>
            </article>

            <article className="case-study-card anim from-up">
              <div className="case-meta">
                <div className="badge">National Healthcare Network</div>
                <h3>Digitized Intake & Approval Workflows</h3>
                <p>Built a secure, auditable workflow platform replacing email-based approvals with structured digital flows.</p>
                <ul>
                  <li>60% faster approvals with automated routing</li>
                  <li>Real-time visibility and SLA tracking</li>
                  <li>Secure audit trails for every request</li>
                </ul>
              </div>
              <div className="case-visual">
                <div className="case-image" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&q=80')" }}></div>
                <div className="stat-card">
                  <div className="stat-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.7" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 4.5-6.6 9.9c-.335.5.028 1.1.63 1.1H12L10.5 21l9.6-10.8c.4-.45.068-1.15-.53-1.15H12l1.5-4.55c.2-.6-.45-1.1-.95-.65Z" />
                    </svg>
                  </div>
                  <div className="stat-copy">
                    <span className="stat-label">Approval Speed</span>
                    <span className="stat-value">+60%</span>
                  </div>
                </div>
              </div>
            </article>

            <article className="case-study-card anim from-up">
              <div className="case-meta">
                <div className="badge">Global Manufacturing</div>
                <h3>Real-Time Operations Control</h3>
                <p>Modernized manual PDFs and disconnected trackers into a single source of truth for plant operations.</p>
                <ul>
                  <li>Unified dashboards across plants</li>
                  <li>Exception routing with alerts</li>
                  <li>Data-backed throughput improvements</li>
                </ul>
              </div>
              <div className="case-visual">
                <div className="case-image" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80')" }}></div>
                <div className="stat-card">
                  <div className="stat-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.7" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 19.5 9.75 12l4.5 4.5L21 9m0 0h-4.5M21 9v4.5" />
                    </svg>
                  </div>
                  <div className="stat-copy">
                    <span className="stat-label">Throughput Gain</span>
                    <span className="stat-value">+22%</span>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="cta">
          <div className="cta-card anim fade">
            <h2>Ready to transform your operations?</h2>
            <p>Let us streamline your workflows with custom software built specifically for your needs.</p>
            <div className="cta-actions">
              <button className="primary-btn consultation-btn" onClick={() => setIsModalOpen(true)}>
                Schedule Your Free Consultation
              </button>
              <Link href="/what-we-do" className="ghost-btn">Learn More About Our Services</Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
      <ConsultationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
