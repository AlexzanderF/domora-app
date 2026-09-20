import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card">
      <h1>Страницата не е намерена.</h1>
      <p className="muted">Проверете адреса или се върнете към началото.</p>
      <Link className="primary" href="/">
        Към началото
      </Link>
    </div>
  );
}
