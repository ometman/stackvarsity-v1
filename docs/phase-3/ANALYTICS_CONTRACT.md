# Phase 3 — Privacy-Aware Analytics Event Contract

**Status:** Readiness contract implemented (`src/lib/analytics/events.ts`); collection **disabled by default** via `noopAnalyticsAdapter` until a provider, approved privacy policy, and consent mechanism are finalized.

---

## 1. Event Taxonomy

| Event Name                   | Trigger Condition                                       | Allowed Properties (No PII)               |
| ---------------------------- | ------------------------------------------------------- | ----------------------------------------- |
| `public_cta_clicked`         | Visitor clicks a primary discovery or registration CTA  | `ctaId`, `destination`, `surface`         |
| `course_viewed`              | Course detail page viewed                               | `slug`, `category`, `level`               |
| `catalog_filter_changed`     | Visitor submits search or changes category/level filter | `hasQuery` (boolean), `category`, `level` |
| `certification_track_viewed` | Certification track detail page viewed                  | `slug`, `issuer`                          |
| `contact_submitted`          | Contact inquiry succeeds server-side                    | `topic`, `deliveryMode`                   |

---

## 2. Data Minimization Rules

- **Prohibited fields:** Raw search queries, names, email addresses, message bodies, IP addresses, session tokens, and personally identifying URL parameters must never be included in analytics payloads.
- **Third-party scripts:** No external analytics script tags are loaded in Phase 3.
- **Future integration:** Phases 9–10 may supply a consent-gated `AnalyticsAdapter` implementation without changing event callers.
