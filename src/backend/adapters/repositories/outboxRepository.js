import { outboxTable } from '../orm';
import { eq } from 'drizzle-orm';

class OutboxRepository {
  constructor({ tx }) {
    this.tx = tx;
  }

  async add(message) {
    await this.tx.insert(outboxTable).values({ ...message });
  }

  async delete(messageId) {
    await this.tx
      .delete(outboxTable)
      .where(eq(outboxTable.messageId, messageId));
  }
}

export { OutboxRepository };
