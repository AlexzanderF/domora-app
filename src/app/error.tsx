"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="card">
      <h1>Възникна проблем.</h1>
      <p className="muted">Опитайте да заредите страницата отново.</p>
      <button className="primary" onClick={reset}>
        Опитай отново
      </button>
    </div>
  );
}
