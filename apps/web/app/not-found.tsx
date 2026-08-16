import { ArrowLeft, Compass, Sparkles } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found-page">
      <div aria-hidden="true" className="not-found-page__orbit" />
      <span className="not-found-page__mark">
        <Sparkles size={24} />
      </span>
      <span className="section-kicker">Signal not found · 404</span>
      <h1>This story hasn’t entered the Nexus.</h1>
      <p>
        The route may have moved, or the intelligence you requested is not yet
        available.
      </p>
      <div>
        <Link className="landing-cta__primary" href="/">
          <ArrowLeft size={16} /> Return home
        </Link>
        <Link className="not-found-page__secondary" href="/login">
          <Compass size={16} /> Open workspace
        </Link>
      </div>
    </main>
  );
}
