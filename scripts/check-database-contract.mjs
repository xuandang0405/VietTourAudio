import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const schema = readFileSync(path.join(root, 'database', 'schema.sql'), 'utf8').toLowerCase();

const contract = {
  users: ['pass_hash', 'full_name', 'role', 'status'],
  vendors: ['trade_name', 'contact_email', 'status'],
  stalls: ['vendor_id', 'latitude', 'longitude', 'activation_radius', 'status'],
  pois: ['stall_id', 'slug', 'is_premium_content', 'sort_order', 'status'],
  poi_contents: ['poi_id', 'lang', 'tts_script', 'audio_url', 'voice_profile'],
  media_files: ['vendor_id', 'file_type', 'file_path', 'moderation_status', 'moderated_by_user_id'],
  visitor_sessions: ['token', 'last_seen_at'],
  qr_scan_events: ['visitor_session_id', 'scanned_at'],
  visit_events: ['visitor_session_id', 'visited_at'],
  play_history: ['poi_content_id', 'lang', 'started_at'],
  payments: ['provider', 'payment_type', 'status', 'paid_at'],
  audit_logs: ['actor_user_id', 'before_data', 'after_data']
};

const errors = [];
for (const [table, columns] of Object.entries(contract)) {
  const match = schema.match(new RegExp(`create\\s+table\\s+${table}\\s*\\(([\\s\\S]*?)\\)\\s*engine=`));
  if (!match) {
    errors.push(`Missing table: ${table}`);
    continue;
  }
  for (const column of columns) {
    if (!new RegExp(`(^|\\n)\\s*${column}\\s+`).test(match[1])) {
      errors.push(`Missing column: ${table}.${column}`);
    }
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Database contract OK: ${Object.keys(contract).length} critical tables checked.`);
