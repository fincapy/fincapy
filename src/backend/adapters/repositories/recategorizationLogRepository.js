import { recategorizationLogTable } from '../orm';

class RecategorizationLogRepository {
  constructor({ tx }) {
    this.tx = tx;
  }

  async add(recategorization) {
    await this.tx
      .insert(recategorizationLogTable)
      .values({ ...recategorization });
  }
}

export { RecategorizationLogRepository };
