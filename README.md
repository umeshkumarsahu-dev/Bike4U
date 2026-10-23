# Bike for U 🏍️ 🛵

> **Find the right motorcycle or scooter in under two minutes.**  
> Five preferences in. Ranked matches and a downloadable verified PDF report out.

Built strictly according to the **Bike for U Product Requirements Document (PRD v1.0 MVP)**.

---

## 🌟 Key Features

1. **5 Plain-English Questions (FR-101 - FR-108)**
   - **Segment Selection:** Commuter, Sports, Cruiser, Adventure, Petrol Scooter, Electric (EV), or Not sure.
   - **Dual-Handle Budget Range:** INR 30,000 to INR 25,00,000 with quick-pick presets, auto-correction for swapped limits, and INR 20,000 min gap enforcement.
   - **Aesthetic Styling Tags:** Sporty, Classic, Cruiser, Rugged, Minimal, or No preference (max 2).
   - **Mileage / Range Economy:** ARAI km/l for petrol or certified full-charge range (km) for EVs.
   - **Must-Have Features:** ABS, Disc brakes, Digital console, Bluetooth, USB charging, LED headlamp, Alloy wheels (EV-irrelevant features auto-hidden).
   - **Live Hint API (FR-108):** Debounced counter showing real-time variant matches (e.g., *"38 bikes fit your budget in this segment"*).
   - **Mobile-First UX:** Step-by-step mobile wizard with progress indicator and thumb-zone sticky CTA.

2. **Deterministic Matching & Scoring Engine (Section 5)**
   - **No Black-Box ML or Sponsored Ads:** 100% explainable, deterministic mathematical algorithm.
   - **Hard Filters (Section 5.3):**
     - Active models only (discontinued and upcoming excluded).
     - Price capped at 115% of stated maximum budget.
     - Mileage floor enforced at 80% of stated minimum.
     - Powertrain exclusivity (EV segment returns EVs only; ICE segments exclude EVs).
   - **Five Weighted Sub-Scores (Section 5.4):**
     - **Features (25%):** Strict proportion of selected features present on variant.
     - **Segment (20%):** 100 for exact segment match; 50 for adjacent categories (e.g. Commuter ↔ Sports).
     - **Budget (20%):** 100 in-range, 80 below min, 60 up to 10% above, 30 up to 15% above.
     - **Mileage (20%):** $70 + 30 \times \min(1, \frac{m - r}{0.5r})$ for beating target; linear down to $0.8r$.
     - **Style (15%):** 100 for primary style tag match; 60 for secondary tag.
     - **Skipped Criteria:** Automatically renormalizes active weights: $\text{Total} = \frac{\sum w_i s_i}{\sum w_{\text{active}}}$.
   - **Diversity & Tie-Breakers (FR-301 - FR-303):**
     - Best variant per model collapsed.
     - At most 2 bikes per brand in the top 5.
     - Minimum total score threshold $\ge 40$.
   - **Relaxation Ladder (Section 5.6):**
     - Automatically widens budget cap to 125%, lowers mileage floor to 70%, or broadens to adjacent segments if fewer than 3 bikes qualify.
     - Empty states surface actionable unlock hints (e.g., *"Raise budget by INR 12,000 to unlock 6 bikes"*).

3. **Showroom-Ready 9-Page PDF Report (Section 7)**
   - Rendered from the exact same result snapshot via headless Chromium.
   - **Page 1:** Title, Report ID, QR code linking to live URL, preferences recap, and plain-English summary.
   - **Page 2:** Top 5 at a glance (cards with ranks, match %, prices, mileages, one-line reasons).
   - **Page 3:** Side-by-side comparison table highlighting best values per row.
   - **Pages 4 to 8:** Individual bike deep-dive (image, 5 score breakdown bars, 3 why-matched reasons, 2 trade-offs, full specs table, OEM link).
   - **Page 9:** Methodology disclosure, 'last verified' date, dealer test-ride checklist, and coming-soon teasers.

4. **Admin CMS & Data Governance (Section 6 & FR-501 - FR-505)**
   - Data quality dashboard (active variants, freshness within 60 days, stale records, price outliers).
   - Bulk CSV import with validation and interactive diff preview.
   - Immutable dataset versioning with 1-click rollback.
   - Role-Based Access Control (Admin, Publisher, Editor, Viewer).

5. **Compliance & SEO**
   - India's **Digital Personal Data Protection (DPDP) Act 2023** compliant cookie consent.
   - Programmatic SEO model pages (`/bikes/[brand]/[model]`) with Schema.org `Product` JSON-LD.
   - Dynamic `/sitemap.xml` and `/robots.txt` (results pages flagged as noindex).

---

## 🚀 Quick Start with Docker (Production Ready)

### 1. Prerequisites
- Docker (v20+)
- Docker Compose (v2+)

