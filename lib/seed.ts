import type { DemoState, Deal, Identity } from "./models";

// A fixed clock makes reset reproducible. Nothing follows the computer's clock.
export const DEMO_START = Date.UTC(2026, 9, 7, 12);
export const FLAGSHIP_ID = "clay-and-company";
export const IDENTITIES: Identity[] = [
  { id: "sam", name: "Sam", role: "attendee" },
  { id: "robin", name: "Robin", role: "attendee" },
  { id: "organizer", name: "Workshop organizer", role: "organizer" },
  { id: "venue", name: "Designated venue", role: "venue" },
  { id: "instructor", name: "Designated instructor", role: "instructor" },
];
export const INITIAL_BALANCES: Record<string, number> = {
  sam: 1000,
  robin: 1000,
  organizer: 500,
  venue: 0,
  instructor: 0,
};

export function createSeed(): DemoState {
  const day = 86_400_000;
  const specs = [
    {
      id: FLAGSHIP_ID,
      title: "Clay & company",
      description:
        "Slow down, get your hands in clay, and learn to shape your first ceramic bowl. A small, friendly pottery workshop for complete beginners.",
      location: "Yerevan · Studio 04",
      category: "CERAMICS",
      art: "clay" as const,
      seats: 8,
      venue: true,
      instructor: false,
      deadline: DEMO_START + 2 * day,
      activated: false,
    },
    {
      id: "print-club",
      title: "The weekend print club",
      description:
        "Carve a simple lino block and make a series of prints to take home. Materials, good company, and a little creative mess included.",
      location: "Yerevan · The Print Room",
      category: "PRINTMAKING",
      art: "print" as const,
      seats: 10,
      venue: false,
      instructor: true,
      deadline: DEMO_START + 3 * day,
      activated: false,
    },
    {
      id: "coffee-lab",
      title: "A better cup of coffee",
      description:
        "Explore pour-over brewing, learn what changes the flavor, and find your favorite cup in a hands-on tasting session.",
      location: "Yerevan · Corner Lab",
      category: "FOOD & DRINK",
      art: "coffee" as const,
      seats: 10,
      venue: true,
      instructor: true,
      deadline: DEMO_START + day,
      activated: false,
    },
    {
      id: "botanical-studio",
      title: "Botanical sketchbook",
      description:
        "An introduction to drawing plants from life. Learn simple observation techniques and fill your first sketchbook pages.",
      location: "Yerevan · Garden Studio",
      category: "ILLUSTRATION",
      art: "botanical" as const,
      seats: 10,
      venue: true,
      instructor: true,
      deadline: DEMO_START + day,
      activated: true,
    },
    {
      id: "weekend-woodworking",
      title: "Made from wood",
      description:
        "Learn the basics of hand tools and build a small wooden tray. This demo booking missed its deadline; contributions can be refunded.",
      location: "Yerevan · Makers Room",
      category: "WOODWORKING",
      art: "wood" as const,
      seats: 3,
      venue: true,
      instructor: false,
      deadline: DEMO_START - day,
      activated: false,
    },
  ];
  const state: DemoState = {
    version: 1,
    now: DEMO_START,
    sequence: 100,
    identityId: "sam",
    deals: [],
    contributions: [],
    activity: [],
    payouts: [],
    balances: { ...INITIAL_BALANCES },
  };
  for (const spec of specs) {
    const publishedAt = DEMO_START - 4 * day;
    const committedAt = publishedAt + day;
    const deal: Deal = {
      id: spec.id,
      title: spec.title,
      description: spec.description,
      location: spec.location,
      category: spec.category,
      art: spec.art,
      seatPrice: 20,
      requiredSeats: 10,
      deadline: spec.deadline,
      publishedAt,
      organizerId: "organizer",
      activatedAt: spec.activated ? DEMO_START - 3_600_000 : null,
      venue: {
        identityId: "venue",
        name: spec.art === "clay" ? "Studio 04" : spec.location.split(" · ")[1],
        allocation: 80,
        approvedAt: spec.venue ? committedAt : null,
      },
      instructor: {
        identityId: "instructor",
        name:
          spec.art === "clay"
            ? "Clay workshop instructor"
            : `${spec.category.toLowerCase()} instructor`,
        allocation: 120,
        approvedAt: spec.instructor ? committedAt : null,
      },
    };
    state.deals.push(deal);
    for (const [identityId, seats] of [
      ["sam", 2],
      ["robin", spec.seats - 2],
    ] as const) {
      state.contributions.push({
        id: `seed-${spec.id}-${identityId}`,
        dealId: spec.id,
        identityId,
        seats,
        amount: seats * 20,
        createdAt: committedAt,
        refundedAt: null,
      });
      state.balances[identityId] -= seats * 20;
      state.activity.push({
        id: `seed-commit-${spec.id}-${identityId}`,
        dealId: spec.id,
        identityId,
        at: committedAt,
        kind: "commitment",
        message: `${identityId === "sam" ? "Sam" : "Robin"} committed ${seats} seats · ${seats * 20} demo tokens.`,
      });
    }
    state.activity.push({
      id: `seed-publish-${spec.id}`,
      dealId: spec.id,
      identityId: "organizer",
      at: publishedAt,
      kind: "published",
      message: "Organizer published the fixed booking terms.",
    });
    for (const supplier of ["venue", "instructor"] as const) {
      if (deal[supplier].approvedAt !== null)
        state.activity.push({
          id: `seed-approve-${spec.id}-${supplier}`,
          dealId: spec.id,
          identityId: supplier,
          at: committedAt,
          kind: "approval",
          message: `${supplier === "venue" ? "Venue" : "Instructor"} approved participation and the ${deal[supplier].allocation} demo token allocation.`,
        });
    }
    if (deal.activatedAt !== null) {
      state.payouts.push({
        dealId: deal.id,
        at: deal.activatedAt,
        venue: 80,
        instructor: 120,
      });
      state.balances.venue += 80;
      state.balances.instructor += 120;
      state.activity.push({
        id: `seed-activate-${deal.id}`,
        dealId: deal.id,
        identityId: "organizer",
        at: deal.activatedAt,
        kind: "activation",
        message:
          "Booking activated. Simulated payouts: venue 80 · instructor 120 demo tokens.",
      });
    }
  }
  return state;
}
