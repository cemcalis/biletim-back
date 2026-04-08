import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  getHealth() {
    return {
      ok: true,
      service: 'otobus-rezervasyon-api',
      timestamp: new Date().toISOString(),
    };
  }
}
