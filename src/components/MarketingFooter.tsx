import Link from 'next/link';
import Image from 'next/image';

export default function MarketingFooter() {
  return (
    <footer className="footer">
      <div className="footer-left">
        <Image
          src="/RunpathLabs_Logo-Combined_Reversed.png"
          alt="Runpath logo"
          width={32}
          height={32}
          className="logo small"
          priority
        />
        <span>Enterprise Solutions</span>
      </div>
      <div className="footer-right">
        <span>© 2025 Runpath Enterprise Solutions. All rights reserved.</span>
        <Link href="/contact">Contact</Link>
      </div>
    </footer>
  );
}
