
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Coords = { lat: number; lng: number };
@Injectable({ providedIn: 'root' })
export class CoordsBus {
  readonly coords$ = new BehaviorSubject<Coords | null>(null);
  set(c: Coords) { this.coords$.next(c); }
}
