"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Search, X, SlidersHorizontal } from "lucide-react";
import { useDemo } from "@/lib/demo-store";
import { dealStatus } from "@/lib/domain";
import { DealCard, PageIntro } from "./ui";
const filters = [
  "All bookings",
  "Open",
  "Waiting for approval",
  "Ready to activate",
  "Activated",
  "Expired",
];
export function Marketplace() {
  const { state } = useDemo();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All bookings");
  const deals = state.deals.filter(
    (d) =>
      d.title.toLowerCase().includes(query.trim().toLowerCase()) &&
      (filter === "All bookings" ||
        (filter === "Expired"
          ? state.now >= d.deadline && d.activatedAt === null
          : dealStatus(state, d) === filter)),
  );
  return (
    <div className="container marketplace-page">
      <PageIntro
        eyebrow="THE DEMO MARKETPLACE"
        title="Find a plan worth committing to."
      >
        <p>
          Small workshops. Shared conditions. Explore five booking scenarios or
          publish your own. These are demo examples, not actual available
          events.
        </p>
      </PageIntro>
      <div className="marketplace-toolbar">
        <div className="search-field">
          <Search size={19} aria-hidden="true" />
          <label htmlFor="search" className="sr-only">
            Search workshops by title
          </label>
          <input
            id="search"
            type="search"
            placeholder="Search workshops by title…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              className="icon-button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
            >
              <X size={17} />
            </button>
          )}
        </div>
        <Link className="button button-primary" href="/create">
          Create a demo booking <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
      </div>
      <div
        className="filters"
        role="group"
        aria-label="Filter bookings by status"
      >
        <SlidersHorizontal size={16} aria-hidden="true" />
        {filters.map((label) => (
          <button
            type="button"
            className={filter === label ? "filter active" : "filter"}
            key={label}
            aria-pressed={filter === label}
            onClick={() => setFilter(label)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="results-count" aria-live="polite">
        <span>
          {deals.length} demo {deals.length === 1 ? "booking" : "bookings"}
        </span>
        <span>Amounts shown in demo tokens</span>
      </div>
      {deals.length ? (
        <div className="deals-grid">
          {deals.map((d) => (
            <DealCard key={d.id} deal={d} state={state} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Search size={30} aria-hidden="true" />
          <h2>No workshops found.</h2>
          <p>
            Try another title or clear the status filter to explore all demo
            bookings.
          </p>
          <button
            className="button button-outline"
            onClick={() => {
              setQuery("");
              setFilter("All bookings");
            }}
          >
            Clear search and filters
          </button>
        </div>
      )}
      <div className="marketplace-note">
        <span className="small-dot" />
        <p>
          Your demo changes are saved in this browser. Each booking uses the
          same frozen simulated clock; the details page includes role, time, and
          reset controls.
        </p>
      </div>
    </div>
  );
}
