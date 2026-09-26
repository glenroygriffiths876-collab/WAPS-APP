# Architecture
Static GitHub Pages PWA. UI and deterministic engines run in-browser. IndexedDB stores profiles, goals, sessions, observations, custom AAC and settings, with a localStorage fallback if IndexedDB is unavailable. No server is required. Hash routing avoids GitHub Pages refresh 404s. Core assets are precached by the service worker.

The activity system is data-driven: multiple content sets use reusable identify/match/communicate/label interaction logic rather than separate hard-coded pages. AAC uses stable ordered vocabulary; category filtering does not rewrite its canonical order.
