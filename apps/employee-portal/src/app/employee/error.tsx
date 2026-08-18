"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div className="glass-panel text-center" style={{ maxWidth: '500px' }}>
        <h2 style={{ marginBottom: '1rem', color: 'var(--danger)' }}>Something went wrong</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          We encountered an unexpected issue while loading your dashboard.
        </p>
        <button
          className="btn-primary"
          onClick={() => reset()}
          style={{ width: 'auto' }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
