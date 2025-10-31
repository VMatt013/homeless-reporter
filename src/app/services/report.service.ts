
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface ReportData {
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  photo?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly apiUrl = '/.netlify/functions/send-report'; // ✅ relative path

  constructor(private http: HttpClient) {}

  async submit(data: ReportData): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post(this.apiUrl, data, { responseType: 'json' })
      );
      console.log('Report sent successfully:', response);
      return response;
    } catch (error: any) {
      console.error('Error sending report:', error);
      alert(
        'Nem sikerült elküldeni a bejelentést.\n' +
          (error?.error?.error || error?.message || 'Ismeretlen hiba.')
      );
      throw error;
    }
  }
}

