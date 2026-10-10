"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, FlaskConical, Menu, X } from "lucide-react";
import { Brand } from "./ui";
import { BRAND } from "@/lib/copy";
import { FLAGSHIP_ID } from "@/lib/seed";
import { useDemo } from "@/lib/demo-store";

const nav = [
  ["/marketplace", "Marketplace"],
  ["/how-it-works", "How It Works"],
  ["/about", "About"],
];
export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="site-header">
        <div className="container header-inner">
          <Brand />
          <nav className="desktop-nav" aria-label="Main navigation">
            {nav.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                aria-current={pathname === href ? "page" : undefined}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            <Link className="header-commitments" href="/my-commitments">
              My commitments
            </Link>
            <Link
              className="button button-primary header-demo"
              href={`/marketplace/${FLAGSHIP_ID}`}
            >
              Try the demo <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
            <button
              type="button"
              className="icon-button mobile-toggle"
              aria-label={menuOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav
            className="mobile-nav container"
            id="mobile-nav"
            aria-label="Mobile navigation"
          >
            {[
              ...nav,
              ["/my-commitments", "My commitments"],
              ["/create", "Create a demo booking"],
              ["/onchain-demo", "Solana localnet demo"],
            ].map(([href, label]) => (
              <Link key={href} href={href} onClick={() => setMenuOpen(false)}>
                {label}
              </Link>
            ))}
          </nav>
        )}
      </header>
      <div className="prototype-strip">
        <div className="container">
          <FlaskConical size={14} aria-hidden="true" />
          <span>
            {pathname === "/onchain-demo"
              ? "Solana localnet — real transactions with valueless local test tokens."
              : BRAND.notice}
          </span>
          <span className="prototype-extra">
            A little coordination goes a long way.
          </span>
        </div>
      </div>
    </>
  );
}
export function StorageNotice() {
  const pathname = usePathname();
  const { notice } = useDemo();
  return pathname !== "/onchain-demo" && notice ? (
    <div className="container storage-notice" role="status">
      {notice}
    </div>
  ) : null;
}
export function Footer() {
  const pathname = usePathname();
  return (
    <footer className="site-footer">
      <div className="container footer-top">
        <div>
          <Brand />
          <p>
            Good things happen
            <br />
            when we commit together.
          </p>
        </div>
        <nav aria-label="Footer navigation">
          <Link href="/marketplace">Marketplace</Link>
          <Link href="/how-it-works">How It Works</Link>
          <Link href="/about">About FUSE</Link>
          <Link href="/create">Create a demo booking</Link>
          <Link href="/my-commitments">My commitments</Link>
          <Link href="/onchain-demo">Solana localnet demo</Link>
        </nav>
      </div>
      <div className="container footer-bottom">
        <span>Built by two siblings. A first hackathon, together.</span>
        <span>
          {pathname === "/onchain-demo"
            ? "Unaudited · Local validator only · No assets with value"
            : "Prototype · Demo tokens only · Planned for Solana"}
        </span>
      </div>
    </footer>
  );
}
