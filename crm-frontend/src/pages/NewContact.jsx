import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  ShieldCheck,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Save,
} from 'lucide-react';
import { api } from '../api/index.js';
import { useToast } from '../components/Toast.jsx';
import {
  APPROVED_WORDING,
  ESTATE_STATUSES,
  LEAD_CATEGORIES,
  LICENSED_STATES,
  MARITAL_STATUSES,
  PRODUCTS,
  US_STATES,
} from '../data/constants.js';
import { Button, ErrorNotice, Field, PageHeader, Panel } from '../components/ui.jsx';

const EMPTY = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  dob: '',
  state: '',
  leadCategory: '',
  productInterest: '',
  leadEntryReason: '',
  referralSource: '',
  consentSource: '',
  consentChecked: false,
  maritalStatus: '',
  dependents: '',
  income: '',
  assets: '',
  debt: '',
  primaryConcern: '',
  employer: '',
  estateStatus: 'None',
};

function validate(form) {
  const errors = {};
  if (!form.firstName.trim()) errors.firstName = 'Enter a first name.';
  if (!form.lastName.trim()) errors.lastName = 'Enter a last name.';
  if (!/^\+?[0-9()\-\s]{7,}$/.test(form.phone.trim())) errors.phone = 'Enter a phone number with area code.';
  if (form.email && !/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = 'Enter a valid email, or leave it blank.';
  if (!form.state) errors.state = 'Choose the resident state. It decides the licensing check.';
  if (!form.leadCategory) errors.leadCategory = 'Choose a lead category.';
  if (!form.productInterest) errors.productInterest = 'Choose a product of interest.';
  if (!form.leadEntryReason.trim()) errors.leadEntryReason = 'Record the exact reason this person became a lead.';
  return errors;
}

const inputClass =
  'w-full h-9 px-3 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:border-transparent dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 transition-all';
const textareaClass =
  'w-full p-3 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:border-transparent dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 transition-all resize-y';

export default function NewContact() {
  const navigate = useNavigate();
  const { notify } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);

  const licensing = useMemo(() => {
    if (!form.state) return null;
    return LICENSED_STATES.includes(form.state) ? 'Licensed' : 'Not Licensed';
  }, [form.state]);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError('');
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const first = Object.keys(found)[0];
      document.getElementById(first)?.focus();
      return;
    }

    setSaving(true);
    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      dob: form.dob,
      state: form.state,
      leadCategory: form.leadCategory,
      productInterest: form.productInterest,
      leadEntryReason: form.leadEntryReason.trim(),
      referralSource: form.referralSource.trim(),
      consentStatus: form.consentChecked ? 'Given' : 'Not Captured',
      consentSource: form.consentChecked ? form.consentSource.trim() || 'Web form' : '',
      licensingStatus: licensing || 'Pending Verification',
      maritalStatus: form.maritalStatus,
      dependents: form.dependents === '' ? null : Number(form.dependents),
      income: form.income === '' ? null : Number(form.income),
      assets: form.assets === '' ? null : Number(form.assets),
      debt: form.debt === '' ? null : Number(form.debt),
      primaryConcern: form.primaryConcern.trim(),
      employer: form.employer.trim(),
      estateStatus: form.estateStatus,
    };

    try {
      const created = await api.createContact(payload);
      notify(`${created.firstName} ${created.lastName} added successfully.`, 'success');
      navigate(`/contacts/${created.id}`);
    } catch (err) {
      setSubmitError(err.message || 'The contact could not be saved. Try again.');
      setSaving(false);
    }
  }

  const invalidCount = Object.values(errors).filter(Boolean).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Add New Contact"
        lead="Capture contact credentials, origin story, and explicit consent before enabling automated touchpoints."
        actions={
          <Link
            to="/contacts"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-zinc-600 hover:text-zinc-900 border border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to list</span>
          </Link>
        }
      />

      {submitError && <ErrorNotice>{submitError}</ErrorNotice>}
      {invalidCount > 0 && (
        <ErrorNotice>
          {invalidCount} {invalidCount === 1 ? 'required field needs' : 'required fields need'} attention before saving.
        </ErrorNotice>
      )}

      <form className="space-y-6" onSubmit={handleSubmit} noValidate>
        {/* Personal Details */}
        <Panel title="Personal Identification" id="sec-person" description="Basic contact information & residency state for licensing check.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="First name" htmlFor="firstName" error={errors.firstName}>
              <input
                id="firstName"
                className={inputClass}
                value={form.firstName}
                onChange={(e) => update('firstName', e.target.value)}
                placeholder="Sarah"
                autoComplete="given-name"
              />
            </Field>

            <Field label="Last name" htmlFor="lastName" error={errors.lastName}>
              <input
                id="lastName"
                className={inputClass}
                value={form.lastName}
                onChange={(e) => update('lastName', e.target.value)}
                placeholder="Jenkins"
                autoComplete="family-name"
              />
            </Field>

            <Field label="Mobile phone" htmlFor="phone" error={errors.phone} hint="Required for AI voice and SMS follow-ups.">
              <input
                id="phone"
                className={inputClass}
                type="tel"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                placeholder="(555) 234-5678"
                autoComplete="tel"
              />
            </Field>

            <Field label="Email address" htmlFor="email" error={errors.email}>
              <input
                id="email"
                className={inputClass}
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="sarah.jenkins@example.com"
                autoComplete="email"
              />
            </Field>

            <Field label="Date of birth" htmlFor="dob">
              <input
                id="dob"
                className={inputClass}
                type="date"
                value={form.dob}
                onChange={(e) => update('dob', e.target.value)}
              />
            </Field>

            <Field label="Resident state" htmlFor="state" error={errors.state}>
              <select
                id="state"
                className={inputClass}
                value={form.state}
                onChange={(e) => update('state', e.target.value)}
              >
                <option value="">Select state...</option>
                {US_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {licensing && (
            <div
              className={`mt-4 p-3 rounded-lg border text-xs flex items-center gap-2.5 ${
                licensing === 'Licensed'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60'
                  : 'bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60'
              }`}
            >
              {licensing === 'Licensed' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Licensed in <strong>{form.state}</strong>. Automation can engage once consent is verified.</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Not licensed in <strong>{form.state}</strong>. This record routes to the Hold Queue for partner referral.</span>
                </>
              )}
            </div>
          )}
        </Panel>

        {/* Lead Origin */}
        <Panel title="Lead Context & Intent" id="sec-lead" description="Category, interest product, and the explicit inquiry reason.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Lead category" htmlFor="leadCategory" error={errors.leadCategory}>
              <select
                id="leadCategory"
                className={inputClass}
                value={form.leadCategory}
                onChange={(e) => update('leadCategory', e.target.value)}
              >
                <option value="">Select category...</option>
                {LEAD_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Product of interest" htmlFor="productInterest" error={errors.productInterest}>
              <select
                id="productInterest"
                className={inputClass}
                value={form.productInterest}
                onChange={(e) => update('productInterest', e.target.value)}
              >
                <option value="">Select product...</option>
                {PRODUCTS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Referral source" htmlFor="referralSource" hint="Partner name, campaign or inbound ad channel.">
              <input
                id="referralSource"
                className={inputClass}
                value={form.referralSource}
                onChange={(e) => update('referralSource', e.target.value)}
                placeholder="e.g. Website Inbound / CPA Partner"
              />
            </Field>

            <div className="md:col-span-2">
              <Field
                label="Lead entry reason"
                htmlFor="leadEntryReason"
                error={errors.leadEntryReason}
                hint="Capture verbatim inquiry or motive (e.g., 'Looking to protect 2 children and rollover 401k')."
              >
                <textarea
                  id="leadEntryReason"
                  rows={3}
                  className={textareaClass}
                  value={form.leadEntryReason}
                  onChange={(e) => update('leadEntryReason', e.target.value)}
                  placeholder="What specifically prompted them to inquire?"
                />
              </Field>
            </div>
          </div>
        </Panel>

        {/* Consent Documentation */}
        <Panel
          title="TCPA & Communications Consent"
          id="sec-consent"
          description="Verification of affirmative consent for voice AI and SMS communications."
        >
          <div className={`p-4 rounded-xl border transition-all ${form.consentChecked ? 'bg-emerald-50/40 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/60' : 'bg-zinc-50 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800'}`}>
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.consentChecked}
                onChange={(e) => update('consentChecked', e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-950"
              />
              <span className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {APPROVED_WORDING.webConsent}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Field label="Consent source" htmlFor="consentSource" hint="E.g., Web form, incoming call recording, or intake rep.">
              <input
                id="consentSource"
                className={inputClass}
                value={form.consentSource}
                onChange={(e) => update('consentSource', e.target.value)}
                disabled={!form.consentChecked}
                placeholder="e.g. Inbound quote calculator"
              />
            </Field>

            <div className="flex flex-col justify-center">
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Resulting Status</span>
              <p className="mt-1 text-xs">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-medium ${form.consentChecked ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                  {form.consentChecked ? 'Given (Approved for outreach)' : 'Not Captured (Hold)'}
                </span>
              </p>
            </div>
          </div>
        </Panel>

        {/* Discovery Profile (Optional) */}
        <Panel
          title="Financial & Household Discovery"
          id="sec-discovery"
          description="Optional initial disclosures; AI discovery interviews gather these progressively."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Marital status" htmlFor="maritalStatus">
              <select
                id="maritalStatus"
                className={inputClass}
                value={form.maritalStatus}
                onChange={(e) => update('maritalStatus', e.target.value)}
              >
                <option value="">Not known</option>
                {MARITAL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Dependents count" htmlFor="dependents">
              <input
                id="dependents"
                type="number"
                min="0"
                className={inputClass}
                value={form.dependents}
                onChange={(e) => update('dependents', e.target.value)}
                placeholder="0"
              />
            </Field>

            <Field label="Estimated annual income ($)" htmlFor="income">
              <input
                id="income"
                type="number"
                min="0"
                className={inputClass}
                value={form.income}
                onChange={(e) => update('income', e.target.value)}
                placeholder="120000"
              />
            </Field>

            <Field label="Estimated liquid assets ($)" htmlFor="assets">
              <input
                id="assets"
                type="number"
                min="0"
                className={inputClass}
                value={form.assets}
                onChange={(e) => update('assets', e.target.value)}
                placeholder="250000"
              />
            </Field>

            <Field label="Estimated debt ($)" htmlFor="debt">
              <input
                id="debt"
                type="number"
                min="0"
                className={inputClass}
                value={form.debt}
                onChange={(e) => update('debt', e.target.value)}
                placeholder="15000"
              />
            </Field>

            <Field label="Employer / Company" htmlFor="employer">
              <input
                id="employer"
                className={inputClass}
                value={form.employer}
                onChange={(e) => update('employer', e.target.value)}
                placeholder="Acme Corp"
              />
            </Field>

            <Field label="Estate plan status" htmlFor="estateStatus">
              <select
                id="estateStatus"
                className={inputClass}
                value={form.estateStatus}
                onChange={(e) => update('estateStatus', e.target.value)}
              >
                {ESTATE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>

            <div className="md:col-span-2">
              <Field label="Primary concern or goal" htmlFor="primaryConcern">
                <textarea
                  id="primaryConcern"
                  rows={2}
                  className={textareaClass}
                  value={form.primaryConcern}
                  onChange={(e) => update('primaryConcern', e.target.value)}
                  placeholder="Key priorities or questions raised by prospect..."
                />
              </Field>
            </div>
          </div>
        </Panel>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Link
            to="/contacts"
            className="px-4 py-2 text-xs font-medium rounded-lg text-zinc-600 hover:text-zinc-900 border border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Cancel
          </Link>
          <Button type="submit" disabled={saving} className="gap-2">
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving Contact...' : 'Save Contact'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
