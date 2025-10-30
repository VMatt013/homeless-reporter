
export interface Report {
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  photo?: string | null; // base64 (no data: prefix)
}
