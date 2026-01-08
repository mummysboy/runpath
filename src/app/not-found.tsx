import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0d0f11] text-[#e8ecf2] flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4 text-[#f7f9ff]">404</h1>
        <h2 className="text-2xl font-semibold mb-4 text-[#f4f6fb]">Page Not Found</h2>
        <p className="text-[#b7c1cf] mb-8 max-w-md">
          The page you're looking for doesn't exist or you don't have permission to access it.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#2b80ff] to-[#45a6ff] text-[#0d0f11] font-semibold hover:shadow-lg hover:shadow-[rgba(43,128,255,0.35)] transition"
          >
            Go Home
          </Link>
          <Link
            href="/app"
            className="px-6 py-3 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[#f4f6fb] font-semibold hover:bg-[rgba(255,255,255,0.08)] transition"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
