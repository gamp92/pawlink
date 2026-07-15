import L from 'leaflet'
import type { ReportType } from '@/lib/mock-data'

const transparentIcon =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1" viewBox="0 0 1 1"></svg>'

let defaultIconsConfigured = false

export function configureLeafletDefaultIcons() {
  if (defaultIconsConfigured) return

  L.Icon.Default.mergeOptions({
    iconUrl: transparentIcon,
    iconRetinaUrl: transparentIcon,
    shadowUrl: transparentIcon,
  })

  defaultIconsConfigured = true
}

function markerHtml({
  label,
  color,
  background,
  selected = false,
  hovered = false,
  pulse = false,
}: {
  label: string
  color: string
  background: string
  selected?: boolean
  hovered?: boolean
  pulse?: boolean
}) {
  const size = selected ? 46 : 40
  return `
    <div class="pawlink-marker-wrap ${selected ? 'pawlink-marker-selected' : hovered ? 'pawlink-marker-hover' : ''}">
      ${pulse ? '<span class="pawlink-marker-pulse"></span>' : ''}
      <div class="pawlink-marker-pin" style="
        width:${size}px;
        height:${size}px;
        display:grid;
        place-items:center;
        border-radius:${selected ? '16px 16px 16px 4px' : '999px'};
        transform:rotate(-45deg);
        background:${background};
        border:3px solid white;
        color:${color};
        box-shadow:0 16px 34px rgba(15,23,42,.25);
        font:900 12px/1 Inter, ui-sans-serif, system-ui;
      ">
        <span style="transform:rotate(45deg);">${label}</span>
      </div>
    </div>
  `
}

export const lostMarkerIcon = L.divIcon({
  className: 'pawlink-leaflet-marker',
  html: markerHtml({ label: 'L', color: '#fff', background: '#e11d48' }),
  iconSize: [40, 40],
  iconAnchor: [20, 38],
  popupAnchor: [0, -38],
})

export const foundMarkerIcon = L.divIcon({
  className: 'pawlink-leaflet-marker',
  html: markerHtml({ label: 'F', color: '#fff', background: '#0d9488' }),
  iconSize: [40, 40],
  iconAnchor: [20, 38],
  popupAnchor: [0, -38],
})

export const selectedLostMarkerIcon = L.divIcon({
  className: 'pawlink-leaflet-marker',
  html: markerHtml({ label: 'LOST', color: '#fff', background: '#7c3aed', selected: true, pulse: true }),
  iconSize: [46, 46],
  iconAnchor: [23, 43],
  popupAnchor: [0, -43],
})

export const selectedFoundMarkerIcon = L.divIcon({
  className: 'pawlink-leaflet-marker',
  html: markerHtml({ label: 'FOUND', color: '#fff', background: '#7c3aed', selected: true, pulse: true }),
  iconSize: [46, 46],
  iconAnchor: [23, 43],
  popupAnchor: [0, -43],
})

export function clusterMarkerIcon(count: number) {
  const size = count > 12 ? 58 : count > 6 ? 52 : 46
  return L.divIcon({
    className: 'pawlink-leaflet-marker',
    html: `
      <div class="pawlink-cluster-marker" style="width:${size}px;height:${size}px;">
        <span>${count}</span>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  })
}

export const hoverLostMarkerIcon = L.divIcon({
  className: 'pawlink-leaflet-marker',
  html: markerHtml({ label: 'L', color: '#fff', background: '#be123c', hovered: true }),
  iconSize: [40, 40],
  iconAnchor: [20, 38],
  popupAnchor: [0, -38],
})

export const hoverFoundMarkerIcon = L.divIcon({
  className: 'pawlink-leaflet-marker',
  html: markerHtml({ label: 'F', color: '#fff', background: '#0f766e', hovered: true }),
  iconSize: [40, 40],
  iconAnchor: [20, 38],
  popupAnchor: [0, -38],
})

export const userLocationIcon = L.divIcon({
  className: 'pawlink-leaflet-marker',
  html: `
    <div style="
      width:22px;
      height:22px;
      border-radius:999px;
      background:#2563eb;
      border:5px solid white;
      box-shadow:0 0 0 10px rgba(37,99,235,.18), 0 12px 30px rgba(15,23,42,.24);
    "></div>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -12],
})

export const pickerMarkerIcon = L.divIcon({
  className: 'pawlink-leaflet-marker',
  html: markerHtml({ label: 'Pin', color: '#fff', background: '#7c3aed', selected: true }),
  iconSize: [46, 46],
  iconAnchor: [23, 43],
  popupAnchor: [0, -43],
})

export function reportMarkerIcon(type: ReportType, selected: boolean, hovered = false) {
  if (selected) return type === 'lost' ? selectedLostMarkerIcon : selectedFoundMarkerIcon
  if (hovered) return type === 'lost' ? hoverLostMarkerIcon : hoverFoundMarkerIcon
  return type === 'lost' ? lostMarkerIcon : foundMarkerIcon
}
