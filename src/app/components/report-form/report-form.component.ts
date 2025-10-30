
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../services/report.service';

@Component({
  selector: 'app-report-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <form (ngSubmit)="onSubmit()" #f="ngForm" class="card">
    <input name="name" [(ngModel)]="name" placeholder="Név / becenév" required>
    <textarea name="description" [(ngModel)]="description" placeholder="Leírás" required></textarea>
    <input type="file" accept="image/*" (change)="onFile($event)">
    <button type="button" (click)="useGeo()">Használja a jelenlegi helyzetemet</button>
    <button type="submit" [disabled]="!f.valid || !lat() || !lng()">Bejelentés Küldése</button>
  </form>
  `,
  styles: [`
    .card{background:#fff;padding:2rem;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,.08);max-width:500px;margin:0 auto 30px;}
    input,textarea{display:block;width:100%;margin:.8rem 0;padding:12px 15px;border:1px solid #ccc;border-radius:8px;font-size:1rem}
    button{display:block;width:100%;background:#1f3c88;color:#fff;border:none;padding:12px 20px;margin-top:10px;border-radius:8px;cursor:pointer;font-size:1rem}
    button:hover{background:#162b62}
  `]
})
export class ReportFormComponent {
  private svc = inject(ReportService);

  name = ''; description = '';
  photo: string | null = null;
  lat = signal<number | null>(null);
  lng = signal<number | null>(null);

  setCoords(lat:number, lng:number){ this.lat.set(lat); this.lng.set(lng); }

  onFile(ev: Event) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = String(reader.result);
      const comma = res.indexOf(',');
      this.photo = comma >= 0 ? res.slice(comma + 1) : res;
    };
    reader.readAsDataURL(file);
  }

  useGeo() {
    if (!navigator.geolocation) { alert('A böngésződ nem támogatja a geolokációt.'); return; }
    navigator.geolocation.getCurrentPosition(
      pos => { this.lat.set(pos.coords.latitude); this.lng.set(pos.coords.longitude); },
      err => alert('Nem sikerült lekérni a pozíciót: ' + err.message)
    );
  }

  async onSubmit() {
    await this.svc.submit({
      name: this.name,
      description: this.description,
      latitude: this.lat()!, longitude: this.lng()!, photo: this.photo
    });
    alert('Bejelentés elküldve!');
    this.name=''; this.description=''; this.photo=null; this.lat.set(null); this.lng.set(null);
  }
}
