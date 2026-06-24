import { query } from '../lib/db';

export class PaymentRepository {
  async getSettingValue(key: string): Promise<string | null> {
    const rows = await query<any[]>(
      `SELECT \`value\` FROM app_settings WHERE \`key\` = ? LIMIT 1`,
      [key]
    );
    return rows.length > 0 ? rows[0].value : null;
  }
}
