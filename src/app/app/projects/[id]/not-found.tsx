import Link from 'next/link';

export default function ProjectNotFound() {
  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto text-center py-16">
        <h1 className="text-4xl font-bold mb-4 text-[#f7f9ff]">Project Not Found</h1>
        <p className="text-[#b7c1cf] mb-8">
          The project you're looking for doesn't exist or you don't have permission to access it.
        </p>
        <Link
          href="/app/projects"
          className="inline-block px-6 py-3 rounded-lg bg-gradient-to-r from-[#2b80ff] to-[#45a6ff] text-[#0d0f11] font-semibold hover:shadow-lg hover:shadow-[rgba(43,128,255,0.35)] transition"
        >
          Back to Projects
        </Link>
      </div>
    </div>
  );
}
