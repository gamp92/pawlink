import type { ReactNode } from 'react'
import 'leaflet/dist/leaflet.css'

export const metadata = {
  title: 'Pawlink',
  description: 'Mobile-first shelter and public pet care app.',
}

const appStyles = String.raw`
:root {
  --color-page: #f7f8fb;
  --color-surface: #ffffff;
  --color-surface-muted: #f8fafc;
  --color-surface-accent: #f5f3ff;
  --color-border: #e2e8f0;
  --color-border-strong: #cbd5e1;
  --color-text: #020617;
  --color-text-muted: #64748b;
  --color-text-soft: #94a3b8;
  --color-primary: #7c3aed;
  --color-primary-strong: #6d28d9;
  --color-primary-soft: #f5f3ff;
  --color-primary-ring: #ede9fe;
  --color-success: #047857;
  --color-success-soft: #ecfdf5;
  --color-info: #0f766e;
  --color-info-soft: #f0fdfa;
  --color-warning: #b45309;
  --color-warning-soft: #fffbeb;
  --color-danger: #be123c;
  --color-danger-soft: #fff1f2;
  --space-1: .25rem;
  --space-2: .5rem;
  --space-3: .75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --radius-sm: .5rem;
  --radius-md: .75rem;
  --radius-lg: 1rem;
  --radius-xl: 1.25rem;
  --radius-2xl: 1.5rem;
  --radius-full: 9999px;
  --shadow-xs: 0 1px 2px rgba(15,23,42,.05);
  --shadow-sm: 0 8px 24px rgba(15,23,42,.06);
  --shadow-md: 0 16px 44px rgba(15,23,42,.10);
  --shadow-lg: 0 24px 70px rgba(15,23,42,.16);
  --shadow-focus: 0 0 0 4px var(--color-primary-ring);
  --text-xs: .75rem;
  --text-sm: .875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --text-4xl: 2.25rem;
}
* { box-sizing: border-box; }
html { background: var(--color-page); -webkit-text-size-adjust: 100%; }
body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: var(--color-text); background: var(--color-page); }
a { color: inherit; text-decoration: none; }
button, input, select, textarea { font: inherit; }
button { border: 0; cursor: pointer; }
button:disabled { cursor: not-allowed; opacity: .65; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
.ds-focus { outline: none; box-shadow: var(--shadow-focus); }
.ds-card { border: 1px solid var(--color-border); border-radius: var(--radius-2xl); background: var(--color-surface); box-shadow: var(--shadow-xs); }
.ds-card-muted { background: var(--color-surface-muted); }
.ds-card-accent { border-color: #ddd6fe; background: var(--color-primary-soft); }
.ds-card-pad-sm { padding: var(--space-3); }
.ds-card-pad-md { padding: var(--space-4); }
.ds-card-pad-lg { padding: var(--space-6); }
.ds-card-interactive { transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease; }
.ds-card-interactive:hover { transform: translateY(-2px); border-color: #ddd6fe; box-shadow: var(--shadow-md); }
.ds-card-interactive:focus { outline: none; box-shadow: var(--shadow-focus), var(--shadow-md); }
.ds-button { display: inline-flex; align-items: center; justify-content: center; gap: var(--space-2); border: 1px solid transparent; border-radius: var(--radius-lg); font-weight: 800; line-height: 1; box-shadow: var(--shadow-xs); transition: transform 160ms ease, border-color 160ms ease, background-color 160ms ease, color 160ms ease, box-shadow 160ms ease; }
.ds-button:hover { transform: translateY(-1px); box-shadow: var(--shadow-sm); }
.ds-button:focus { outline: none; box-shadow: var(--shadow-focus), var(--shadow-sm); }
.ds-button:disabled { pointer-events: none; transform: none; opacity: .58; box-shadow: none; }
.ds-button-sm { min-height: 2.5rem; padding: 0 var(--space-3); font-size: var(--text-xs); }
.ds-button-md { min-height: 2.75rem; padding: 0 var(--space-4); font-size: var(--text-sm); }
.ds-button-lg { min-height: 3rem; padding: 0 var(--space-5); font-size: var(--text-base); }
.ds-button-primary { border-color: var(--color-primary); background: var(--color-primary); color: #fff; }
.ds-button-primary:hover { border-color: var(--color-primary-strong); background: var(--color-primary-strong); }
.ds-button-secondary { border-color: var(--color-border); background: var(--color-surface); color: #334155; }
.ds-button-secondary:hover { border-color: #ddd6fe; color: var(--color-primary-strong); }
.ds-button-ghost { border-color: transparent; background: transparent; color: #475569; box-shadow: none; }
.ds-button-ghost:hover { background: var(--color-surface-muted); color: #334155; box-shadow: none; }
.ds-button-danger { border-color: #e11d48; background: #e11d48; color: #fff; }
.ds-button-danger:hover { border-color: var(--color-danger); background: var(--color-danger); }
.ds-icon-button { display: grid; width: 2.75rem; height: 2.75rem; place-items: center; border: 1px solid var(--color-border); border-radius: var(--radius-full); background: var(--color-surface); color: #475569; box-shadow: var(--shadow-xs); transition: transform 160ms ease, border-color 160ms ease, color 160ms ease, box-shadow 160ms ease; }
.ds-icon-button:hover { transform: translateY(-1px); border-color: #ddd6fe; color: var(--color-primary-strong); box-shadow: var(--shadow-sm); }
.ds-icon-button:focus { outline: none; box-shadow: var(--shadow-focus), var(--shadow-sm); }
.ds-input-shell { display: flex; align-items: center; min-height: 3rem; border: 1px solid var(--color-border); border-radius: var(--radius-xl); background: var(--color-surface); box-shadow: var(--shadow-xs); transition: border-color 160ms ease, box-shadow 160ms ease; }
.ds-input-shell:focus-within { border-color: #8b5cf6; box-shadow: var(--shadow-focus); }
.ds-input { width: 100%; min-width: 0; border: 0; background: transparent; color: var(--color-text); outline: none; }
.ds-input::placeholder { color: var(--color-text-soft); }
.ds-chip { display: inline-flex; min-height: 2.5rem; flex-shrink: 0; align-items: center; justify-content: center; gap: var(--space-2); border: 1px solid var(--color-border); border-radius: var(--radius-full); background: var(--color-surface); padding: .45rem .8rem; color: #475569; font-size: var(--text-xs); font-weight: 800; box-shadow: var(--shadow-xs); transition: transform 160ms ease, border-color 160ms ease, background-color 160ms ease, color 160ms ease, box-shadow 160ms ease; }
.ds-chip:hover { transform: translateY(-1px); border-color: #ddd6fe; color: var(--color-primary-strong); box-shadow: var(--shadow-sm); }
.ds-chip:focus { outline: none; box-shadow: var(--shadow-focus); }
.ds-chip-active { border-color: #c4b5fd; background: var(--color-primary-soft); color: var(--color-primary-strong); }
.ds-badge { display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--color-border); border-radius: var(--radius-full); padding: .28rem .65rem; font-size: 11px; font-weight: 800; line-height: 1; }
.ds-badge-slate { background: var(--color-surface-muted); color: #475569; }
.ds-badge-violet, .ds-badge-purple { border-color: #ddd6fe; background: var(--color-primary-soft); color: var(--color-primary-strong); }
.ds-badge-teal { border-color: #99f6e4; background: var(--color-info-soft); color: var(--color-info); }
.ds-badge-green { border-color: #a7f3d0; background: var(--color-success-soft); color: var(--color-success); }
.ds-badge-rose, .ds-badge-red { border-color: #fecdd3; background: var(--color-danger-soft); color: var(--color-danger); }
.ds-badge-amber { border-color: #fde68a; background: var(--color-warning-soft); color: var(--color-warning); }
.ds-state { overflow: hidden; text-align: center; }
.ds-state-icon { position: relative; display: grid; width: 4rem; height: 4rem; margin: 0 auto; place-items: center; border-radius: var(--radius-2xl); background: linear-gradient(135deg, var(--color-primary-soft), var(--color-info-soft)); color: var(--color-primary-strong); font-size: var(--text-xl); font-weight: 900; box-shadow: var(--shadow-xs); }
.ds-state-icon-success { background: linear-gradient(135deg, var(--color-success-soft), var(--color-info-soft)); color: var(--color-success); }
.ds-dialog-backdrop { background: rgba(2,6,23,.42); }
.ds-dialog-panel { border: 1px solid rgba(255,255,255,.72); border-radius: var(--radius-2xl); background: var(--color-surface); box-shadow: var(--shadow-lg); }
.min-h-screen { min-height: 100vh; }
.min-h-0 { min-height: 0; }
.mx-auto { margin-left: auto; margin-right: auto; }
.mt-0\.5 { margin-top: .125rem; } .mt-1 { margin-top: .25rem; } .mt-2 { margin-top: .5rem; } .mt-3 { margin-top: .75rem; } .mt-4 { margin-top: 1rem; } .mt-5 { margin-top: 1.25rem; } .mt-6 { margin-top: 1.5rem; } .mt-8 { margin-top: 2rem; } .mt-10 { margin-top: 2.5rem; }
.mb-1 { margin-bottom: .25rem; } .mb-3 { margin-bottom: .75rem; } .mb-4 { margin-bottom: 1rem; } .mb-5 { margin-bottom: 1.25rem; } .mb-6 { margin-bottom: 1.5rem; } .mb-8 { margin-bottom: 2rem; } .mb-10 { margin-bottom: 2.5rem; } .ml-auto { margin-left: auto; } .-mx-1 { margin-left: -.25rem; margin-right: -.25rem; } .-mx-4 { margin-left: -1rem; margin-right: -1rem; }
.p-2 { padding: .5rem; } .p-3 { padding: .75rem; } .p-4 { padding: 1rem; } .p-5 { padding: 1.25rem; } .p-6 { padding: 1.5rem; } .p-8 { padding: 2rem; }
.px-2 { padding-left: .5rem; padding-right: .5rem; } .px-3 { padding-left: .75rem; padding-right: .75rem; } .px-4 { padding-left: 1rem; padding-right: 1rem; } .px-5 { padding-left: 1.25rem; padding-right: 1.25rem; } .px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
.py-0\.5 { padding-top: .125rem; padding-bottom: .125rem; } .py-1 { padding-top: .25rem; padding-bottom: .25rem; } .py-1\.5 { padding-top: .375rem; padding-bottom: .375rem; } .py-2 { padding-top: .5rem; padding-bottom: .5rem; } .py-3 { padding-top: .75rem; padding-bottom: .75rem; } .py-4 { padding-top: 1rem; padding-bottom: 1rem; } .py-5 { padding-top: 1.25rem; padding-bottom: 1.25rem; }
.pb-0 { padding-bottom: 0; } .pb-2 { padding-bottom: .5rem; } .pb-3 { padding-bottom: .75rem; } .pb-20 { padding-bottom: 5rem; } .pt-2 { padding-top: .5rem; } .pt-4 { padding-top: 1rem; }
.grid { display: grid; } .flex { display: flex; } .inline-flex { display: inline-flex; } .block { display: block; } .hidden { display: none; }
.items-center { align-items: center; } .items-start { align-items: flex-start; } .justify-center { justify-content: center; } .justify-between { justify-content: space-between; } .place-items-center { place-items: center; } .self-start { align-self: flex-start; }
.shrink-0 { flex-shrink: 0; } .flex-1 { flex: 1 1 0%; } .flex-col { flex-direction: column; } .flex-wrap { flex-wrap: wrap; }
.gap-1 { gap: .25rem; } .gap-2 { gap: .5rem; } .gap-3 { gap: .75rem; } .gap-4 { gap: 1rem; } .gap-5 { gap: 1.25rem; } .gap-6 { gap: 1.5rem; } .gap-8 { gap: 2rem; } .gap-10 { gap: 2.5rem; }
.space-y-2 > :not([hidden]) ~ :not([hidden]) { margin-top: .5rem; } .space-y-3 > :not([hidden]) ~ :not([hidden]) { margin-top: .75rem; } .space-y-4 > :not([hidden]) ~ :not([hidden]) { margin-top: 1rem; } .space-y-5 > :not([hidden]) ~ :not([hidden]) { margin-top: 1.25rem; }
.max-w-md { max-width: 28rem; } .max-w-3xl { max-width: 48rem; } .max-w-5xl { max-width: 64rem; } .max-w-6xl { max-width: 72rem; } .max-w-7xl { max-width: 80rem; } .max-w-\[520px\] { max-width: 520px; } .max-w-\[82\%\] { max-width: 82%; } .max-w-\[1400px\] { max-width: 1400px; }
.min-w-0 { min-width: 0; } .w-px { width: 1px; } .w-5 { width: 1.25rem; } .w-8 { width: 2rem; } .w-10 { width: 2.5rem; } .w-11 { width: 2.75rem; } .w-12 { width: 3rem; } .w-14 { width: 3.5rem; } .w-20 { width: 5rem; } .w-36 { width: 9rem; } .w-40 { width: 10rem; } .w-full { width: 100%; }
.h-1\.5 { height: .375rem; } .h-2 { height: .5rem; } .h-5 { height: 1.25rem; } .h-8 { height: 2rem; } .h-10 { height: 2.5rem; } .h-11 { height: 2.75rem; } .h-12 { height: 3rem; } .h-14 { height: 3.5rem; } .h-20 { height: 5rem; } .h-24 { height: 6rem; } .h-36 { height: 9rem; } .h-40 { height: 10rem; } .h-full { height: 100%; }
.min-h-\[255px\] { min-height: 255px; } .min-h-\[320px\] { min-height: 320px; } .max-h-\[82vh\] { max-height: 82vh; }
.min-h-11 { min-height: 2.75rem; } .max-h-\[360px\] { max-height: 360px; } .max-h-\[calc\(100vh-2rem\)\] { max-height: calc(100vh - 2rem); }
.relative { position: relative; } .absolute { position: absolute; } .fixed { position: fixed; } .sticky { position: sticky; }
.inset-0 { inset: 0; } .left-\[18\%\] { left: 18%; } .left-\[22\%\] { left: 22%; } .top-\[22\%\] { top: 22%; } .top-\[28\%\] { top: 28%; } .top-0 { top: 0; } .top-3 { top: .75rem; } .top-4 { top: 1rem; } .bottom-0 { bottom: 0; } .bottom-3 { bottom: .75rem; } .bottom-4 { bottom: 1rem; } .bottom-20 { bottom: 5rem; } .left-0 { left: 0; } .left-3 { left: .75rem; } .left-4 { left: 1rem; } .right-0 { right: 0; } .right-3 { right: .75rem; } .right-4 { right: 1rem; } .z-10 { z-index: 10; } .z-20 { z-index: 20; } .z-30 { z-index: 30; } .z-40 { z-index: 40; } .z-50 { z-index: 50; } .z-\[500\] { z-index: 500; }
.overflow-hidden { overflow: hidden; } .overflow-x-auto { overflow-x: auto; } .overflow-y-auto { overflow-y: auto; }
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.rounded { border-radius: .25rem; } .rounded-md { border-radius: .375rem; } .rounded-lg { border-radius: .5rem; } .rounded-xl { border-radius: .75rem; } .rounded-2xl { border-radius: 1rem; } .rounded-3xl { border-radius: 1.5rem; } .rounded-\[1\.35rem\] { border-radius: 1.35rem; } .rounded-\[1\.5rem\] { border-radius: 1.5rem; } .rounded-\[1\.75rem\] { border-radius: 1.75rem; } .rounded-t-3xl { border-top-left-radius: 1.5rem; border-top-right-radius: 1.5rem; } .rounded-full { border-radius: 9999px; }
.border { border-width: 1px; border-style: solid; } .border-0 { border-width: 0; } .border-b { border-bottom-width: 1px; border-bottom-style: solid; } .border-t { border-top-width: 1px; border-top-style: solid; } .border-dashed { border-style: dashed; }
.border-transparent { border-color: transparent; } .border-white\/60 { border-color: rgba(255,255,255,.6); } .border-slate-100 { border-color: #f1f5f9; } .border-slate-200 { border-color: #e2e8f0; } .border-slate-300 { border-color: #cbd5e1; } .border-violet-200 { border-color: #ddd6fe; } .border-violet-300 { border-color: #c4b5fd; } .border-violet-600 { border-color: #7c3aed; } .border-teal-100 { border-color: #ccfbf1; } .border-teal-200 { border-color: #99f6e4; } .border-rose-200 { border-color: #fecdd3; } .border-rose-500 { border-color: #f43f5e; } .border-rose-600 { border-color: #e11d48; } .border-amber-200 { border-color: #fde68a; } .border-emerald-200 { border-color: #a7f3d0; }
.bg-transparent { background-color: transparent; } .bg-white { background-color: #fff; } .bg-white\/80 { background-color: rgba(255,255,255,.8); } .bg-white\/90 { background-color: rgba(255,255,255,.9); }
.bg-slate-50 { background-color: #f8fafc; } .bg-slate-50\/95 { background-color: rgba(248,250,252,.95); } .bg-slate-100 { background-color: #f1f5f9; } .bg-slate-200 { background-color: #e2e8f0; } .bg-slate-800 { background-color: #1e293b; } .bg-slate-950 { background-color: #020617; } .bg-slate-950\/40 { background-color: rgba(2,6,23,.4); }
.bg-violet-50 { background-color: #f5f3ff; } .bg-violet-100 { background-color: #ede9fe; } .bg-violet-600 { background-color: #7c3aed; } .bg-teal-50 { background-color: #f0fdfa; } .bg-teal-100\/60 { background-color: rgba(204,251,241,.6); } .bg-teal-600 { background-color: #0d9488; } .bg-rose-50 { background-color: #fff1f2; } .bg-rose-600 { background-color: #e11d48; } .bg-amber-50 { background-color: #fffbeb; } .bg-emerald-50 { background-color: #ecfdf5; }
.bg-gradient-to-br { background-image: linear-gradient(to bottom right, var(--tw-gradient-from, #f5f3ff), var(--tw-gradient-to, #f0fdfa)); } .from-white { --tw-gradient-from: #fff; } .from-violet-50 { --tw-gradient-from: #f5f3ff; } .from-teal-50 { --tw-gradient-from: #f0fdfa; } .from-rose-50 { --tw-gradient-from: #fff1f2; } .from-slate-50 { --tw-gradient-from: #f8fafc; } .to-white { --tw-gradient-to: #fff; } .to-teal-50 { --tw-gradient-to: #f0fdfa; } .to-slate-50 { --tw-gradient-to: #f8fafc; }
[class*="linear-gradient"] { background-image: linear-gradient(90deg, rgba(15,118,110,.12) 1px, transparent 1px), linear-gradient(rgba(15,118,110,.12) 1px, transparent 1px); } [class~="bg-[size:86px_86px]"] { background-size: 86px 86px; }
.text-white { color: #fff; } .text-slate-400 { color: #94a3b8; } .text-slate-500 { color: #64748b; } .text-slate-600 { color: #475569; } .text-slate-700 { color: #334155; } .text-slate-800 { color: #1e293b; } .text-slate-950 { color: #020617; } .text-violet-600 { color: #7c3aed; } .text-violet-700 { color: #6d28d9; } .text-violet-900 { color: #4c1d95; } .text-teal-600 { color: #0d9488; } .text-teal-700 { color: #0f766e; } .text-rose-600 { color: #e11d48; } .text-rose-700 { color: #be123c; } .text-amber-700 { color: #b45309; } .text-emerald-700 { color: #047857; }
.text-\[10px\] { font-size: 10px; } .text-\[11px\] { font-size: 11px; } .text-xs { font-size: .75rem; line-height: 1rem; } .text-sm { font-size: .875rem; line-height: 1.25rem; } .text-base { font-size: 1rem; line-height: 1.5rem; } .text-lg { font-size: 1.125rem; line-height: 1.75rem; } .text-xl { font-size: 1.25rem; line-height: 1.75rem; } .text-2xl { font-size: 1.5rem; line-height: 2rem; } .text-3xl { font-size: 1.875rem; line-height: 2.25rem; } .text-4xl { font-size: 2.25rem; line-height: 2.5rem; } .text-5xl { font-size: 3rem; line-height: 1; }
.font-medium { font-weight: 500; } .font-semibold { font-weight: 600; } .font-bold { font-weight: 700; } .font-black { font-weight: 900; }
.uppercase { text-transform: uppercase; } .tracking-tight { letter-spacing: -0.025em; } .tracking-wide { letter-spacing: .025em; } .leading-none { line-height: 1; } .leading-4 { line-height: 1rem; } .leading-5 { line-height: 1.25rem; } .leading-6 { line-height: 1.5rem; } .leading-7 { line-height: 1.75rem; }
.text-center { text-align: center; } .text-left { text-align: left; } .text-right { text-align: right; }
.shadow-sm { box-shadow: 0 1px 2px rgba(15,23,42,.06); } .shadow-lg { box-shadow: 0 18px 50px rgba(15,23,42,.12); } .shadow-xl { box-shadow: 0 24px 70px rgba(15,23,42,.18); } .shadow-none { box-shadow: none; }
.backdrop-blur { backdrop-filter: blur(14px); }
.outline-none { outline: 2px solid transparent; outline-offset: 2px; }
.animate-pulse { animation: dsPulse 1.8s cubic-bezier(.4,0,.6,1) infinite; }
.transition { transition-property: color, background-color, border-color, transform, box-shadow, opacity; transition-duration: 180ms; transition-timing-function: ease; }
.hover\:-translate-y-0\.5:hover { transform: translateY(-.125rem); }
.hover\:shadow-lg:hover { box-shadow: 0 18px 50px rgba(15,23,42,.12); }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); } .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.last\:border-0:last-child { border-width: 0; } .last\:pb-0:last-child { padding-bottom: 0; }
@media (min-width: 640px) { .sm\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); } .sm\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); } .sm\:flex-row { flex-direction: row; } .sm\:items-center { align-items: center; } .sm\:justify-between { justify-content: space-between; } .sm\:text-4xl { font-size: 2.25rem; line-height: 2.5rem; } }
@media (min-width: 640px) { [class~="sm:grid-cols-[repeat(auto-fit,minmax(260px,1fr))]"] { grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); } }
@media (min-width: 640px) { [class~="sm:grid-cols-[repeat(auto-fill,minmax(260px,320px))]"] { grid-template-columns: repeat(auto-fill, minmax(260px, 320px)); } }
@media (min-width: 768px) { .md\:static { position: static; } .md\:sticky { position: sticky; } .md\:block { display: block; } .md\:flex { display: flex; } .md\:hidden { display: none; } .md\:max-h-none { max-height: none; } .md\:self-start { align-self: flex-start; } .md\:rounded-2xl { border-radius: 1rem; } .md\:shadow-sm { box-shadow: 0 1px 2px rgba(15,23,42,.06); } .md\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); } .md\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); } [class~="md:grid-cols-[150px_1fr]"] { grid-template-columns: 150px 1fr; } [class~="md:grid-cols-[220px_1fr]"] { grid-template-columns: 220px 1fr; } [class~="md:grid-cols-[1fr_170px]"] { grid-template-columns: 1fr 170px; } [class~="md:grid-cols-[180px_1fr]"] { grid-template-columns: 180px 1fr; } .md\:top-4 { top: 1rem; } .md\:p-6 { padding: 1.5rem; } .md\:p-8 { padding: 2rem; } .md\:pb-6 { padding-bottom: 1.5rem; } .md\:text-5xl { font-size: 3rem; line-height: 1; } }
@media (min-width: 1024px) { .lg\:block { display: block; } .lg\:hidden { display: none; } .lg\:flex-row { flex-direction: row; } .lg\:items-center { align-items: center; } .lg\:items-end { align-items: flex-end; } .lg\:justify-between { justify-content: space-between; } .lg\:sticky { position: sticky; } .lg\:grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); } .lg\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); } .lg\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); } .lg\:self-start { align-self: flex-start; } .lg\:top-4 { top: 1rem; } .lg\:pb-0 { padding-bottom: 0; } .lg\:max-h-\[360px\] { max-height: 360px; } .lg\:overflow-y-auto { overflow-y: auto; } .lg\:grid-cols-\[1\.1fr_0\.9fr\] { grid-template-columns: 1.1fr .9fr; } [class~="lg:grid-cols-[1fr_340px]"] { grid-template-columns: 1fr 340px; } [class~="lg:grid-cols-[1fr_360px]"] { grid-template-columns: 1fr 360px; } [class~="lg:grid-cols-[minmax(0,1.6fr)_minmax(360px,0.95fr)]"] { grid-template-columns: minmax(0, 1.6fr) minmax(360px, .95fr); } [class~="lg:grid-cols-[minmax(0,1fr)_360px]"] { grid-template-columns: minmax(0, 1fr) 360px; } }
@media (min-width: 1024px) { [class~="lg:grid-cols-[minmax(0,1fr)_360px]"] { grid-template-columns: minmax(0, 1fr) 360px; } }
@media (min-width: 1280px) { .xl\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); } }

.pawlink-map-shell { position: relative; width: 100%; height: 420px; min-height: 420px; overflow: hidden; border: 1px solid #ccfbf1; border-radius: 24px; background: #f0fdfa; box-shadow: 0 24px 70px rgba(13,148,136,.16); }
.pawlink-map-shell .leaflet-container { width: 100%; height: 100%; min-height: inherit; font: inherit; z-index: 1; }
.pawlink-map-shell .leaflet-control-container { position: relative; z-index: 400; }
.pawlink-map-overlay { position: absolute; z-index: 500; }
.pawlink-map-control-stack { position: absolute; z-index: 500; right: .75rem; top: 5.75rem; display: grid; gap: .5rem; }
.pawlink-map-control-group { overflow: hidden; border: 1px solid rgba(255,255,255,.82); border-radius: 1.15rem; background: rgba(255,255,255,.94); box-shadow: 0 12px 34px rgba(15,23,42,.16); backdrop-filter: blur(14px); }
.pawlink-map-control-button { display: grid; width: 44px; height: 44px; place-items: center; color: #334155; font: 900 15px/1 Inter, ui-sans-serif, system-ui; transition: background-color 160ms ease, color 160ms ease, transform 160ms ease; }
.pawlink-map-control-button + .pawlink-map-control-button { border-top: 1px solid #e2e8f0; }
.pawlink-map-control-button:hover { background: #f5f3ff; color: #6d28d9; }
.pawlink-map-control-button:focus { outline: none; box-shadow: inset 0 0 0 3px #ede9fe; }
.pawlink-map-filter-panel { position: absolute; z-index: 500; left: .75rem; right: .75rem; top: .75rem; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .55rem; pointer-events: none; }
.pawlink-map-count { pointer-events: auto; border: 1px solid rgba(255,255,255,.82); border-radius: 999px; background: rgba(255,255,255,.95); padding: .55rem .8rem; color: #0f172a; font-size: 12px; font-weight: 950; box-shadow: 0 12px 34px rgba(15,23,42,.14); backdrop-filter: blur(14px); }
.pawlink-map-filter-row { pointer-events: auto; display: flex; gap: .4rem; overflow-x: auto; border: 1px solid rgba(255,255,255,.82); border-radius: 999px; background: rgba(255,255,255,.95); padding: .3rem; box-shadow: 0 12px 34px rgba(15,23,42,.14); backdrop-filter: blur(14px); }
.pawlink-map-filter-row button { min-height: 2rem; border-radius: 999px; padding: 0 .7rem; color: #475569; font-size: 11px; font-weight: 950; transition: background-color 160ms ease, color 160ms ease, transform 160ms ease; }
.pawlink-map-filter-row button:hover, .pawlink-map-filter-row button:focus { background: #f5f3ff; color: #6d28d9; outline: none; }
.pawlink-map-filter-row button[data-selected="true"] { background: #7c3aed; color: #fff; }
.pawlink-map-legend { position: absolute; z-index: 500; left: .75rem; bottom: .75rem; border: 1px solid rgba(255,255,255,.82); border-radius: 1rem; background: rgba(255,255,255,.94); padding: .65rem .75rem; box-shadow: 0 12px 34px rgba(15,23,42,.12); backdrop-filter: blur(14px); color: #334155; font-size: 11px; font-weight: 850; }
.pawlink-map-legend div { display: flex; align-items: center; gap: .42rem; }
.pawlink-map-legend-dot { display: inline-block; width: .7rem; height: .7rem; border-radius: 999px; }
.pawlink-map-legend-lost { background: #e11d48; }
.pawlink-map-legend-found { background: #0d9488; }
.pawlink-map-legend-ring { display: inline-block; width: .75rem; height: .75rem; border: 2px dashed #7c3aed; border-radius: 999px; }
.pawlink-report-map { height: 420px; min-height: 420px; }
.pawlink-picker-map { height: 380px; min-height: 380px; }
.pawlink-map-loading { display: grid; place-items: center; width: 100%; height: 100%; min-height: inherit; }
.pawlink-map-skeleton { position: relative; width: 100%; height: 100%; min-height: inherit; overflow: hidden; background: #f0fdfa; }
.pawlink-map-skeleton::before { content: ""; position: absolute; inset: 0; background-image: linear-gradient(90deg, rgba(15,118,110,.10) 1px, transparent 1px), linear-gradient(rgba(15,118,110,.10) 1px, transparent 1px); background-size: 72px 72px; }
.pawlink-map-skeleton::after { content: ""; position: absolute; inset: 0; transform: translateX(-100%); background: linear-gradient(90deg, transparent, rgba(255,255,255,.62), transparent); animation: pawlinkSkeleton 1.45s ease-in-out infinite; }
.pawlink-pet-photo { display: block; width: 100%; height: 100%; object-fit: cover; }
.pawlink-photo-frame { position: relative; overflow: hidden; background: linear-gradient(135deg, #f5f3ff, #fff, #f0fdfa); }
.pawlink-photo-frame::after { content: ""; position: absolute; inset: auto 0 0 0; height: 45%; background: linear-gradient(to top, rgba(15,23,42,.42), transparent); pointer-events: none; }
.pawlink-explorer-grid { display: grid; gap: 1.25rem; }
.pawlink-report-list-shell { max-height: 72vh; overflow: hidden; }
.pawlink-report-list { display: grid; max-height: min(620px, 58vh); gap: 1rem; overflow-y: auto; overflow-x: hidden; padding: .25rem .85rem 1rem .25rem; scrollbar-color: #7c7c7c #eef2f7; scrollbar-width: auto; }
.pawlink-report-list::-webkit-scrollbar { width: 16px; }
.pawlink-report-list::-webkit-scrollbar-track { border-radius: 999px; background: #eef2f7; }
.pawlink-report-list::-webkit-scrollbar-thumb { min-height: 96px; border: 4px solid #eef2f7; border-radius: 999px; background: #7c7c7c; }
.pawlink-report-list::-webkit-scrollbar-thumb:hover { background: #666; }
.pawlink-report-card-button { width: 100%; min-width: 0; text-align: left; }
.pawlink-report-card { display: grid; overflow: hidden; border: 1px solid rgba(226,232,240,.92); border-radius: 1.55rem; background: #fff; box-shadow: 0 8px 24px rgba(15,23,42,.06); transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease; }
.pawlink-report-card:hover { transform: translateY(-3px); box-shadow: 0 22px 56px rgba(15,23,42,.13); border-color: #ddd6fe; }
.pawlink-report-card[data-selected="true"] { border-color: #8b5cf6; box-shadow: 0 0 0 4px #ede9fe, 0 22px 56px rgba(15,23,42,.13); }
.pawlink-report-thumb { aspect-ratio: 16 / 11; border-radius: 1.25rem; margin: .65rem .65rem 0; box-shadow: inset 0 0 0 1px rgba(255,255,255,.36); }
.pawlink-report-overlay-top { position: absolute; z-index: 10; left: .75rem; top: .75rem; }
.pawlink-report-overlay-bottom { position: absolute; z-index: 10; left: .75rem; right: .75rem; bottom: .75rem; display: flex; justify-content: flex-end; pointer-events: none; }
.pawlink-report-overlay-bottom span { display: inline-flex; min-height: 1.9rem; align-items: center; border: 1px solid rgba(255,255,255,.72); border-radius: 999px; background: rgba(255,255,255,.94); padding: .35rem .72rem; color: #0f172a; font-size: 11px; font-weight: 950; box-shadow: 0 10px 24px rgba(15,23,42,.18); backdrop-filter: blur(12px); }
.pawlink-report-content { padding: 1rem 1.05rem 1.1rem; }
.pawlink-report-meta-row { display: flex; flex-wrap: wrap; gap: .4rem; margin-top: .65rem; }
.pawlink-report-chip { display: inline-flex; align-items: center; min-height: 1.7rem; max-width: 100%; border-radius: 999px; background: #f8fafc; padding: .28rem .65rem; color: #475569; font-size: 11px; font-weight: 850; }
.pawlink-report-date-chip { display: inline-flex; min-height: 1.7rem; flex-shrink: 0; align-items: center; border-radius: 999px; background: #f8fafc; padding: .25rem .6rem; color: #64748b; font-size: 11px; font-weight: 900; }
.pawlink-report-description { display: -webkit-box; margin-top: .75rem; overflow: hidden; color: #475569; font-size: .875rem; font-weight: 600; line-height: 1.35rem; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.pawlink-report-cta { margin-top: .95rem; display: inline-flex; height: 2.55rem; width: 100%; align-items: center; justify-content: center; border-radius: 1rem; border: 1px solid #ddd6fe; background: #f5f3ff; color: #6d28d9; font-size: 12px; font-weight: 950; transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease, transform 160ms ease; }
.pawlink-report-card:hover .pawlink-report-cta, .pawlink-report-card[data-selected="true"] .pawlink-report-cta { border-color: #7c3aed; background: #7c3aed; color: #fff; transform: translateY(-1px); }
.pawlink-selected-details { display: none; border-top: 1px solid #f1f5f9; margin-top: .85rem; padding-top: .85rem; }
.pawlink-report-card[data-selected="true"] .pawlink-selected-details { display: block; }
.pawlink-dialog-backdrop { position: fixed; inset: 0; z-index: 50; display: flex; align-items: flex-end; justify-content: center; background: rgba(2,6,23,.42); padding: 0; }
.pawlink-dialog-panel { width: 100%; max-height: calc(100vh - 5.5rem); overflow: hidden; border-radius: 1.5rem 1.5rem 0 0; background: #fff; box-shadow: 0 24px 70px rgba(15,23,42,.22); display: flex; flex-direction: column; }
.pawlink-dialog-body { flex: 1 1 auto; overflow-y: auto; }
.pawlink-alert-progress { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .5rem; }
.pawlink-alert-progress-step { border-radius: .9rem; border: 1px solid #e2e8f0; background: #fff; padding: .65rem; }
.pawlink-alert-progress-step[data-current="true"] { border-color: #c4b5fd; background: #f5f3ff; }
.pawlink-alert-progress-step[data-complete="true"] { border-color: #99f6e4; background: #f0fdfa; }
.pawlink-leaflet-marker { transition: transform 180ms ease, filter 180ms ease; }
.pawlink-leaflet-marker:hover, .pawlink-leaflet-marker:focus { filter: drop-shadow(0 14px 18px rgba(15,23,42,.28)); }
.pawlink-marker-wrap { position: relative; display: grid; place-items: center; }
.pawlink-marker-pin { position: relative; z-index: 2; }
.pawlink-marker-pulse { position: absolute; inset: -12px; z-index: 1; border-radius: 999px; background: rgba(124,58,237,.24); animation: pawlinkMarkerPulse 1.4s ease-out infinite; }
.pawlink-marker-selected { animation: pawlinkMarkerBounce 900ms ease both; }
.pawlink-marker-hover { animation: pawlinkMarkerHover 700ms ease both; }
.pawlink-cluster-marker { display: grid; place-items: center; border: 4px solid #fff; border-radius: 1.25rem; background: linear-gradient(135deg, #7c3aed, #0d9488); color: #fff; box-shadow: 0 18px 42px rgba(15,23,42,.28); font: 950 15px/1 Inter, ui-sans-serif, system-ui; animation: pawlinkMapFade 200ms ease both; }
.pawlink-cluster-marker span { display: grid; width: 70%; height: 70%; place-items: center; border-radius: 999px; background: rgba(255,255,255,.16); }
.pawlink-map-popup { display: grid; min-width: 230px; grid-template-columns: 64px minmax(0, 1fr); gap: .75rem; align-items: start; }
.pawlink-map-popup img { width: 64px; height: 64px; border-radius: .9rem; object-fit: cover; }
.pawlink-map-popup strong { display: block; max-width: 110px; overflow: hidden; color: #020617; font-size: .92rem; font-weight: 950; text-overflow: ellipsis; white-space: nowrap; }
.pawlink-map-popup p { margin: .28rem 0 0; color: #64748b; font-size: .72rem; font-weight: 750; line-height: 1rem; }
.pawlink-map-popup button { margin-top: .5rem; min-height: 2rem; border-radius: 999px; background: #7c3aed; padding: 0 .8rem; color: #fff; font-size: .72rem; font-weight: 950; }
.pawlink-map-cluster-popup { min-width: 170px; }
.pawlink-map-cluster-popup strong { color: #020617; font-size: .9rem; font-weight: 950; }
.pawlink-map-cluster-popup p { margin: .35rem 0 0; color: #64748b; font-size: .75rem; font-weight: 750; }
.pawlink-map-fade { animation: pawlinkMapFade 220ms ease both; }
.pawlink-discovery-toolbar { border: 1px solid #e2e8f0; border-radius: 1.5rem; background: rgba(255,255,255,.92); padding: 1rem; box-shadow: 0 1px 2px rgba(15,23,42,.05); backdrop-filter: blur(14px); }
.pawlink-search-shell { min-width: 0; }
.pawlink-search-field { position: relative; display: flex; align-items: center; height: 52px; border: 1px solid #e2e8f0; border-radius: 1rem; background: #fff; box-shadow: 0 1px 2px rgba(15,23,42,.05); transition: border-color 160ms ease, box-shadow 160ms ease; }
.pawlink-search-field:focus-within { border-color: #8b5cf6; box-shadow: 0 0 0 4px #ede9fe; }
.pawlink-search-icon { position: absolute; left: 1rem; color: #94a3b8; font-size: 1.25rem; font-weight: 900; pointer-events: none; }
.pawlink-search-input { width: 100%; height: 100%; border: 0; background: transparent; padding: 0 3rem 0 3rem; color: #020617; font-size: 1rem; font-weight: 650; outline: none; }
.pawlink-search-input::placeholder { color: #94a3b8; font-weight: 600; }
.pawlink-search-clear { position: absolute; right: .45rem; display: grid; width: 40px; height: 40px; place-items: center; border-radius: 999px; color: #64748b; font-weight: 900; transition: background-color 160ms ease, color 160ms ease; }
.pawlink-search-clear:hover, .pawlink-search-clear:focus { background: #f1f5f9; color: #334155; outline: none; }
.pawlink-toolbar-row { display: flex; flex-direction: column; gap: .85rem; margin-top: 1rem; }
.pawlink-filter-row { display: flex; gap: .55rem; margin: 0 -.25rem; overflow-x: auto; padding: .15rem .25rem .35rem; }
.pawlink-filter-chip { display: inline-flex; min-height: 42px; flex-shrink: 0; align-items: center; gap: .45rem; border: 1px solid #e2e8f0; border-radius: 999px; background: #fff; padding: .45rem .8rem; color: #475569; font-size: .875rem; font-weight: 800; box-shadow: 0 1px 2px rgba(15,23,42,.04); transition: transform 160ms ease, border-color 160ms ease, background-color 160ms ease, color 160ms ease, box-shadow 160ms ease; }
.pawlink-filter-chip:hover { transform: translateY(-1px); border-color: #ddd6fe; color: #6d28d9; box-shadow: 0 10px 24px rgba(15,23,42,.08); }
.pawlink-filter-chip:focus { outline: none; box-shadow: 0 0 0 4px #ede9fe; }
.pawlink-filter-chip-active { border-color: #c4b5fd; background: #f5f3ff; color: #6d28d9; }
.pawlink-toolbar-actions { display: flex; flex-wrap: wrap; align-items: center; gap: .6rem; }
.pawlink-sort-control { display: inline-flex; min-height: 44px; align-items: center; gap: .5rem; border: 1px solid #e2e8f0; border-radius: 14px; background: #fff; padding: 0 .85rem; color: #64748b; font-size: .75rem; font-weight: 900; box-shadow: 0 1px 2px rgba(15,23,42,.05); transition: border-color 160ms ease, box-shadow 160ms ease; }
.pawlink-sort-control:focus-within { border-color: #7c3aed; box-shadow: 0 0 0 4px #ede9fe; }
.pawlink-sort-control select { appearance: none; border: 0; background: transparent; color: #334155; font: inherit; outline: none; }
.pawlink-clear-filters { height: 42px; border: 1px solid #e2e8f0; border-radius: .9rem; background: #fff; padding: 0 .75rem; color: #475569; font-size: .8rem; font-weight: 900; transition: border-color 160ms ease, color 160ms ease, background-color 160ms ease; }
.pawlink-clear-filters:hover, .pawlink-clear-filters:focus { border-color: #fecdd3; background: #fff1f2; color: #be123c; outline: none; }
.pawlink-adoption-hero { border: 1px solid #e2e8f0; border-radius: 1.75rem; background: linear-gradient(135deg, rgba(255,255,255,.95), rgba(245,243,255,.72), rgba(240,253,250,.72)); padding: 1.25rem; box-shadow: 0 18px 54px rgba(15,23,42,.07); }
.pawlink-adoption-search-panel { border: 1px solid #e2e8f0; border-radius: 1.5rem; background: rgba(255,255,255,.94); box-shadow: 0 14px 42px rgba(15,23,42,.07); }
.pawlink-adoption-search { position: relative; display: flex; align-items: center; height: 60px; border: 1px solid #e2e8f0; border-radius: 1.15rem; background: #fff; box-shadow: 0 1px 2px rgba(15,23,42,.05); transition: border-color 160ms ease, box-shadow 160ms ease; }
.pawlink-adoption-search:focus-within { border-color: #8b5cf6; box-shadow: 0 0 0 4px #ede9fe, 0 14px 34px rgba(15,23,42,.08); }
.pawlink-adoption-search-icon { position: absolute; left: 1rem; color: #94a3b8; font-size: 1.35rem; font-weight: 900; pointer-events: none; }
.pawlink-adoption-search-input { width: 100%; height: 100%; border: 0; background: transparent; padding: 0 3.2rem 0 3.2rem; color: #020617; font-size: 1.05rem; font-weight: 700; outline: none; }
.pawlink-adoption-search-input::placeholder { color: #94a3b8; font-weight: 600; }
.pawlink-adoption-search-clear { position: absolute; right: .55rem; display: grid; width: 42px; height: 42px; place-items: center; border-radius: 999px; color: #64748b; font-weight: 900; transition: background-color 160ms ease, color 160ms ease; }
.pawlink-adoption-search-clear:hover, .pawlink-adoption-search-clear:focus { background: #f1f5f9; color: #334155; outline: none; }
.pawlink-adoption-filter-scroll { margin: 0 -.25rem; overflow-x: auto; padding: .15rem .25rem .35rem; }
.pawlink-adoption-filter-row { display: flex; min-width: max-content; gap: .65rem; }
.pawlink-adoption-chip { display: inline-flex; min-height: 42px; flex-shrink: 0; align-items: center; gap: .45rem; border: 1px solid #e2e8f0; border-radius: 999px; background: #fff; padding: .45rem .85rem; color: #475569; font-size: .875rem; font-weight: 850; box-shadow: 0 1px 2px rgba(15,23,42,.04); transition: transform 160ms ease, border-color 160ms ease, background-color 160ms ease, color 160ms ease, box-shadow 160ms ease; }
.pawlink-adoption-chip:hover { transform: translateY(-1px); border-color: #ddd6fe; color: #6d28d9; box-shadow: 0 10px 24px rgba(15,23,42,.08); }
.pawlink-adoption-chip:focus { outline: none; box-shadow: 0 0 0 4px #ede9fe; }
.pawlink-adoption-chip-active { border-color: #c4b5fd; background: #f5f3ff; color: #6d28d9; }
.pawlink-adoption-chip-clear { background: #f8fafc; }
.pawlink-match-profile-card { overflow: hidden; border-radius: 1.75rem; padding: 1.1rem; background: linear-gradient(135deg, rgba(255,255,255,.98), rgba(245,243,255,.86), rgba(240,253,250,.82)); box-shadow: 0 18px 54px rgba(15,23,42,.09); }
.pawlink-match-profile-hero { display: flex; align-items: flex-start; gap: 1rem; }
.pawlink-match-profile-orb { display: grid; width: 3.65rem; height: 3.65rem; flex-shrink: 0; place-items: center; border-radius: 1.35rem; background: linear-gradient(135deg, #7c3aed, #0d9488); color: #fff; font-size: .85rem; font-weight: 950; box-shadow: 0 18px 38px rgba(124,58,237,.22); animation: pawlinkMapFade 220ms ease both; }
.pawlink-match-progress-bar { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #7c3aed, #0d9488); box-shadow: 0 8px 18px rgba(124,58,237,.22); transition: width 260ms ease; }
.pawlink-match-summary-chip { display: inline-flex; min-height: 2.25rem; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,.75); border-radius: 999px; background: rgba(255,255,255,.72); padding: .45rem .75rem; color: #475569; font-size: .75rem; font-weight: 900; box-shadow: 0 8px 22px rgba(15,23,42,.06); }
.pawlink-match-onboarding { margin-top: 1.25rem; border-top: 1px solid rgba(226,232,240,.78); padding-top: 1.25rem; }
.pawlink-match-stepper { display: flex; gap: .55rem; overflow-x: auto; padding: .1rem .05rem .45rem; scrollbar-width: none; }
.pawlink-match-stepper::-webkit-scrollbar { display: none; }
.pawlink-match-stepper button { display: inline-flex; min-height: 2.45rem; flex-shrink: 0; align-items: center; gap: .45rem; border: 1px solid rgba(226,232,240,.92); border-radius: 999px; background: rgba(255,255,255,.78); padding: .35rem .72rem; color: #64748b; font-size: .75rem; font-weight: 900; box-shadow: 0 1px 2px rgba(15,23,42,.04); transition: transform 160ms ease, border-color 160ms ease, background-color 160ms ease, color 160ms ease, box-shadow 160ms ease; }
.pawlink-match-stepper button:hover { transform: translateY(-1px); border-color: #ddd6fe; color: #6d28d9; }
.pawlink-match-stepper button:focus { outline: none; box-shadow: 0 0 0 4px #ede9fe; }
.pawlink-match-stepper button[data-active="true"] { border-color: #7c3aed; background: #7c3aed; color: #fff; box-shadow: 0 12px 26px rgba(124,58,237,.20); }
.pawlink-match-stepper button[data-complete="true"] { border-color: #99f6e4; background: #f0fdfa; color: #0f766e; }
.pawlink-match-stepper span { display: grid; min-width: 1.35rem; height: 1.35rem; place-items: center; border-radius: 999px; background: rgba(255,255,255,.72); font-size: .62rem; }
.pawlink-match-question { margin-top: 1rem; animation: reportFlowEnter 220ms ease both; }
.pawlink-match-question-copy { margin-bottom: .9rem; }
.pawlink-match-question-copy p { margin: 0; color: #7c3aed; font-size: .75rem; font-weight: 950; }
.pawlink-match-question-copy h4 { margin: .2rem 0 0; color: #020617; font-size: 1.55rem; line-height: 1.9rem; font-weight: 950; }
.pawlink-match-question-copy span { display: block; margin-top: .35rem; color: #64748b; font-size: .9rem; font-weight: 650; line-height: 1.45rem; }
.pawlink-onboarding-options { display: grid; gap: .85rem; }
.pawlink-onboarding-card { display: grid; min-height: 6rem; grid-template-columns: auto minmax(0, 1fr); align-items: start; gap: .85rem; border: 1px solid rgba(226,232,240,.95); border-radius: 1.25rem; background: rgba(255,255,255,.88); padding: 1rem; text-align: left; box-shadow: 0 1px 2px rgba(15,23,42,.05); transition: transform 180ms ease, border-color 180ms ease, background-color 180ms ease, box-shadow 180ms ease; }
.pawlink-onboarding-card:hover { transform: translateY(-2px); border-color: #ddd6fe; box-shadow: 0 16px 38px rgba(15,23,42,.10); }
.pawlink-onboarding-card:focus { outline: none; box-shadow: 0 0 0 4px #ede9fe, 0 16px 38px rgba(15,23,42,.10); }
.pawlink-onboarding-card[data-selected="true"] { border-color: #8b5cf6; background: #fff; box-shadow: 0 0 0 1px #c4b5fd, 0 18px 42px rgba(124,58,237,.13); }
.pawlink-onboarding-icon { display: grid; width: 2.7rem; height: 2.7rem; place-items: center; border-radius: 1rem; background: #f5f3ff; color: #6d28d9; font-size: .7rem; font-weight: 950; transition: background-color 160ms ease, color 160ms ease, transform 160ms ease; }
.pawlink-onboarding-card[data-selected="true"] .pawlink-onboarding-icon { background: #7c3aed; color: #fff; transform: scale(1.04); }
.pawlink-onboarding-title { display: block; color: #020617; font-size: .98rem; font-weight: 950; line-height: 1.25rem; }
.pawlink-onboarding-description { display: block; margin-top: .3rem; color: #64748b; font-size: .8rem; font-weight: 650; line-height: 1.15rem; }
.pawlink-match-live-summary { margin-top: 1rem; border: 1px solid #ddd6fe; border-radius: 1.25rem; background: rgba(255,255,255,.78); padding: 1rem; box-shadow: 0 10px 28px rgba(124,58,237,.08); }
.pawlink-match-live-summary h4 { margin: .25rem 0 0; color: #0f172a; font-size: 1rem; font-weight: 950; line-height: 1.45rem; }
.pawlink-match-live-summary span { display: block; margin-top: .35rem; color: #64748b; font-size: .8rem; font-weight: 700; line-height: 1.2rem; }
.pawlink-match-actions { margin-top: 1rem; display: grid; grid-template-columns: minmax(0,.85fr) minmax(0,1.15fr); gap: .75rem; }
.pawlink-adoption-option { min-height: 48px; border: 1px solid #e2e8f0; border-radius: 1rem; background: #fff; padding: .7rem 1rem; color: #475569; font-size: .9rem; font-weight: 850; box-shadow: 0 1px 2px rgba(15,23,42,.04); transition: transform 160ms ease, border-color 160ms ease, background-color 160ms ease, color 160ms ease, box-shadow 160ms ease; }
.pawlink-adoption-option:hover { transform: translateY(-1px); border-color: #ddd6fe; color: #6d28d9; }
.pawlink-adoption-option:focus { outline: none; box-shadow: 0 0 0 4px #ede9fe; }
.pawlink-adoption-option-active { border-color: #8b5cf6; background: #f5f3ff; color: #6d28d9; box-shadow: 0 0 0 1px #c4b5fd; }
.pawlink-adoption-results-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 2.75rem; justify-content: stretch; margin-top: 2.25rem; }
.pawlink-adoption-card { display: grid; width: 100%; overflow: hidden; min-width: 0; align-self: start; border: 1px solid #e2e8f0; border-radius: 1.6rem; background: #fff; box-shadow: 0 1px 2px rgba(15,23,42,.05); transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease; }
.pawlink-adoption-card:hover { transform: translateY(-3px); border-color: #ddd6fe; box-shadow: 0 24px 64px rgba(15,23,42,.13); }
.pawlink-adoption-card:focus { outline: none; box-shadow: 0 0 0 4px #ede9fe, 0 24px 64px rgba(15,23,42,.13); }
.pawlink-adoption-card[data-selected="true"] { border-color: #8b5cf6; box-shadow: 0 0 0 4px #ede9fe, 0 24px 64px rgba(15,23,42,.13); }
.pawlink-adoption-card-image { position: relative; aspect-ratio: 16 / 11; overflow: hidden; margin: .8rem .8rem 0; border-radius: 1.35rem; background: linear-gradient(135deg, #f5f3ff, #fff, #f0fdfa); }
.pawlink-adoption-card-image::after { content: ""; position: absolute; inset: auto 0 0 0; height: 48%; background: linear-gradient(to top, rgba(15,23,42,.46), transparent); pointer-events: none; }
.pawlink-adoption-card-species { position: absolute; z-index: 10; left: .75rem; top: .75rem; border: 1px solid rgba(255,255,255,.78); border-radius: 999px; background: rgba(255,255,255,.92); padding: .32rem .7rem; color: #334155; font-size: 11px; font-weight: 900; text-transform: capitalize; box-shadow: 0 8px 20px rgba(15,23,42,.10); }
.pawlink-adoption-favorite { position: absolute; z-index: 10; right: .75rem; top: .75rem; display: grid; width: 44px; height: 44px; place-items: center; border: 1px solid rgba(255,255,255,.78); border-radius: 999px; background: rgba(255,255,255,.92); color: #6d28d9; font-size: 1rem; font-weight: 900; box-shadow: 0 8px 20px rgba(15,23,42,.10); transition: transform 160ms ease, background-color 160ms ease; }
.pawlink-adoption-favorite:hover, .pawlink-adoption-favorite:focus { transform: scale(1.04); background: #fff; outline: none; box-shadow: 0 0 0 4px #ede9fe; }
.pawlink-adoption-match-badge { position: absolute; z-index: 10; left: .75rem; bottom: .75rem; border-radius: 999px; background: #7c3aed; padding: .45rem .8rem; color: white; font-size: .8rem; font-weight: 950; box-shadow: 0 12px 28px rgba(124,58,237,.28); }
.pawlink-adoption-card-body { padding: 1rem 1.1rem 1.1rem; }
.pawlink-adoption-status { flex-shrink: 0; border-radius: 999px; background: #ecfdf5; padding: .32rem .65rem; color: #047857; font-size: 11px; font-weight: 900; }
.pawlink-adoption-trait { display: inline-flex; min-height: 1.7rem; align-items: center; border-radius: 999px; background: #f8fafc; padding: .25rem .65rem; color: #475569; font-size: 11px; font-weight: 850; }
.pawlink-selected-pet-panel { position: sticky; top: 1rem; max-height: calc(100vh - 2rem); overflow-y: auto; border-radius: 1.6rem; border-color: #ede9fe; padding: 1rem; box-shadow: 0 24px 64px rgba(15,23,42,.12); }
.pawlink-adoption-pagination { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: .75rem; margin-top: 2.25rem; border: 1px solid #e2e8f0; border-radius: 1.5rem; background: rgba(255,255,255,.92); padding: .8rem; box-shadow: 0 10px 30px rgba(15,23,42,.06); }
.pawlink-adoption-pagination button { min-height: 2.5rem; border: 1px solid #e2e8f0; border-radius: 999px; background: #fff; padding: 0 .9rem; color: #475569; font-size: .78rem; font-weight: 950; transition: transform 160ms ease, border-color 160ms ease, background-color 160ms ease, color 160ms ease, opacity 160ms ease; }
.pawlink-adoption-pagination button:hover:not(:disabled), .pawlink-adoption-pagination button:focus:not(:disabled) { transform: translateY(-1px); border-color: #c4b5fd; background: #f5f3ff; color: #6d28d9; outline: none; }
.pawlink-adoption-pagination button:disabled { opacity: .42; cursor: not-allowed; }
.pawlink-adoption-page-dots { display: flex; align-items: center; gap: .35rem; }
.pawlink-adoption-page-dots button { width: 2.5rem; padding: 0; }
.pawlink-adoption-page-dots button[data-active="true"] { border-color: #7c3aed; background: #7c3aed; color: #fff; }
.report-flow-overlay { position: fixed; inset: 0; z-index: 50; display: flex; align-items: flex-end; justify-content: center; background: rgba(15,23,42,.50); backdrop-filter: blur(14px); }
.report-flow-panel { display: flex; width: 100%; height: calc(100dvh - .75rem); max-height: calc(100dvh - .75rem); flex-direction: column; overflow: hidden; border: 1px solid rgba(255,255,255,.70); border-radius: 1.75rem 1.75rem 0 0; background: #fff; box-shadow: 0 -12px 50px rgba(15,23,42,.22); touch-action: pan-y; }
.report-flow-header { flex: 0 0 auto; border-bottom: 1px solid #e2e8f0; background: rgba(255,255,255,.96); padding: 1rem; backdrop-filter: blur(18px); }
.report-flow-grabber { margin: 0 auto .85rem; height: .32rem; width: 3rem; border-radius: 999px; background: #cbd5e1; }
.report-flow-title-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.report-flow-icon { display: grid; width: 3rem; height: 3rem; flex-shrink: 0; place-items: center; border-radius: 1rem; background: linear-gradient(135deg, #7c3aed, #0d9488); color: #fff; font-size: .85rem; font-weight: 950; box-shadow: 0 14px 30px rgba(124,58,237,.22); }
.report-flow-kicker { color: #7c3aed; font-size: .75rem; font-weight: 900; }
.report-flow-title { margin: .15rem 0 0; color: #020617; font-size: 1.65rem; line-height: 1.08; font-weight: 950; }
.report-flow-description { margin: .35rem 0 0; max-width: 38rem; color: #64748b; font-size: .9rem; line-height: 1.45rem; }
.report-flow-close { display: grid; width: 2.75rem; height: 2.75rem; flex-shrink: 0; place-items: center; border: 1px solid #e2e8f0; border-radius: 999px; background: #fff; color: #475569; font-size: .9rem; font-weight: 950; box-shadow: 0 1px 2px rgba(15,23,42,.05); transition: transform 160ms ease, border-color 160ms ease, color 160ms ease, box-shadow 160ms ease; }
.report-flow-close:hover { transform: translateY(-1px); border-color: #ddd6fe; color: #6d28d9; box-shadow: 0 8px 24px rgba(15,23,42,.08); }
.report-flow-close:focus { outline: none; box-shadow: 0 0 0 4px #ede9fe; }
.report-flow-progress-wrap { margin-top: 1rem; }
.report-flow-body { flex: 1 1 auto; min-height: 0; overflow-y: auto; background: linear-gradient(180deg, #fff, #f8fafc); padding: 1rem; }
.report-flow-content { margin: 0 auto; max-width: 760px; animation: reportFlowEnter 220ms ease both; }
.report-flow-footer { position: sticky; bottom: 0; z-index: 2; flex: 0 0 auto; border-top: 1px solid #e2e8f0; background: rgba(255,255,255,.96); padding: .85rem 1rem calc(.85rem + env(safe-area-inset-bottom)); box-shadow: 0 -18px 44px rgba(15,23,42,.08); backdrop-filter: blur(18px); }
.report-flow-footer-inner { display: grid; max-width: 760px; margin: 0 auto; grid-template-columns: minmax(0, .7fr) minmax(0, 1.3fr); gap: .75rem; }
.report-flow-stepper { overflow-x: auto; padding: .1rem .05rem .25rem; scrollbar-width: none; }
.report-flow-stepper::-webkit-scrollbar { display: none; }
.report-flow-stepper-track { display: flex; min-width: 720px; align-items: flex-start; }
.report-flow-step-item { display: flex; min-width: 0; flex: 1 1 0%; align-items: flex-start; }
.report-flow-step-button { display: grid; min-width: 0; flex: 1 1 0%; grid-template-columns: auto minmax(0, 1fr); gap: .65rem; border-radius: 1rem; padding: .35rem .45rem; text-align: left; transition: background-color 160ms ease, transform 160ms ease; }
.report-flow-step-button:hover { background: #f8fafc; }
.report-flow-step-button:focus { outline: none; box-shadow: 0 0 0 4px #ede9fe; }
.report-flow-step-node { display: grid; width: 2.25rem; height: 2.25rem; place-items: center; border: 1px solid #e2e8f0; border-radius: 999px; background: #fff; color: #94a3b8; box-shadow: 0 1px 2px rgba(15,23,42,.05); font-size: .72rem; font-weight: 950; transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease, transform 160ms ease; }
.report-flow-step-button[data-current="true"] .report-flow-step-node { border-color: #7c3aed; background: #7c3aed; color: #fff; transform: scale(1.04); }
.report-flow-step-button[data-complete="true"] .report-flow-step-node { border-color: #10b981; background: #ecfdf5; color: #047857; }
.report-flow-step-copy { min-width: 0; padding-top: .1rem; }
.report-flow-step-icon { display: block; color: #7c3aed; font-size: .68rem; font-weight: 950; line-height: 1; }
.report-flow-step-label { display: block; margin-top: .15rem; color: #334155; font-size: .78rem; font-weight: 950; line-height: 1.05rem; }
.report-flow-step-button[data-current="true"] .report-flow-step-label { color: #020617; }
.report-flow-step-description { display: block; margin-top: .12rem; overflow: hidden; color: #94a3b8; font-size: .68rem; font-weight: 700; line-height: .95rem; text-overflow: ellipsis; white-space: nowrap; }
.report-flow-step-line { margin: 1.12rem .25rem 0; height: 2px; width: 1.5rem; flex-shrink: 0; border-radius: 999px; background: #e2e8f0; }
.report-flow-step-line[data-complete="true"] { background: #99f6e4; }
.public-form-stack { display: grid; gap: 1.25rem; }
.public-field { position: relative; display: block; }
.public-field-label { position: absolute; z-index: 1; left: 1rem; top: .48rem; color: #64748b; font-size: .68rem; font-weight: 900; line-height: 1; pointer-events: none; transition: color 160ms ease, transform 160ms ease; }
.public-field:focus-within .public-field-label { color: #7c3aed; }
.public-input { margin-top: 0; width: 100%; min-height: 52px; border: 1px solid #e2e8f0; border-radius: 14px; background: #fff; padding: 1.28rem 1rem .42rem; color: #020617; font-size: 15px; font-weight: 700; line-height: 1.25rem; box-shadow: 0 1px 2px rgba(15,23,42,.05); outline: none; transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease, background-color 160ms ease; }
.public-input::placeholder { color: #cbd5e1; font-weight: 600; }
.public-input:hover { border-color: #cbd5e1; }
.public-input:focus { border-color: #7c3aed; box-shadow: 0 0 0 4px #ede9fe, 0 10px 24px rgba(15,23,42,.06); }
.public-input:disabled { background: #f8fafc; color: #94a3b8; }
.public-textarea { min-height: 7.5rem; resize: vertical; padding-top: 1.55rem; }
.public-helper { margin-top: .42rem; color: #94a3b8; font-size: .75rem; font-weight: 650; line-height: 1.1rem; }
.public-error { margin-top: .42rem; display: block; color: #e11d48; font-size: .75rem; font-weight: 850; line-height: 1.1rem; }
.public-choice-group { display: grid; gap: .65rem; }
.public-choice-label { display: block; color: #0f172a; font-size: .9rem; font-weight: 950; }
.public-choice-grid { margin-top: .65rem; display: grid; gap: .75rem; }
.public-radio-card { display: grid; min-height: 5.15rem; grid-template-columns: auto minmax(0, 1fr); align-items: start; gap: .8rem; border: 1px solid #e2e8f0; border-radius: 18px; background: #fff; padding: .9rem; color: #475569; text-align: left; box-shadow: 0 1px 2px rgba(15,23,42,.05); transition: transform 160ms ease, border-color 160ms ease, background-color 160ms ease, box-shadow 160ms ease; }
.public-radio-card:hover { transform: translateY(-1px); border-color: #ddd6fe; box-shadow: 0 12px 28px rgba(15,23,42,.08); }
.public-radio-card:focus { outline: none; box-shadow: 0 0 0 4px #ede9fe, 0 12px 28px rgba(15,23,42,.08); }
.public-radio-card[data-selected="true"] { border-color: #8b5cf6; background: #f5f3ff; box-shadow: 0 0 0 1px #c4b5fd, 0 12px 28px rgba(124,58,237,.10); }
.public-radio-icon { display: grid; width: 2.35rem; height: 2.35rem; place-items: center; border-radius: 14px; background: #f8fafc; color: #7c3aed; font-size: .7rem; font-weight: 950; transition: background-color 160ms ease, color 160ms ease; }
.public-radio-card[data-selected="true"] .public-radio-icon { background: #7c3aed; color: #fff; }
.public-radio-title { display: block; color: #0f172a; font-size: .92rem; font-weight: 950; line-height: 1.1rem; }
.public-radio-description { display: block; margin-top: .25rem; color: #64748b; font-size: .75rem; font-weight: 650; line-height: 1.05rem; }
.public-checkbox-card { display: flex; min-height: 3.75rem; align-items: flex-start; gap: .85rem; border: 1px solid #e2e8f0; border-radius: 18px; background: #fff; padding: .95rem; color: #334155; font-size: .9rem; font-weight: 700; line-height: 1.45rem; box-shadow: 0 1px 2px rgba(15,23,42,.05); transition: border-color 160ms ease, box-shadow 160ms ease, background-color 160ms ease; }
.public-checkbox-card:hover { border-color: #ddd6fe; box-shadow: 0 12px 28px rgba(15,23,42,.07); }
.public-checkbox-input { position: absolute; opacity: 0; pointer-events: none; }
.public-checkbox-switch { position: relative; margin-top: .1rem; width: 2.65rem; height: 1.5rem; flex-shrink: 0; border-radius: 999px; background: #e2e8f0; box-shadow: inset 0 0 0 1px rgba(15,23,42,.04); transition: background-color 160ms ease, box-shadow 160ms ease; }
.public-checkbox-switch::after { content: ""; position: absolute; top: .2rem; left: .2rem; width: 1.1rem; height: 1.1rem; border-radius: 999px; background: #fff; box-shadow: 0 2px 8px rgba(15,23,42,.18); transition: transform 160ms ease; }
.public-checkbox-input:checked + .public-checkbox-switch { background: #7c3aed; box-shadow: inset 0 0 0 1px rgba(124,58,237,.18); }
.public-checkbox-input:checked + .public-checkbox-switch::after { transform: translateX(1.15rem); }
.public-checkbox-input:focus + .public-checkbox-switch { box-shadow: 0 0 0 4px #ede9fe; }
.public-select { min-height: 44px; appearance: none; border: 1px solid #e2e8f0; border-radius: 14px; background: #fff; padding: 0 2.25rem 0 .85rem; color: #334155; font-size: .875rem; font-weight: 850; box-shadow: 0 1px 2px rgba(15,23,42,.05); outline: none; transition: border-color 160ms ease, box-shadow 160ms ease; }
.public-select:focus { border-color: #7c3aed; box-shadow: 0 0 0 4px #ede9fe; }
@keyframes pawlinkMarkerBounce {
  0% { transform: translateY(0) scale(.92); }
  45% { transform: translateY(-9px) scale(1.04); }
  100% { transform: translateY(0) scale(1); }
}
@keyframes pawlinkMarkerPulse {
  0% { transform: scale(.55); opacity: .55; }
  70% { transform: scale(1.25); opacity: .08; }
  100% { transform: scale(1.45); opacity: 0; }
}
@keyframes pawlinkMarkerHover {
  0% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
  100% { transform: translateY(0); }
}
@keyframes pawlinkMapFade {
  from { opacity: .55; }
  to { opacity: 1; }
}
@keyframes pawlinkSkeleton {
  to { transform: translateX(100%); }
}
@keyframes dsPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .45; }
}
@keyframes reportFlowEnter {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@media (min-width: 768px) {
  .pawlink-report-map { height: 520px; min-height: 520px; }
  .pawlink-picker-map { height: 440px; min-height: 440px; }
  .pawlink-dialog-backdrop { align-items: center; padding: 1.5rem; }
  .pawlink-dialog-panel { max-width: 640px; max-height: 85vh; border-radius: 1.75rem; border: 1px solid rgba(255,255,255,.7); }
  .report-flow-overlay { align-items: center; padding: 1.5rem; }
  .report-flow-panel { width: min(900px, 100%); height: auto; max-height: 90vh; border-radius: 1.75rem; box-shadow: 0 30px 90px rgba(15,23,42,.28); }
  .report-flow-header { padding: 1.25rem 1.5rem 1rem; }
  .report-flow-grabber { display: none; }
  .report-flow-body { padding: 1.25rem 1.5rem; }
  .report-flow-footer { padding: 1rem 1.5rem; }
  .report-flow-stepper-track { min-width: 0; }
  .report-flow-step-line { width: 2.25rem; }
  .pawlink-adoption-results-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 3.5rem; row-gap: 3.25rem; }
}
@media (min-width: 1024px) {
  .pawlink-report-map { height: 640px; min-height: 640px; }
  .pawlink-picker-map { height: 480px; min-height: 480px; }
  .pawlink-explorer-grid { grid-template-columns: minmax(0, 1.55fr) minmax(360px, .95fr); align-items: stretch; }
  .pawlink-report-list-shell { height: 640px; max-height: 640px; overflow: hidden; }
  .pawlink-report-list { display: grid; grid-template-columns: 1fr; overflow-x: hidden; overflow-y: auto; padding: .25rem .25rem 1rem; scroll-snap-type: none; }
  .pawlink-report-card-button { min-width: 0; width: 100%; }
  .pawlink-report-card { grid-template-columns: 148px minmax(0, 1fr); }
  .pawlink-report-thumb { aspect-ratio: auto; height: calc(100% - 1.3rem); min-height: 150px; margin: .65rem 0 .65rem .65rem; }
  .pawlink-report-content { padding: 1rem 1.05rem; }
  .pawlink-discovery-toolbar { padding: 1.1rem; }
  .pawlink-toolbar-row { flex-direction: row; align-items: center; justify-content: space-between; }
  .pawlink-filter-row { flex-wrap: wrap; overflow-x: visible; margin: 0; padding: 0; }
  .pawlink-search-shell { max-width: 720px; }
  .pawlink-adoption-hero { padding: 1.75rem; }
  .pawlink-adoption-search-panel { padding: 1.25rem; }
  .pawlink-adoption-filter-row { min-width: 0; flex-wrap: wrap; }
  .pawlink-match-profile-card { padding: 1.5rem; }
  [class~="lg:grid-cols-[minmax(0,1fr)_380px]"] { grid-template-columns: minmax(0, 1fr) 380px; }
}
@media (min-width: 1280px) {
  [class~="xl:grid-cols-[minmax(0,1fr)_420px]"] { grid-template-columns: minmax(0, 1fr) 420px; }
  [class~="xl:grid-cols-[minmax(0,1fr)_390px]"] { grid-template-columns: minmax(0, 1fr) 390px; }
  .xl\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .xl\:gap-9 { gap: 2.25rem; }
}
`

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: appStyles }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