### 2. Launch with One Command
```bash
# Clone the repository
git clone https://github.com/your-username/Bike4U.git
cd Bike4U

# Linux / macOS
chmod +x scripts/setup.sh
./scripts/setup.sh

# Windows
scripts\setup.bat
```

Alternatively, use `docker compose` directly:
```bash
docker compose up -d --build
```

### 3. Access the Services
| Service | URL | Notes |
| :--- | :--- | :--- |
| **Bike for U Web App** | [http://localhost:3000](http://localhost:3000) | Full consumer experience & recommendation engine |
| **Admin CMS Panel** | [http://localhost:3000/admin](http://localhost:3000/admin) | Catalogue management, CSV import, versioning |
| **Container Healthcheck** | [http://localhost:3000/api/health](http://localhost:3000/api/health) | Docker health probe (DB & Redis status) |
| **PostgreSQL 16** | `localhost:5433` | Host port 5433 (mapped to container 5432) |
| **Redis 7 Cache** | `localhost:6380` | Host port 6380 (mapped to container 6379) |

---

## 🧪 Running the Automated Test Suite

The test suite contains full unit tests for:
- Exact verification of the PRD Section 5.7 Worked Example:
  - **Bike A 150:** Total = 90.15% (Rank 1)
  - **Bike C 110:** Total = 72.50% (Rank 2)
  - **Bike B 200:** Total = 67.25% (Rank 3)
  - **Bike D 250:** Excluded via 115% hard filter limit
- Boundary tests (100% vs 115% budget cap, exactly 80% mileage threshold).
- Skipped criteria weight renormalization.
- Brand diversity limit (at most 2 per brand in top 5).
- Relaxation ladder progression.

```bash
# Run unit tests with Vitest
npm test
```

---

## 📂 Project Architecture

```
Bike4U/
├── app/
│   ├── admin/                  # Admin CMS & Operations (FR-501 to FR-505)
│   ├── api/
│   │   ├── admin/              # Stats, variant CRUD, CSV import, versioning
│   │   ├── count-hint/         # Lightweight live count hint endpoint (FR-108)
│   │   ├── feedback/           # Was this helpful feedback endpoint (FR-306)
│   │   ├── health/             # Docker container healthcheck endpoint
│   │   ├── recommendations/    # Matching engine API & snapshot persistence
│   │   └── reports/[id]/pdf/   # 9-page headless Chromium PDF stream
│   ├── bikes/[brand]/[model]/  # Programmatic SEO pages with Schema.org JSON-LD
│   ├── results/[id]/           # Saved snapshot results view with shareable URL
│   ├── layout.tsx              # Root layout with DPDP Act banner & navigation
│   ├── page.tsx                # S1 Landing page & hero
│   ├── robots.ts               # Robots.txt
│   └── sitemap.ts              # XML Sitemap generator
├── components/
│   ├── BikeDetailModal.tsx     # Score breakdown & full specs modal
│   ├── ComparisonTable.tsx     # Side-by-side comparison table
│   ├── CookieBanner.tsx        # DPDP Act 2023 cookie consent
│   ├── RecommendationForm.tsx  # 5-question responsive wizard with live hints
│   └── ResultsView.tsx         # Ranked cards, trade-offs, sticky PDF bar
├── lib/
│   ├── matching-engine/
│   │   ├── config.ts           # Versioned weights, tolerances, thresholds
│   │   ├── engine.ts           # Sub-score formulas, filters, tie-breakers
│   │   └── types.ts            # Core data types and interfaces
│   ├── pdf/
│   │   └── generate-pdf.ts     # 9-page A4 PDF layout & Puppeteer renderer
│   ├── prisma.ts               # Prisma ORM client singleton
│   └── redis.ts                # Redis client with in-memory fallback
├── prisma/
│   ├── schema.prisma           # Relational schema (Brands, Models, Variants, Snapshots)
│   └── seed.ts                 # 50+ real Indian two-wheelers catalogue
├── scripts/
│   ├── setup.sh                # Linux/macOS Docker bootstrap script
│   └── setup.bat               # Windows Docker bootstrap script
├── test/
│   └── matching-engine.test.ts # Vitest test suite for PRD scoring specs
├── docker-compose.yml          # Multi-container orchestration (Web, DB, Redis)
├── docker-entrypoint.sh        # Container startup migration & seeding hook
├── Dockerfile                  # Multi-stage production build with Chromium
└── package.json
```

---

## 🔒 Security & Privacy (DPDP Act 2023)

- **Zero PII Required:** No user accounts, phone numbers, or logins are needed to explore, get recommendations, or download reports.
- **Data Minimization:** Result URLs persist an anonymous snapshot UUID.
- **Signed & Expiring Downloads:** PDF generation is tied to the stored snapshot and purged according to data retention schedules.
- **Safe Ports:** Configured with non-colliding host ports (`5433` for DB, `6380` for Redis) so you can run alongside existing local databases without interference.
