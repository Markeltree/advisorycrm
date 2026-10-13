-- Reference data: the twelve core workflows (Appendix A.4) and the licensing footprint.
-- LICENSED_STATES is a placeholder (Section 10). Change it from the API with
-- PUT /api/settings/licensed-states once the real footprint is confirmed.

insert into public.workflows (id, name, trigger, mode, gate, phase) values
  (1,  'New Lead Intake & Consent Capture',         'Form submission or lead vendor webhook',               'Automated',                               'Consent recorded before any outreach',            1),
  (2,  'Initial AI Voice Outreach',                 'Lead created and consent Given',                       'Automated (AI voice)',                    'Fixed disclosure line, pilot one category first', 3),
  (3,  'No-Answer Follow-Up',                       'Call outcome = No Answer',                             'Automated (voicemail and SMS)',           'SMS wording is fixed',                            2),
  (4,  'Booking Confirmation & Reschedule',         'Calendar event booked',                                'Automated',                               'Unresolved conflicts escalate to a person',       2),
  (5,  'Reminder Cadence',                          '48h, 24h and morning-of the booked event',             'Automated',                               'None',                                            2),
  (6,  'Illustration Drafting, Advisor Approval',   'Discovery call marked complete',                       'AI draft, advisor approves',              'Required approval task',                          4),
  (7,  'Underwriting Status Monitor',               'Scheduled poll or portal webhook',                     'Automated',                               'Portal failure flags the case for manual handling', 4),
  (8,  'Missing-Document Request',                  'Underwriting flags a missing item',                    'AI draft, team approves',                 'Required approval task',                          4),
  (9,  'Friday Recap Email',                        'Weekly schedule',                                      'AI draft, manual approval',               'Required approval task',                          4),
  (10, 'Birthday, Holiday & Anniversary Greetings', 'Date-based',                                           'Automated',                               'Suppressed for opted-out contacts',               5),
  (11, 'Referral Request Trigger',                  'Pipeline stage = Client (In-Force)',                   'Automated trigger, human writes the ask', 'Advisor personalizes the request',                5),
  (12, 'DNC & Opt-Out Handler',                     'STOP reply, verbal opt-out or manual flag',            'Automated, all workflows',                'Immediate and system-wide',                       2)
on conflict (id) do nothing;

insert into public.licensed_states (state) values
  ('AZ'), ('CO'), ('FL'), ('GA'), ('NJ'), ('NY'), ('OH'), ('TN'), ('TX')
on conflict (state) do nothing;
