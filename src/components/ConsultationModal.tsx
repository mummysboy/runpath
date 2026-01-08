'use client';

import { useState, useEffect } from 'react';

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConsultationModal({ isOpen, onClose }: ConsultationModalProps) {
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setShowSuccess(true);
    setTimeout(() => {
      onClose();
      setShowSuccess(false);
    }, 4000);
  };

  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#0d0f11] rounded-xl border border-[rgba(255,255,255,0.08)] max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-[rgba(255,255,255,0.08)]">
          <h2 className="text-2xl font-bold text-[#f7f9ff]">Schedule Your Free Consultation</h2>
          <button 
            onClick={onClose}
            className="text-[#b7c1cf] hover:text-[#f7f9ff] text-3xl leading-none"
          >
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label htmlFor="consultationName" className="block text-sm font-medium text-[#d6dbe5] mb-2">
              Your Name *
            </label>
            <input
              type="text"
              id="consultationName"
              name="consultationName"
              required
              placeholder="John Doe"
              className="w-full px-4 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f7f9ff] placeholder-[#98a3b6] focus:outline-none focus:border-[#2b80ff]"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="consultationEmail" className="block text-sm font-medium text-[#d6dbe5] mb-2">
              Email Address *
            </label>
            <input
              type="email"
              id="consultationEmail"
              name="consultationEmail"
              required
              placeholder="your.email@example.com"
              className="w-full px-4 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f7f9ff] placeholder-[#98a3b6] focus:outline-none focus:border-[#2b80ff]"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="consultationPhone" className="block text-sm font-medium text-[#d6dbe5] mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              id="consultationPhone"
              name="consultationPhone"
              placeholder="(555) 123-4567"
              className="w-full px-4 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f7f9ff] placeholder-[#98a3b6] focus:outline-none focus:border-[#2b80ff]"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="consultationCompany" className="block text-sm font-medium text-[#d6dbe5] mb-2">
              Company Name
            </label>
            <input
              type="text"
              id="consultationCompany"
              name="consultationCompany"
              placeholder="Your Company"
              className="w-full px-4 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f7f9ff] placeholder-[#98a3b6] focus:outline-none focus:border-[#2b80ff]"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="consultationMessage" className="block text-sm font-medium text-[#d6dbe5] mb-2">
              Tell us about your project *
            </label>
            <textarea
              id="consultationMessage"
              name="consultationMessage"
              rows={5}
              required
              placeholder="Describe what you'd like to achieve or the challenges you're facing..."
              className="w-full px-4 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f7f9ff] placeholder-[#98a3b6] focus:outline-none focus:border-[#2b80ff]"
            />
          </div>
          {showSuccess && (
            <div className="mb-4 p-4 bg-[rgba(43,128,255,0.1)] border border-[rgba(43,128,255,0.3)] rounded-lg text-[#c8d2e2]">
              <p>Thank you! We've received your consultation request and will contact you soon to schedule a time that works for you.</p>
            </div>
          )}
          <div className="flex gap-3">
            <button
              type="submit"
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#2b80ff] to-[#45a6ff] text-[#0d0f11] font-semibold hover:shadow-lg hover:shadow-[rgba(43,128,255,0.35)] transition"
            >
              Request Consultation
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-[#d6dbe5] hover:border-[rgba(255,255,255,0.16)] transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
