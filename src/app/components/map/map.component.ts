
import { Component, EventEmitter, OnDestroy, AfterViewInit, Output, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { ReportService } from '../../services/report.service';
import { Subscription } from 'rxjs';

// ✅ Inline SVG marker (no assets, no loaders)
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
  <path fill="#1f3c88" d="M12.5 0C5.596 0 0 5.596 0 12.5c0 8.873 11.373 26.099 11.855 26.818a0.78.78 0 0 0 1.29 0C13.627 38.599 25 21.373 25 12.5 25 5.596 19.404 0 12.5 0z"/>
  <circle cx="12.5" cy="12.5" r="6.5" fill="#fff"/>
</svg>`;
const markerIcon = L.icon({
  iconUrl: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  template: `<div #mapEl id="map"></div>`,
  styles: [`
    #map { height: 420px; width: 100%; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,.08); }
  `]
})
export class MapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapEl', { static: true }) mapEl!: ElementRef<HTMLDivElement>;
  @Output() coordsChange = new EventEmitter<{lat:number;lng:number}>();

  private map!: L.Map;
  private selectedMarker: L.Marker | null = null;
  private markers: L.Marker[] = [];
  private sub?: Subscription;

  constructor(private reports: ReportService) {}

  ngAfterViewInit() {
    this.map = L.map(this.mapEl.nativeElement).setView([47.4979, 19.0402], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    // Ensure proper sizing after render
    setTimeout(() => this.map.invalidateSize(), 0);

    // Click to place/drag marker
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      this.ensureMarker();
      this.selectedMarker!.setLatLng([lat, lng]);
      this.coordsChange.emit({ lat, lng });
    });

    // Render saved reports as markers
    this.sub = this.reports.reports$.subscribe(list => {
      this.markers.forEach(m => this.map.removeLayer(m));
      this.markers = list.map(r => this.addReportMarker(r));
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    if (this.map) this.map.remove();
  }

  private ensureMarker() {
    if (!this.selectedMarker) {
      this.selectedMarker = L.marker([47.4979, 19.0402], { draggable: true, icon: markerIcon }).addTo(this.map);
      this.selectedMarker.on('dragend', (ev: any) => {
        const p = ev.target.getLatLng();
        this.coordsChange.emit({ lat: p.lat, lng: p.lng });
      });
    }
  }

  private addReportMarker(r: { latitude:number; longitude:number; name:string; description:string }) {
    const url = `https://www.google.com/maps?q=${r.latitude},${r.longitude}`;
    return L.marker([r.latitude, r.longitude], { icon: markerIcon }).addTo(this.map)
      .bindPopup(`<b>${r.name}</b><br>${r.description}<br>
        <a href="${url}" target="_blank" style="color:#1f3c88;font-weight:bold;">View on Map</a>`);
  }
}

