
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../services/report.service';

import { CoordsBus } from '../../services/coords-bus.service';   // <-- add

@Component({
  selector: 'app-report-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="form-container">
    <div class="card">
      <h2>Bejelentés</h2>

      <!-- Static text above the form -->
      <p class="intro-text">
       💔 Télen is alszanak hajléktalan emberek az utcán.
🙏 Ha lát egy hajléktalan embert , aki fázik vagy segítségre szorul, ne menjen el mellette.
🫂 Írja meg nekünk, és segítünk, amilyen gyorsan csak tudunk. ❤️
      </p>

      <form (ngSubmit)="onSubmit()" #f="ngForm" class="form-fields">
        <input
          name="name"
          [(ngModel)]="name"
          placeholder="Név / becenév"
          required />

        <textarea
          name="description"
          [(ngModel)]="description"
          placeholder="Ossza meg velünk hol észlelte pontosan a hajléktalan embert, és miben szorulhat segítségre."
          required></textarea>

        <input
          type="file"
          accept="image/*"
          (change)="onFile($event)" />

        <button type="button" (click)="useGeo()">Használja a jelenlegi helyzetemet</button>
        <button type="submit" [disabled]="!f.valid || !lat() || !lng()">Bejelentés Küldése</button>
      </form>
    </div>
  </div>
  `,

styles: [`
  :host { display: block; height: 100%; }        /* fill the .box */
  .form-container { height: 100%; }

  .card {
    background: transparent;
    box-shadow: none;
    border-radius: 0;
    margin: 0;
    padding: 1.25rem;          /* inner breathing room, but no extra frame */
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  h2 {
    text-align: center;
    color: #9d1b31;
    margin: 0 0 .5rem 0;
  }

  .intro-text {
    color: #444;
    margin: .25rem 0 1rem 0;
    text-align: left;
  }

  /* Fields fill remaining height; scroll if overflow */
  form.form-fields {
    display: flex;
    flex-direction: column;
    gap: .8rem;
    flex: 1 1 auto;
    min-height: 0;
    overflow: auto;
  }

  input, textarea, button {
    width: 100%;
    font-size: 1rem;
    border-radius: 8px;
    padding: 12px 14px;
    border: 1px solid #ccc;
    font-family: inherit;
    box-sizing: border-box;
    transition: .2s ease;
  }
  input:focus, textarea:focus { outline: none; border-color: #9d1b31; box-shadow: 0 0 6px rgba(157,27,49,.3); }
  textarea { min-height: 90px; resize: vertical; }
  ::placeholder { color: #999; opacity: 1; }

  button {
    background: #9d1b31; color: #fff; border: none; cursor: pointer; font-weight: 600;
    transition: background .2s ease, transform .1s ease;
  }
  button:hover { background: #7d1427; transform: translateY(-2px); }
  button:disabled { background: #bbb; cursor: not-allowed; transform: none; }

  @media (max-width: 600px) {
    .card { padding: 1rem; }
  }
`]
})
export class ReportFormComponent {
private svc = inject(ReportService);
private bus = inject(CoordsBus);

  name = '';
  description = '';
  photo: string | null = null;
  lat = signal<number | null>(null);
  lng = signal<number | null>(null);

  setCoords(lat: number, lng: number) { this.lat.set(lat); this.lng.set(lng); }

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
  if (!navigator.geolocation) {
    alert('A böngésződ nem támogatja a geolokációt.');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      this.lat.set(lat);
      this.lng.set(lng);

      this.bus.set({ lat, lng });
    },
    err => alert('Nem sikerült lekérni a pozíciót: ' + err.message)
  );
}


  async onSubmit() {
    await this.svc.submit({
      name: this.name,
      description: this.description,
      latitude: this.lat()!,
      longitude: this.lng()!,
      photo: this.photo
    });

    alert('Bejelentés elküldve!');
    this.name = '';
    this.description = '';
    this.photo = null;
    this.lat.set(null);
    this.lng.set(null);
  }
}

