
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

export interface Report {
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  photo?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly apiUrl = '/.netlify/functions/send-report';
  private readonly storeKey = 'homeless-reporter.reports';

  private _reports$ = new BehaviorSubject<Report[]>(this.load());
  /** Stream of all reports (for MapComponent) */
  readonly reports$ = this._reports$.asObservable();

  constructor(private http: HttpClient) {}

  /** Send to Netlify function and update local state */
  async submit(report: Report): Promise<void> {
    await firstValueFrom(this.http.post(this.apiUrl, report, { responseType: 'json' }));

    const next = [report, ...this._reports$.value];
    this._reports$.next(next);
    this.save(next);
  }

  // ---- local storage helpers ----
  private load(): Report[] {
    try {
      const raw = localStorage.getItem(this.storeKey);
      return raw ? (JSON.parse(raw) as Report[]) : [];
    } catch { return []; }
  }

  private save(list: Report[]) {
    try { localStorage.setItem(this.storeKey, JSON.stringify(list)); } catch {}
  }
}

