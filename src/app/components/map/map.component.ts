
import { Component, EventEmitter, OnDestroy, AfterViewInit, Output, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { ReportService, Report } from '../../services/report.service';
import { Subscription } from 'rxjs';

import { CoordsBus } from '../../services/coords-bus.service';

// 📍 Debrecen coordinates
const DEFAULT_LAT = 47.5316;
const DEFAULT_LNG = 21.6273;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
  <path fill="#9d1b31" d="M12.5 0C5.596 0 0 5.596 0 12.5c0 8.873 11.373 26.099 11.855 26.818a0.78.78 0 0 0 1.29 0C13.627 38.599 25 21.373 25 12.5 25 5.596 19.404 0 12.5 0z"/>
  <circle cx="12.5" cy="12.5" r="6.5" fill="#fff"/>
</svg>`;

const crimsonIcon = L.icon({
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
  :host {
    display: block;
    width: 100%;
    height: 100%;
  }

  .map-root {
    width: 100%;
    height: 100%;
    min-height: 300px;
  }

  .leaflet-container {
    width: 100%;
    height: 100%;
  }

  .leaflet-popup-content-wrapper {
    background: #9d1b31;
    color: #fff;
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(0,0,0,.2);
  }

  .leaflet-popup-tip {
    background: #9d1b31;
  }

  .leaflet-popup-content a {
    color: #fff;
    font-weight: 600;
    text-decoration: underline;
  }
`]
})
export class MapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapEl', { static: true }) mapEl!: ElementRef<HTMLDivElement>;
  @Output() coordsChange = new EventEmitter<{ lat: number; lng: number }>();

private io?: IntersectionObserver;

  private map!: L.Map;
  private selectedMarker: L.Marker | null = null;
  private markers: L.Marker[] = [];
  private sub?: Subscription;

constructor(private reports: ReportService, private bus: CoordsBus) {}

  ngAfterViewInit() {
    this.map = L.map(this.mapEl.nativeElement).setView([DEFAULT_LAT, DEFAULT_LNG], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    // fix rendering on load
    setTimeout(() => this.map.invalidateSize(), 0);

 this.io = new IntersectionObserver((entries) => {
    if (entries.some(e => e.isIntersecting)) {
      setTimeout(() => this.map.invalidateSize(), 0);
    }
  }, { threshold: 0.1 });
  this.io.observe(this.mapEl.nativeElement);

this.bus.coords$.subscribe(c => {
  if (!c) return;
  this.ensureMarker();
  this.selectedMarker!.setLatLng([c.lat, c.lng]);
  this.map.setView([c.lat, c.lng], Math.max(this.map.getZoom(), 13));
});

    // click to drop or move the marker
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      this.ensureMarker();
      this.selectedMarker!.setLatLng([lat, lng]);
      this.coordsChange.emit({ lat, lng });
    });


this.sub = this.reports.reports$.subscribe((list: Report[]) => {
  // remove old markers
  this.markers.forEach(m => this.map.removeLayer(m));
  // add typed markers
  //this.markers = list.map((r: Report) => this.addReportMarker(r));
});

  }

ngOnDestroy() {
  this.sub?.unsubscribe();
  this.io?.disconnect();                // 👈 clean up
  if (this.map) this.map.remove();
}
  private ensureMarker() {
    if (!this.selectedMarker) {
      this.selectedMarker = L.marker([DEFAULT_LAT, DEFAULT_LNG], { draggable: true, icon: crimsonIcon }).addTo(this.map);
      this.selectedMarker.on('dragend', (ev: any) => {
        const p = ev.target.getLatLng();
        this.coordsChange.emit({ lat: p.lat, lng: p.lng });
      });
    }
  }



}

