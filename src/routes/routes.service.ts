import { Injectable } from '@nestjs/common';
import { DataStoreService } from '../common/data/data-store.service';

@Injectable()
export class RoutesService {
  constructor(private readonly dataStore: DataStoreService) {}

  getRoutes() {
    const db = this.dataStore.readData();
    return db.routes;
  }
}
