import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-[#F0D7AF] bg-[#FFFDF9] p-10 shadow-soft">
        <div className="text-xs uppercase tracking-[0.22em] text-[#6B1E2B]">404</div>
        <h1 className="mt-3 font-[Playfair_Display] text-5xl text-[#33201D]">Page not found</h1>
        <p className="mt-4 text-[#806C66]">The page you are looking for does not exist or has moved.</p>
        <Link to="/" className="mt-6 inline-flex rounded-full bg-[#6B1E2B] px-5 py-3 font-medium text-white">Back to home</Link>
      </div>
    </div>
  );
}
