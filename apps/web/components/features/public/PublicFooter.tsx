import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="public-footer">
      <div className="public-footer__brand">
        <span>
          <Sparkles size={18} />
        </span>
        <div>
          <strong>AGBOFA NEXUS AI</strong>
          <small>Intelligence for what comes next.</small>
        </div>
      </div>
      <p>Built in Ghana for an informed, intelligent world.</p>
      <div className="public-footer__links">
        <Link href="/login">
          Workspace <ArrowUpRight size={13} />
        </Link>
        <a href="mailto:hello@agbofa.ai">
          Contact <ArrowUpRight size={13} />
        </a>
      </div>
      <small>© {new Date().getFullYear()} Agbofa Technologies.</small>
    </footer>
  );
}
