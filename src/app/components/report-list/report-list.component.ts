
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportService } from '../../services/report.service';

@Component({
  selector: 'app-report-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ul class="list">
      <li *ngFor="let r of (svc.reports$ | async)">
        <b>{{r.name}}</b>: {{r.description}}
      </li>
    </ul>
  `,
  styles: [`
    .list{max-width:500px;margin:0 auto;padding-left:0;list-style:none}
    .list li{background:#fff;padding:12px 15px;margin-bottom:10px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.05)}
  `]
})
export class ReportListComponent {
  svc = inject(ReportService);
}
