import type { ReactNode } from 'react'

export const metadata = {
  title: 'Pawlink',
  description: 'Frontend foundation for Pawlink shelter and public app screens.',
}

const appStyles = String.raw`
* { box-sizing: border-box; }
html { background: #f1f5f9; }
body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #020617; }
a { color: inherit; text-decoration: none; }
button { border: 0; cursor: default; font: inherit; }
.min-h-screen { min-height: 100vh; }
.mx-auto { margin-left: auto; margin-right: auto; }
.mt-0\.5 { margin-top: 0.125rem; }
.mt-1 { margin-top: 0.25rem; }
.mt-2 { margin-top: 0.5rem; }
.mt-3 { margin-top: 0.75rem; }
.mt-4 { margin-top: 1rem; }
.mt-6 { margin-top: 1.5rem; }
.ml-auto { margin-left: auto; }
.p-2 { padding: 0.5rem; }
.p-3 { padding: 0.75rem; }
.p-4 { padding: 1rem; }
.p-6 { padding: 1.5rem; }
.p-8 { padding: 2rem; }
.px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
.px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.py-0\.5 { padding-top: 0.125rem; padding-bottom: 0.125rem; }
.py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
.py-1\.5 { padding-top: 0.375rem; padding-bottom: 0.375rem; }
.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
.py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
.pb-0 { padding-bottom: 0; }
.pb-2 { padding-bottom: 0.5rem; }
.pt-2 { padding-top: 0.5rem; }
.grid { display: grid; }
.flex { display: flex; }
.inline-flex { display: inline-flex; }
.block { display: block; }
.items-center { align-items: center; }
.items-start { align-items: flex-start; }
.justify-between { justify-content: space-between; }
.place-items-center { place-items: center; }
.shrink-0 { flex-shrink: 0; }
.flex-1 { flex: 1 1 0%; }
.flex-wrap { flex-wrap: wrap; }
.gap-1 { gap: 0.25rem; }
.gap-2 { gap: 0.5rem; }
.gap-3 { gap: 0.75rem; }
.gap-4 { gap: 1rem; }
.space-y-2 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.5rem; }
.space-y-3 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.75rem; }
.max-w-7xl { max-width: 80rem; }
.max-w-\[520px\] { max-width: 520px; }
.max-w-\[82\%\] { max-width: 82%; }
.min-w-0 { min-width: 0; }
.w-5 { width: 1.25rem; }
.w-10 { width: 2.5rem; }
.w-20 { width: 5rem; }
.w-36 { width: 9rem; }
.w-40 { width: 10rem; }
.w-full { width: 100%; }
.h-1\.5 { height: 0.375rem; }
.h-5 { height: 1.25rem; }
.h-10 { height: 2.5rem; }
.h-12 { height: 3rem; }
.h-20 { height: 5rem; }
.h-24 { height: 6rem; }
.h-36 { height: 9rem; }
.h-full { height: 100%; }
.min-h-\[255px\] { min-height: 255px; }
.relative { position: relative; }
.absolute { position: absolute; }
.fixed { position: fixed; }
.inset-0 { inset: 0; }
.left-\[18\%\] { left: 18%; }
.left-\[22\%\] { left: 22%; }
.top-\[22\%\] { top: 22%; }
.top-\[28\%\] { top: 28%; }
.bottom-3 { bottom: 0.75rem; }
.left-3 { left: 0.75rem; }
.right-3 { right: 0.75rem; }
.overflow-hidden { overflow: hidden; }
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.rounded { border-radius: 0.25rem; }
.rounded-md { border-radius: 0.375rem; }
.rounded-lg { border-radius: 0.5rem; }
.rounded-full { border-radius: 9999px; }
.border { border-width: 1px; border-style: solid; }
.border-0 { border-width: 0; }
.border-b { border-bottom-width: 1px; border-bottom-style: solid; }
.border-dashed { border-style: dashed; }
.border-slate-100 { border-color: #f1f5f9; }
.border-slate-200 { border-color: #e2e8f0; }
.border-violet-200 { border-color: #ddd6fe; }
.border-violet-300 { border-color: #c4b5fd; }
.border-teal-100 { border-color: #ccfbf1; }
.border-teal-200 { border-color: #99f6e4; }
.border-rose-200 { border-color: #fecdd3; }
.border-rose-500 { border-color: #f43f5e; }
.border-amber-200 { border-color: #fde68a; }
.border-emerald-200 { border-color: #a7f3d0; }
.bg-white { background-color: #fff; }
.bg-slate-50 { background-color: #f8fafc; }
.bg-slate-100 { background-color: #f1f5f9; }
.bg-violet-50 { background-color: #f5f3ff; }
.bg-violet-100 { background-color: #ede9fe; }
.bg-violet-600 { background-color: #7c3aed; }
.bg-teal-50 { background-color: #f0fdfa; }
.bg-teal-100\/60 { background-color: rgba(204, 251, 241, 0.6); }
.bg-teal-600 { background-color: #0d9488; }
.bg-rose-50 { background-color: #fff1f2; }
.bg-rose-600 { background-color: #e11d48; }
.bg-amber-50 { background-color: #fffbeb; }
.bg-emerald-50 { background-color: #ecfdf5; }
.bg-slate-800 { background-color: #1e293b; }
.bg-slate-950\/40 { background-color: rgba(2, 6, 23, 0.4); }
.bg-gradient-to-br { background-image: linear-gradient(to bottom right, var(--tw-gradient-from, #f5f3ff), var(--tw-gradient-to, #f0fdfa)); }
.from-violet-50 { --tw-gradient-from: #f5f3ff; }
.to-teal-50 { --tw-gradient-to: #f0fdfa; }
[class*="linear-gradient"] { background-image: linear-gradient(90deg, rgba(15, 118, 110, 0.12) 1px, transparent 1px), linear-gradient(rgba(15, 118, 110, 0.12) 1px, transparent 1px); }
[class~="bg-[size:86px_86px]"] { background-size: 86px 86px; }
.text-white { color: #fff; }
.text-slate-400 { color: #94a3b8; }
.text-slate-500 { color: #64748b; }
.text-slate-600 { color: #475569; }
.text-slate-700 { color: #334155; }
.text-slate-800 { color: #1e293b; }
.text-slate-950 { color: #020617; }
.text-violet-600 { color: #7c3aed; }
.text-violet-700 { color: #6d28d9; }
.text-violet-900 { color: #4c1d95; }
.text-teal-600 { color: #0d9488; }
.text-teal-700 { color: #0f766e; }
.text-rose-600 { color: #e11d48; }
.text-amber-700 { color: #b45309; }
.text-emerald-700 { color: #047857; }
.text-\[10px\] { font-size: 10px; }
.text-\[11px\] { font-size: 11px; }
.text-xs { font-size: 0.75rem; line-height: 1rem; }
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
.text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }
.font-black { font-weight: 900; }
.uppercase { text-transform: uppercase; }
.tracking-tight { letter-spacing: -0.025em; }
.tracking-wide { letter-spacing: 0.025em; }
.leading-none { line-height: 1; }
.leading-4 { line-height: 1rem; }
.leading-5 { line-height: 1.25rem; }
.text-center { text-align: center; }
.text-left { text-align: left; }
.text-right { text-align: right; }
.shadow-sm { box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06); }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.last\:border-0:last-child { border-width: 0; }
.last\:pb-0:last-child { padding-bottom: 0; }
@media (min-width: 640px) {
  .sm\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .sm\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (min-width: 768px) {
  [class~="md:grid-cols-[150px_1fr]"] { grid-template-columns: 150px 1fr; }
  [class~="md:grid-cols-[1fr_170px]"] { grid-template-columns: 1fr 170px; }
  [class~="md:grid-cols-[180px_1fr]"] { grid-template-columns: 180px 1fr; }
}
@media (min-width: 1280px) {
  .xl\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
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
