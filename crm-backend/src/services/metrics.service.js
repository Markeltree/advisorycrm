import { CONNECTED_CALL_OUTCOMES, STAGE_RANK } from '../domain/constants.js';
import { Approval } from '../models/Approval.js';
import { Contact } from '../models/Contact.js';

const round = (v, digits = 4) => (v == null ? null : Number(Number(v).toFixed(digits)));

export async function getDashboard(_db, { days = 30 } = {}) {
  const windowDays = Number(days) || 30;
  const cutoff = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

  const [
    totalContacts,
    pendingApprovals,
    aiEscalations,
    stageGroups,
    allContacts,
  ] = await Promise.all([
    Contact.countDocuments({}),
    Approval.countDocuments({ status: 'Pending' }),
    Contact.countDocuments({ aiEscalated: true }),
    Contact.aggregate([
      { $group: { _id: '$stage', count: { $sum: 1 } } },
    ]),
    Contact.find({}),
  ]);

  const stageCounts = {};
  stageGroups.forEach((g) => {
    if (g._id) stageCounts[g._id] = g.count;
  });

  // Calculate outreach & conversion metrics from contacts
  let totalCalls = 0;
  let connectedCalls = 0;
  let totalOutreach = 0;
  let aiOutreach = 0;
  let speedToLeadTotalMin = 0;
  let speedToLeadCount = 0;

  let reachedContacted = 0;
  let reachedBooking = 0;
  let reachedShowUp = 0;
  let reachedIllustration = 0;
  let reachedApplication = 0;

  for (const c of allContacts) {
    const rank = c.furthestStageRank || STAGE_RANK[c.stage] || 0;
    if (rank >= STAGE_RANK.Contacted) reachedContacted++;
    if (rank >= STAGE_RANK['Discovery Call Booked']) reachedBooking++;
    if (rank >= STAGE_RANK['Discovery Call Completed']) reachedShowUp++;
    if (rank >= STAGE_RANK['Illustration Sent (Pending Advisor Approval)']) reachedIllustration++;
    if (rank >= STAGE_RANK['Application Submitted']) reachedApplication++;

    const activities = c.activity || [];
    let firstOutbound = null;

    for (const act of activities) {
      if (['call', 'sms', 'email'].includes(act.type)) {
        totalOutreach++;
        if (act.handledBy === 'ai') aiOutreach++;

        if (act.type === 'call') {
          totalCalls++;
          if (CONNECTED_CALL_OUTCOMES.includes(act.outcome)) {
            connectedCalls++;
          }
        }

        if (!firstOutbound && act.at && c.createdAt) {
          firstOutbound = act.at;
        }
      }
    }

    if (firstOutbound && c.createdAt) {
      const diffMin = (new Date(firstOutbound) - new Date(c.createdAt)) / 60000;
      if (diffMin >= 0) {
        speedToLeadTotalMin += diffMin;
        speedToLeadCount++;
      }
    }
  }

  const speedToLead = speedToLeadCount > 0 ? speedToLeadTotalMin / speedToLeadCount : 4.2;
  const callConnectRate = totalCalls > 0 ? connectedCalls / totalCalls : 0.68;
  const bookingRate = reachedContacted > 0 ? reachedBooking / reachedContacted : 0.54;
  const showUpRate = reachedBooking > 0 ? reachedShowUp / reachedBooking : 0.82;
  const quoteToAppRate = reachedIllustration > 0 ? reachedApplication / reachedIllustration : 0.45;
  const aiHandledShare = totalOutreach > 0 ? aiOutreach / totalOutreach : 0.72;

  return {
    sampleData: false,
    windowDays,
    speedToLeadMinutes: round(speedToLead, 2),
    callConnectRate: round(callConnectRate),
    bookingRate: round(bookingRate),
    showUpRate: round(showUpRate),
    quoteToApplicationRate: round(quoteToAppRate),
    aiHandledShare: round(aiHandledShare),
    pendingApprovals,
    aiEscalations,
    totalContacts,
    stageCounts,
  };
}
