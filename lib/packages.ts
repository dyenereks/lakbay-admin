export interface TourPackage {
  slug: string;
  name: string;
  /** Short one-liner used on cards and meta descriptions */
  tagline: string;
  /** Badge shown on the card image, e.g. duration + season */
  tag: string;
  price: string;
  priceAmount?: number;
  priceCurrency?: 'USD' | 'PHP';
  img: string;
  borderGradient: string;
  overview: string[];
  highlights?: string[];
  variants?: { name: string; route: string }[];
  inclusions?: string[];
  exclusions?: string[];
  travelDates?: string[];
  notes?: string[];
  /**
   * Whether the package is visible on the public site. Absent counts as
   * published, so documents written before this field existed stay live.
   */
  published?: boolean;
  /** Display order across the site; lower sorts first. */
  order?: number;
  /** ISO timestamp of the last admin edit. */
  updatedAt?: string;
}

/**
 * Seed data — the original hardcoded packages. Firestore is the runtime source
 * of truth (see lib/packages-data.ts); this array seeds it and acts as the
 * fallback when Firebase is unconfigured.
 */
export const seedPackages: TourPackage[] = [
  {
    slug: 'avatar-city-shanghai',
    name: 'Avatar City + Shanghai',
    tagline:
      'Zhangjiajie’s floating mountains, the Glass Bridge, Tianmen Mountain & modern Shanghai — 5D4N direct from Cebu',
    tag: '5D4N • Sep–Dec 2026',
    price: 'From $719',
    priceAmount: 719,
    priceCurrency: 'USD',
    img: '/images/packages/avatar-city-shanghai.jpg',
    borderGradient: 'linear-gradient(90deg, #D6246E 0%, #1565C0 50%, #78BE20 100%)',
    overview: [
      'Discover the real-life Avatar world! Journey to the spectacular landscapes of Zhangjiajie, the inspiration behind the floating mountains of Avatar. Cross the world-famous Glass Bridge, take in the breathtaking views from Tianmen Mountain, and experience the energy of modern Shanghai.',
      'From towering peaks to vibrant city lights, this is a journey where nature, adventure, and culture come together. Your China dream awaits!',
    ],
    highlights: [
      'Avatar City + Shanghai, 5 days & 4 nights',
      'Direct flights from Cebu',
      'From only USD 719 per person, all-in',
      'Multiple departures available from September to December 2026',
    ],
  },
  {
    slug: 'vietnam-rose-collection',
    name: 'Vietnam Rose Collection',
    tagline:
      'Premium to luxury tours — Hanoi, Ha Long Bay, Da Nang, Hoi An, Hue, Sapa & Ninh Binh. No compulsory shopping, no detours',
    tag: '2026–2027 departures',
    price: 'From ₱44,700',
    priceAmount: 44700,
    priceCurrency: 'PHP',
    img: '/images/packages/vietnam-rose-collection.jpg',
    borderGradient: 'linear-gradient(90deg, #7B2FA0 0%, #0EA5A5 50%, #D4941A 100%)',
    overview: [
      'Experience Vietnam through a collection of thoughtfully curated journeys, from the timeless charm of Hanoi and the emerald waters of Ha Long Bay to the golden beaches of Da Nang, the lantern-lit streets of Hoi An, and the imperial beauty of Hue. Explore the misty mountains of Sapa, the colorful Incense Village, and the breathtaking landscapes of Ninh Binh and Trang An.',
      'More than a vacation, the Vietnam Rose Collection is designed for travelers who seek comfort, culture, and unforgettable moments. Because some vacations simply happen, but these journeys bloom into memories that last a lifetime.',
    ],
    highlights: [
      'Premium to luxury Vietnam tours',
      'No compulsory shopping',
      'No detours',
      'Starts at ₱44,700 all-in per pax',
    ],
    variants: [
      { name: 'Vietnam Rose 1.0', route: 'Hanoi • Ha Long Bay' },
      { name: 'Vietnam Rose 2.0', route: 'Da Nang • Hoi An • Hue' },
      { name: 'Vietnam Rose 3.0', route: 'Hanoi • Sapa • Incense Village • Ninh Binh • Trang An' },
      { name: 'Vietnam Rose Reloaded', route: 'Hanoi • Sapa • Ha Long Bay' },
    ],
  },
  {
    slug: 'osaka-tokyo-summer-sale',
    name: 'Osaka & Tokyo Summer Sale',
    tagline:
      'Unforgettable shopping & sightseeing in Japan — travel dates available until December 2026',
    tag: 'Limited slots',
    price: 'From $1,196',
    priceAmount: 1196,
    priceCurrency: 'USD',
    img: '/images/packages/osaka-tokyo-summer-sale.jpg',
    borderGradient: 'linear-gradient(90deg, #1565C0 0%, #78BE20 50%, #E86B20 100%)',
    overview: [
      'Get ready for an unforgettable shopping and sightseeing adventure in Osaka this July and Tokyo this August! Limited slots are still available, with packages starting at just USD 1,196 per person.',
      'Can’t make it in July or August? No worries! Multiple travel dates are available all the way until December 2026, giving you more chances to experience Japan your way.',
      'Reserve your slot today and create your own #MemorableJapan experience!',
    ],
    highlights: [
      'Osaka departures this July, Tokyo this August',
      'Packages starting at USD 1,196 per person',
      'Multiple travel dates available until December 2026',
      'Limited slots — reserve early',
    ],
  },
  {
    slug: 'go-boracay-2026',
    name: 'Go Boracay 2026',
    tagline:
      'Crystal-clear waters & powdery white sand — airfare, hotel, transfers, daily breakfast & environmental fee included',
    tag: '4D3N • Multiple 2026 dates',
    price: 'From ₱19,500',
    priceAmount: 19500,
    priceCurrency: 'PHP',
    img: '/images/packages/go-boracay-2026.jpg',
    borderGradient: 'linear-gradient(90deg, #0EA5A5 0%, #E86B20 50%, #D6246E 100%)',
    overview: [
      'Your dream island getaway awaits! Escape to the world-famous shores of Boracay with our 4 Days & 3 Nights package and experience crystal-clear waters, powdery white sand beaches, and unforgettable tropical adventures.',
      'Whether you’re traveling with family, friends, or your special someone, Boracay is the perfect destination to relax, unwind, and make lasting memories. Book your Boracay escape today and let us take care of the rest!',
    ],
    highlights: [
      'Multiple 2026 travel dates available',
      'Starting at only ₱19,500 per person',
    ],
    inclusions: [
      'Roundtrip airfare',
      'Hotel accommodation',
      'Airport transfers',
      'Daily breakfast',
      'Environmental fee included',
    ],
  },
  {
    slug: 'bangkok-pattaya',
    name: 'Bangkok–Pattaya',
    tagline:
      'Visa-free Thailand — Nong Nooch Garden, Wat Arun, Floating Market, Pattaya Night Market & 4★ hotel stay',
    tag: '4D3N • Oct–Dec 2026',
    price: 'From ₱33,600',
    priceAmount: 33600,
    priceCurrency: 'PHP',
    img: '/images/packages/bangkok-pattaya.jpg',
    borderGradient: 'linear-gradient(90deg, #D6246E 0%, #7B2FA0 50%, #1565C0 100%)',
    overview: [
      'Experience the perfect mix of culture, adventure, and shopping in Thailand with our 4 Days & 3 Nights Bangkok–Pattaya tour. Message Lakbay Travel and Tours now for bookings and inquiries.',
      'Reserve now & enjoy your Thai getaway!',
    ],
    highlights: [
      'Visa free | Direct flight via Cebu Pacific',
      'Nong Nooch Tropical Garden & Elephant Show',
      'Iconic sights: Wat Arun, Khao Chi Chan & Floating Market',
      'J-Park Nihon Mura + Latex & Honey Exhibition',
      'Shopping at Pattaya Night Market & King Power',
      '4★ Pattaya hotel stay',
    ],
    travelDates: [
      'Oct 15–18, 2026',
      'Oct 22–25, 2026',
      'Oct 29 – Nov 1, 2026',
      'Nov 12–15, 2026',
      'Nov 19–22, 2026',
      'Dec 3–6, 2026',
      'Dec 10–13, 2026',
      'Dec 17–20, 2026',
      'Dec 24–27, 2026',
    ],
  },
  {
    slug: 'taiwan-holidays-2026',
    name: 'Taiwan Holidays 2026',
    tagline:
      'Best-selling Taichung–Taipei tours with Zhongshe Flower Market — airfare, 4★ hotel, tours & travel insurance included',
    tag: '5D3N • Fully loaded tours',
    price: 'Inquire for rates',
    img: '/images/packages/taiwan-holidays-2026.jpg',
    borderGradient: 'linear-gradient(90deg, #78BE20 0%, #0EA5A5 50%, #7B2FA0 100%)',
    overview: [
      'Spend 5 days and 3 nights in Taiwan on our best-selling Taichung–Taipei tours, featuring the famous Zhongshe Flower Market. Fully loaded touring with entrances, meals, and an English-speaking guide — just show up and enjoy.',
    ],
    inclusions: [
      'Roundtrip airfare via Cebu Pacific',
      '7 kg handcarry luggage',
      '3 nights accommodation in 4★ hotel or similar',
      'Meals as per itinerary',
      'Roundtrip airport transfers',
      'Fully loaded tours as per itinerary',
      'Taichung tour with Zhongshe Flower Market',
      'Entrances and admission fees',
      'English-speaking tour guide',
      'Travel insurance',
    ],
    exclusions: [
      'PH Travel Tax (₱1,620)',
      'Tipping $5/pax/day ($20) or ₱1,200/pax',
      'Check-in baggage',
    ],
    notes: ['All terms and conditions apply.'],
  },
];
