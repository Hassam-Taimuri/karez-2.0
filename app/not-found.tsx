import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
      <h2 className="text-2xl font-bold mb-2">404 - Page Not Found</h2>
      <p className="text-slate-400 mb-4">The page you are looking for does not exist.</p>
      <Link href="/" className="px-4 py-2 bg-emerald-500 text-slate-900 rounded font-bold hover:bg-emerald-400 transition-colors">
        Return Home
      </Link>
    </div>
  );
}
