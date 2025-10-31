
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

// ⬅️ Standalone components must be listed in `imports`
import { MapComponent } from './components/map/map.component';
import { ReportFormComponent } from './components/report-form/report-form.component';
import { ReportListComponent } from './components/report-list/report-list.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, HttpClientModule, MapComponent, ReportFormComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}

