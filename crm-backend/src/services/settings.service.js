import { toContact } from '../lib/mappers.js';
import { computeTags, deriveNextStep } from '../domain/rules.js';
import { Contact } from '../models/Contact.js';
import { Setting } from '../models/Setting.js';
import { audit, getLicensedStates, recordComplianceEvent } from './shared.js';

export { getLicensedStates };

export async function setLicensedStates(_db, states, { user }) {
  await Setting.findOneAndUpdate(
    { key: 'licensed_states' },
    { key: 'licensed_states', value: states, updatedBy: user?.id || null },
    { upsert: true, new: true }
  );

  // Update contacts that are affected
  const contacts = await Contact.find({ licensingStatus: { $in: ['Licensed', 'Not Licensed'] } });
  let countUpdated = 0;

  for (const c of contacts) {
    const shouldBeLicensed = states.includes(c.state);
    const newStatus = shouldBeLicensed ? 'Licensed' : 'Not Licensed';

    if (c.licensingStatus !== newStatus) {
      c.licensingStatus = newStatus;
      const mapped = toContact(c);
      c.tags = computeTags(mapped);
      c.nextStep = deriveNextStep(mapped);
      await c.save();
      countUpdated++;

      await recordComplianceEvent(_db, {
        contactRow: c,
        event: shouldBeLicensed ? 'Licensing verified' : 'Routed to hold queue',
        channel: 'System',
        detail: `Licensed footprint updated. ${c.state} is now ${shouldBeLicensed ? 'inside' : 'outside'} the footprint.`,
        user,
      });
    }
  }

  await audit(_db, user, 'settings.licensed_states', 'settings', 'licensed_states', {
    states,
    contactsUpdated: countUpdated,
  });

  return { states: await getLicensedStates(_db), contactsUpdated: countUpdated };
}
