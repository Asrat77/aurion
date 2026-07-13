import Link from "next/link";

export default function NotFound() {
  return (
    <section className="min-h-[100dvh] flex items-center justify-center text-center px-4 sm:px-6 lg:px-8">
      <div>
        <h1 className="display-hero mb-4">404</h1>
        <p className="text-[var(--text-secondary)] mb-8">This page does not exist.</p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/" className="btn btn-outline">
            Back to Home
          </Link>
          <Link href="/store" className="btn btn-primary">
            Explore the Store
          </Link>
        </div>
      </div>
    </section>
  );
}
