import type { ReactNode } from 'react'

export const metadata = {
  title: 'Pawlink',
  description: 'Mobile-first shelter and public pet care app.',
}

const appStyles = String.raw`
* { box-sizing: border-box; }
html { background: #f8fafc; -webkit-text-size-adjust: 100%; }
body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #020617; background: #f8fafc; }
a { color: inherit; text-decoration: none; }
button, input, select, textarea { font: inherit; }
button { border: 0; cursor: pointer; }
button:disabled { cursor: not-allowed; opacity: .65; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
.min-h-screen { min-height: 100vh; }
.mx-auto { margin-left: auto; margin-right: auto; }
.mt-0\.5 { margin-top: .125rem; } .mt-1 { margin-top: .25rem; } .mt-2 { margin-top: .5rem; } .mt-3 { margin-top: .75rem; } .mt-4 { margin-top: 1rem; } .mt-5 { margin-top: 1.25rem; } .mt-6 { margin-top: 1.5rem; } .mt-8 { margin-top: 2rem; } .mt-10 { margin-top: 2.5rem; }
.mb-1 { margin-bottom: .25rem; } .mb-3 { margin-bottom: .75rem; } .ml-auto { margin-left: auto; }
.p-2 { padding: .5rem; } .p-3 { padding: .75rem; } .p-4 { padding: 1rem; } .p-5 { padding: 1.25rem; } .p-6 { padding: 1.5rem; } .p-8 { padding: 2rem; }
.px-2 { padding-left: .5rem; padding-right: .5rem; } .px-3 { padding-left: .75rem; padding-right: .75rem; } .px-4 { padding-left: 1rem; padding-right: 1rem; } .px-5 { padding-left: 1.25rem; padding-right: 1.25rem; } .px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
.py-0\.5 { padding-top: .125rem; padding-bottom: .125rem; } .py-1 { padding-top: .25rem; padding-bottom: .25rem; } .py-1\.5 { padding-top: .375rem; padding-bottom: .375rem; } .py-2 { padding-top: .5rem; padding-bottom: .5rem; } .py-3 { padding-top: .75rem; padding-bottom: .75rem; } .py-4 { padding-top: 1rem; padding-bottom: 1rem; } .py-5 { padding-top: 1.25rem; padding-bottom: 1.25rem; }
.pb-0 { padding-bottom: 0; } .pb-2 { padding-bottom: .5rem; } .pb-3 { padding-bottom: .75rem; } .pb-20 { padding-bottom: 5rem; } .pt-2 { padding-top: .5rem; } .pt-4 { padding-top: 1rem; }
.grid { display: grid; } .flex { display: flex; } .inline-flex { display: inline-flex; } .block { display: block; } .hidden { display: none; }
.items-center { align-items: center; } .items-start { align-items: flex-start; } .justify-center { justify-content: center; } .justify-between { justify-content: space-between; } .place-items-center { place-items: center; } .self-start { align-self: flex-start; }
.shrink-0 { flex-shrink: 0; } .flex-1 { flex: 1 1 0%; } .flex-col { flex-direction: column; } .flex-wrap { flex-wrap: wrap; }
.gap-1 { gap: .25rem; } .gap-2 { gap: .5rem; } .gap-3 { gap: .75rem; } .gap-4 { gap: 1rem; } .gap-5 { gap: 1.25rem; } .gap-6 { gap: 1.5rem; }
.space-y-2 > :not([hidden]) ~ :not([hidden]) { margin-top: .5rem; } .space-y-3 > :not([hidden]) ~ :not([hidden]) { margin-top: .75rem; } .space-y-5 > :not([hidden]) ~ :not([hidden]) { margin-top: 1.25rem; }
.max-w-3xl { max-width: 48rem; } .max-w-5xl { max-width: 64rem; } .max-w-6xl { max-width: 72rem; } .max-w-7xl { max-width: 80rem; } .max-w-\[520px\] { max-width: 520px; } .max-w-\[82\%\] { max-width: 82%; }
.min-w-0 { min-width: 0; } .w-px { width: 1px; } .w-5 { width: 1.25rem; } .w-8 { width: 2rem; } .w-10 { width: 2.5rem; } .w-11 { width: 2.75rem; } .w-12 { width: 3rem; } .w-14 { width: 3.5rem; } .w-20 { width: 5rem; } .w-36 { width: 9rem; } .w-40 { width: 10rem; } .w-full { width: 100%; }
.h-1\.5 { height: .375rem; } .h-2 { height: .5rem; } .h-5 { height: 1.25rem; } .h-8 { height: 2rem; } .h-10 { height: 2.5rem; } .h-11 { height: 2.75rem; } .h-12 { height: 3rem; } .h-14 { height: 3.5rem; } .h-20 { height: 5rem; } .h-24 { height: 6rem; } .h-36 { height: 9rem; } .h-40 { height: 10rem; } .h-full { height: 100%; }
.min-h-\[255px\] { min-height: 255px; } .min-h-\[320px\] { min-height: 320px; } .max-h-\[82vh\] { max-height: 82vh; }
.relative { position: relative; } .absolute { position: absolute; } .fixed { position: fixed; } .sticky { position: sticky; }
.inset-0 { inset: 0; } .left-\[18\%\] { left: 18%; } .left-\[22\%\] { left: 22%; } .top-\[22\%\] { top: 22%; } .top-\[28\%\] { top: 28%; } .top-0 { top: 0; } .top-3 { top: .75rem; } .top-4 { top: 1rem; } .bottom-0 { bottom: 0; } .bottom-3 { bottom: .75rem; } .left-0 { left: 0; } .left-3 { left: .75rem; } .right-0 { right: 0; } .right-3 { right: .75rem; } .z-30 { z-index: 30; } .z-40 { z-index: 40; }
.overflow-hidden { overflow: hidden; } .overflow-x-auto { overflow-x: auto; } .overflow-y-auto { overflow-y: auto; }
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.rounded { border-radius: .25rem; } .rounded-md { border-radius: .375rem; } .rounded-lg { border-radius: .5rem; } .rounded-xl { border-radius: .75rem; } .rounded-2xl { border-radius: 1rem; } .rounded-3xl { border-radius: 1.5rem; } .rounded-t-3xl { border-top-left-radius: 1.5rem; border-top-right-radius: 1.5rem; } .rounded-full { border-radius: 9999px; }
.border { border-width: 1px; border-style: solid; } .border-0 { border-width: 0; } .border-b { border-bottom-width: 1px; border-bottom-style: solid; } .border-t { border-top-width: 1px; border-top-style: solid; } .border-dashed { border-style: dashed; }
.border-transparent { border-color: transparent; } .border-white\/60 { border-color: rgba(255,255,255,.6); } .border-slate-100 { border-color: #f1f5f9; } .border-slate-200 { border-color: #e2e8f0; } .border-slate-300 { border-color: #cbd5e1; } .border-violet-200 { border-color: #ddd6fe; } .border-violet-300 { border-color: #c4b5fd; } .border-violet-600 { border-color: #7c3aed; } .border-teal-100 { border-color: #ccfbf1; } .border-teal-200 { border-color: #99f6e4; } .border-rose-200 { border-color: #fecdd3; } .border-rose-500 { border-color: #f43f5e; } .border-rose-600 { border-color: #e11d48; } .border-amber-200 { border-color: #fde68a; } .border-emerald-200 { border-color: #a7f3d0; }
.bg-transparent { background-color: transparent; } .bg-white { background-color: #fff; } .bg-white\/80 { background-color: rgba(255,255,255,.8); } .bg-white\/90 { background-color: rgba(255,255,255,.9); }
.bg-slate-50 { background-color: #f8fafc; } .bg-slate-100 { background-color: #f1f5f9; } .bg-slate-200 { background-color: #e2e8f0; } .bg-slate-800 { background-color: #1e293b; } .bg-slate-950 { background-color: #020617; } .bg-slate-950\/40 { background-color: rgba(2,6,23,.4); }
.bg-violet-50 { background-color: #f5f3ff; } .bg-violet-100 { background-color: #ede9fe; } .bg-violet-600 { background-color: #7c3aed; } .bg-teal-50 { background-color: #f0fdfa; } .bg-teal-100\/60 { background-color: rgba(204,251,241,.6); } .bg-teal-600 { background-color: #0d9488; } .bg-rose-50 { background-color: #fff1f2; } .bg-rose-600 { background-color: #e11d48; } .bg-amber-50 { background-color: #fffbeb; } .bg-emerald-50 { background-color: #ecfdf5; }
.bg-gradient-to-br { background-image: linear-gradient(to bottom right, var(--tw-gradient-from, #f5f3ff), var(--tw-gradient-to, #f0fdfa)); } .from-white { --tw-gradient-from: #fff; } .from-violet-50 { --tw-gradient-from: #f5f3ff; } .from-teal-50 { --tw-gradient-from: #f0fdfa; } .from-rose-50 { --tw-gradient-from: #fff1f2; } .from-slate-50 { --tw-gradient-from: #f8fafc; } .to-white { --tw-gradient-to: #fff; } .to-teal-50 { --tw-gradient-to: #f0fdfa; } .to-slate-50 { --tw-gradient-to: #f8fafc; }
[class*="linear-gradient"] { background-image: linear-gradient(90deg, rgba(15,118,110,.12) 1px, transparent 1px), linear-gradient(rgba(15,118,110,.12) 1px, transparent 1px); } [class~="bg-[size:86px_86px]"] { background-size: 86px 86px; }
.text-white { color: #fff; } .text-slate-400 { color: #94a3b8; } .text-slate-500 { color: #64748b; } .text-slate-600 { color: #475569; } .text-slate-700 { color: #334155; } .text-slate-800 { color: #1e293b; } .text-slate-950 { color: #020617; } .text-violet-600 { color: #7c3aed; } .text-violet-700 { color: #6d28d9; } .text-violet-900 { color: #4c1d95; } .text-teal-600 { color: #0d9488; } .text-teal-700 { color: #0f766e; } .text-rose-600 { color: #e11d48; } .text-rose-700 { color: #be123c; } .text-amber-700 { color: #b45309; } .text-emerald-700 { color: #047857; }
.text-\[10px\] { font-size: 10px; } .text-\[11px\] { font-size: 11px; } .text-xs { font-size: .75rem; line-height: 1rem; } .text-sm { font-size: .875rem; line-height: 1.25rem; } .text-base { font-size: 1rem; line-height: 1.5rem; } .text-lg { font-size: 1.125rem; line-height: 1.75rem; } .text-xl { font-size: 1.25rem; line-height: 1.75rem; } .text-2xl { font-size: 1.5rem; line-height: 2rem; } .text-3xl { font-size: 1.875rem; line-height: 2.25rem; } .text-4xl { font-size: 2.25rem; line-height: 2.5rem; } .text-5xl { font-size: 3rem; line-height: 1; }
.font-medium { font-weight: 500; } .font-semibold { font-weight: 600; } .font-bold { font-weight: 700; } .font-black { font-weight: 900; }
.uppercase { text-transform: uppercase; } .tracking-tight { letter-spacing: -0.025em; } .tracking-wide { letter-spacing: .025em; } .leading-none { line-height: 1; } .leading-4 { line-height: 1rem; } .leading-5 { line-height: 1.25rem; } .leading-6 { line-height: 1.5rem; } .leading-7 { line-height: 1.75rem; }
.text-center { text-align: center; } .text-left { text-align: left; } .text-right { text-align: right; }
.shadow-sm { box-shadow: 0 1px 2px rgba(15,23,42,.06); } .shadow-lg { box-shadow: 0 18px 50px rgba(15,23,42,.12); } .shadow-xl { box-shadow: 0 24px 70px rgba(15,23,42,.18); }
.backdrop-blur { backdrop-filter: blur(14px); }
.outline-none { outline: 2px solid transparent; outline-offset: 2px; }
.transition { transition-property: color, background-color, border-color, transform, box-shadow, opacity; transition-duration: 180ms; transition-timing-function: ease; }
.hover\:-translate-y-0\.5:hover { transform: translateY(-.125rem); }
.hover\:shadow-lg:hover { box-shadow: 0 18px 50px rgba(15,23,42,.12); }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); } .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.last\:border-0:last-child { border-width: 0; } .last\:pb-0:last-child { padding-bottom: 0; }
@media (min-width: 640px) { .sm\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); } .sm\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); } .sm\:flex-row { flex-direction: row; } .sm\:items-center { align-items: center; } .sm\:justify-between { justify-content: space-between; } .sm\:text-4xl { font-size: 2.25rem; line-height: 2.5rem; } }
@media (min-width: 768px) { .md\:static { position: static; } .md\:sticky { position: sticky; } .md\:block { display: block; } .md\:flex { display: flex; } .md\:hidden { display: none; } .md\:max-h-none { max-height: none; } .md\:self-start { align-self: flex-start; } .md\:rounded-2xl { border-radius: 1rem; } .md\:shadow-sm { box-shadow: 0 1px 2px rgba(15,23,42,.06); } .md\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); } .md\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); } [class~="md:grid-cols-[150px_1fr]"] { grid-template-columns: 150px 1fr; } [class~="md:grid-cols-[220px_1fr]"] { grid-template-columns: 220px 1fr; } [class~="md:grid-cols-[1fr_170px]"] { grid-template-columns: 1fr 170px; } [class~="md:grid-cols-[180px_1fr]"] { grid-template-columns: 180px 1fr; } .md\:top-4 { top: 1rem; } .md\:p-6 { padding: 1.5rem; } .md\:p-8 { padding: 2rem; } .md\:pb-6 { padding-bottom: 1.5rem; } .md\:text-5xl { font-size: 3rem; line-height: 1; } }
@media (min-width: 1024px) { .lg\:sticky { position: sticky; } .lg\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); } .lg\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); } .lg\:self-start { align-self: flex-start; } .lg\:top-4 { top: 1rem; } .lg\:grid-cols-\[1\.1fr_0\.9fr\] { grid-template-columns: 1.1fr .9fr; } [class~="lg:grid-cols-[1fr_340px]"] { grid-template-columns: 1fr 340px; } [class~="lg:grid-cols-[1fr_360px]"] { grid-template-columns: 1fr 360px; } }
@media (min-width: 1280px) { .xl\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
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
