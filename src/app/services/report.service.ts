
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Report } from '../models/report.model';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private http = inject(HttpClient);
  private apiUrl = '/.netlify/functions/send-report';

  private _reports$ = new BehaviorSubject<Report[]>(this.load());
  reports$ = this._reports$.asObservable();

  async submit(report: Report) {
    await this.http.post(this.apiUrl, report).toPromise();
    const updated = [report, ...this._reports$.value];
    this._reports$.next(updated);
    this.save(updated);
  }

  private save(list: Report[]) { localStorage.setItem('reports', JSON.stringify(list)); }
  private load(): Report[] {
    try { return JSON.parse(localStorage.getItem('reports') || '[]'); }
    catch { return []; }
  }
}
