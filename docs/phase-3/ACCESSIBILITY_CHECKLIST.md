# Phase 3 — Accessibility & Responsive QA Checklist

**Scope:** Public Marketing & Discovery Routes (`/`, `/courses`, `/courses/[slug]`, `/certifications`, `/certifications/[slug]`, `/about`, `/how-it-works`, `/faq`, `/contact`, `/privacy`, `/terms`, `not-found`).

---

## 1. Semantic Structure & Keyboard Navigation

- [x] Skip-to-main-content link (`<a href="#main-content">`) in `src/app/layout.tsx` targeting `<main id="main-content">` in `src/app/(marketing)/layout.tsx`.
- [x] Single logical `<h1>` per page with sequential `<h2>` / `<h3>` hierarchy.
- [x] Landmarks: `<header>`, `<nav aria-label="...">`, `<main id="main-content">`, `<footer>`.
- [x] Mobile navigation menu (`src/components/layout/mobile-nav.tsx`) supports `aria-expanded`, `aria-controls`, `Escape` key dismissal, and focus restoration to the toggle button.
- [x] FAQ disclosure controls (`src/components/shared/faq-accordion.tsx`) use native `<button>` elements with `aria-expanded`, `aria-controls`, and `role="region"` panels.
- [x] Contact form (`src/modules/contact/components/contact-form.tsx`) associates `<label htmlFor="...">`, `aria-invalid`, `aria-describedby` error messages, and `role="status"` / `role="alert"` announcements.
- [x] Global `:focus-visible` indicator and `prefers-reduced-motion: reduce` media query configured in `src/app/globals.css`.

---

## 2. Responsive Viewport Matrix

Tested layout constraints across `360px`, `390px`, `768px`, `1024px`, and `1440px`:

- [x] Responsive containers (`max-w-6xl px-4`) and grid breakpoints (`sm:`, `md:`, `lg:`) prevent horizontal overflow.
- [x] Interactive buttons and links meet touch-friendly sizing (`h-9` to `h-11`).
- [x] Automated Playwright viewport and overflow assertions added in `tests/e2e/public-site.spec.ts`.

---

## 3. Performance & Asset Hygiene

- [x] Server Components by default; Client Components restricted to `MobileNav`, `CourseCatalogView`, `FaqAccordion`, `ContactForm`, and `LogoutButton`.
- [x] Fonts loaded via `next/font/google` (`Geist`, `Geist_Mono`) with zero runtime layout-shift font loading.
- [x] No heavyweight animation libraries or unapproved third-party scripts.
- [ ] Local Lighthouse audit: Not executed in this session (documented as environment limitation).
