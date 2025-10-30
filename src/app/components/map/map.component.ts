
import { Component, EventEmitter, OnDestroy, AfterViewInit, Output, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { ReportService } from '../../services/report.service';
import { Subscription } from 'rxjs';


// app/components/map/map.component.ts

// ⬇️ import Leaflet’s marker images so Vite/Angular bundles them
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// Set up the default icon for ALL markers
const DefaultIcon = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize:    [25, 41],
  iconAnchor:  [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize:  [41, 41],
});
(L.Marker.prototype as any).options.icon = DefaultIcon;

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

    // In case the container size changes right after load
    setTimeout(() => this.map.invalidateSize(), 0);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      this.ensureMarker();
      this.selectedMarker!.setLatLng([lat, lng]);
      this.coordsChange.emit({ lat, lng });
    });

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
      this.selectedMarker = L.marker([47.4979, 19.0402], { draggable: true }).addTo(this.map);
      this.selectedMarker.on('dragend', (ev: any) => {
        const p = ev.target.getLatLng();
        this.coordsChange.emit({ lat: p.lat, lng: p.lng });
      });
    }
  }

  private addReportMarker(r: { latitude:number; longitude:number; name:string; description:string }) {
    const url = `https://www.google.com/maps?q=${r.latitude},${r.longitude}`;
    return L.marker([r.latitude, r.longitude]).addTo(this.map)
      .bindPopup(`<b>${r.name}</b><br>${r.description}<br>
        <a href="${url}" target="_blank" style="color:#1f3c88;font-weight:bold;">View on Map</a>`);
  }
}

