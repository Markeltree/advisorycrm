// Creates a CRM user in Supabase Auth with a role. Use it to create the first admin;
// after that, admins can add users through POST /api/users.
// Usage: npm run create-user -- --email you@agency.com --password "long-password" --role admin --name "Your Name"
import { parseArgs } from 'node:util';
import { loadConfig } from '../src/config.js';
import { createPgDatabase } from '../src/db/pool.js';
import { createLogger } from '../src/logger.js';
import { createSupabaseAuth } from '../src/services/auth.service.js';
import { createUserSchema } from '../src/lib/schemas.js';
import { createUser } from '../src/services/users.service.js';

const { values } = parseArgs({
  options: {
    email: { type: 'string' },
    password: { type: 'string' },
    role: { type: 'string', default: 'staff' },
    name: { type: 'string', default: '' },
  },
});

const parsed = createUserSchema.safeParse({ email: values.email, password: values.password, role: values.role, fullName: values.name });
if (!parsed.success) {
  for (const issue of parsed.error.issues) console.error(`${issue.path.join('.')}: ${issue.message}`);
  console.error('\nUsage: npm run create-user -- --email you@agency.com --password "long-password" --role admin --name "Your Name"');
  process.exit(1);
}

const config = loadConfig();
const db = createPgDatabase(config, createLogger('error'));
try {
  const user = await createUser(db, createSupabaseAuth(config), parsed.data, { user: null });
  console.log(`Created ${user.role} ${user.email} (${user.id}).`);
} catch (err) {
  console.error(`Could not create the user: ${err.message}`);
  process.exitCode = 1;
} finally {
  await db.close();
}
