'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MarketingHeader from '@/components/MarketingHeader';
import MarketingFooter from '@/components/MarketingFooter';
import ConsultationModal from '@/components/ConsultationModal';

export default function Home() {
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
      <MarketingHeader activePage="home" />

      <main>
        <section id="home" className="hero hero-home">
          <div className="hero-background"></div>
          <div className="hero-overlay"></div>
          <div className="hero-content anim fade">
            <h1>Transform manual processes into streamlined systems</h1>
            <p>Custom enterprise software that eliminates manual workflows, cuts out inefficiencies, and makes your operations leaner and faster.</p>
            <div className="hero-cta">
              <button className="primary-btn consultation-btn" onClick={() => setIsModalOpen(true)}>
                Schedule Your Free Consultation
              </button>
              <Link href="/case-studies" className="ghost-btn">View Case Studies</Link>
            </div>
          </div>
        </section>

        <section className="process">
          <div className="section-header">
            <p className="eyebrow">Our Process</p>
            <h2>A proven methodology for building transformative software</h2>
          </div>
          <div className="process-grid">
            <div className="process-card anim from-left">
              <div className="icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.6" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5.25h6M9 9h6m-6 3.75h4.5M9.75 3h4.5c.966 0 1.75.784 1.75 1.75v14.5a.75.75 0 0 1-.75.75H8.75a.75.75 0 0 1-.75-.75V4.75C8 3.784 8.784 3 9.75 3Z" />
                </svg>
              </div>
              <h3>UX Solutions Assessment</h3>
              <p>We map your current workflows, dependencies, and pain points to uncover automation opportunities.</p>
            </div>
            <div className="process-card anim from-up">
              <div className="icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.6" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 4.5-6.6 9.9c-.335.5.028 1.1.63 1.1H12L10.5 21l9.6-10.8c.4-.45.068-1.15-.53-1.15H12l1.5-4.55c.2-.6-.45-1.1-.95-.65Z" />
                </svg>
              </div>
              <h3>Prototyping</h3>
              <p>Rapid prototypes to validate flows, align stakeholders, and derisk delivery before heavy build.</p>
            </div>
            <div className="process-card anim from-right">
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

        <section className="clients">
          <div className="section-header">
            <p className="eyebrow">Our Clients</p>
            <h2>Built for medium to large size companies</h2>
          </div>
          <div className="text-block anim fade">
            <p>We specialize in helping organizations with complex, multi-department workflows transform their operations. Our solutions scale with your business and integrate seamlessly into your existing infrastructure.</p>
          </div>
          <div className="clients-grid">
            <div className="clients-card anim from-left">
              <div className="icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.6" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                </svg>
              </div>
              <h3>Enterprise Scale</h3>
              <p>Our systems handle thousands of users, complex approval workflows, and high-volume transactions without compromising performance.</p>
            </div>
            <div className="clients-card anim from-up">
              <div className="icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.6" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                </svg>
              </div>
              <h3>Deep Integrations</h3>
              <p>Connect with your existing enterprise tools—HRIS, ERP, SSO, email systems, and more—for a unified workflow experience.</p>
            </div>
            <div className="clients-card anim from-right">
              <div className="icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.6" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
              </div>
              <h3>Security & Compliance</h3>
              <p>Enterprise-grade security, SOC 2 compliance, audit trails, and role-based access controls built into every solution.</p>
            </div>
            <div className="clients-card anim from-left">
              <div className="icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.6" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                </svg>
              </div>
              <h3>Real-Time Analytics</h3>
              <p>Comprehensive dashboards and reporting that give leadership visibility into processes, bottlenecks, and team performance.</p>
            </div>
            <div className="clients-card anim from-up">
              <div className="icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.6" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15m-9.75 18v-9m0-12v9m-6 3.75h13.5A2.25 2.25 0 0 0 21 15.75V6a2.25 2.25 0 0 0-2.25-2.25H4.5A2.25 2.25 0 0 0 2.25 6v9.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </div>
              <h3>Multi-Department Coordination</h3>
              <p>Unite HR, Finance, Operations, and other departments with shared workflows, approvals, and communication channels.</p>
            </div>
            <div className="clients-card anim from-right">
              <div className="icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.6" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              </div>
              <h3>Continuous Improvement</h3>
              <p>Ongoing support and iterative enhancements to ensure your systems evolve with your business needs and industry changes.</p>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
      <ConsultationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
