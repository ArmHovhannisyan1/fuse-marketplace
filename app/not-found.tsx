import Link from "next/link";
export default function NotFound() {
  return (
    <div className="container empty-page">
      <span className="eyebrow">A SMALL DETOUR</span>
      <h1>That page isn’t here.</h1>
      <p>Explore the demo marketplace to find a workshop.</p>
      <Link className="button button-primary" href="/marketplace">
        Browse demo bookings
      </Link>
    </div>
  );
}
