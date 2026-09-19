'use client';

import React, { useState } from 'react';
import { FormField } from './FormField';
import { SelectField } from './SelectField';
import { TextareaField } from './TextareaField';
import { FormSuccess, FormError } from './FormStatus';
import { Button } from '@/components/ui/Button';
import { MANPOWER_CATEGORIES } from '@/lib/data/recruitment';
import { getPublicApiBaseUrl } from '@/lib/api-client';
import styles from './Forms.module.css';

interface PositionFormItem {
  id: string;
  categorySlug: string;
  roleTitle: string;
  headcount: number;
  experienceYearsRequired: string;
  qualification: string;
  genderRequirement: 'any' | 'male' | 'female';
  languageRequirements: string;
  salaryOffered: string;
  accommodationProvided: 'provided' | 'allowance' | 'not_provided';
  transportProvided: 'provided' | 'allowance' | 'not_provided';
  foodProvided: 'provided' | 'allowance' | 'not_provided';
  notes: string;
}

const DEFAULT_POSITION = (): PositionFormItem => ({
  id: Math.random().toString(36).substring(2, 9),
  categorySlug: 'cleaning',
  roleTitle: 'General Cleaner',
  headcount: 5,
  experienceYearsRequired: '1',
  qualification: '',
  genderRequirement: 'any',
  languageRequirements: 'English / Basic',
  salaryOffered: '',
  accommodationProvided: 'provided',
  transportProvided: 'provided',
  foodProvided: 'not_provided',
  notes: '',
});

const UAE_EMIRATES = [
  { value: 'Dubai', label: 'Dubai' },
  { value: 'Abu Dhabi', label: 'Abu Dhabi' },
  { value: 'Sharjah', label: 'Sharjah' },
  { value: 'Ajman', label: 'Ajman' },
  { value: 'Ras Al Khaimah', label: 'Ras Al Khaimah' },
  { value: 'Fujairah', label: 'Fujairah' },
  { value: 'Umm Al Quwain', label: 'Umm Al Quwain' },
];

const TIMELINE_OPTIONS = [
  { value: 'immediate', label: 'Immediate (Within 15 days)' },
  { value: '30-days', label: 'Within 30 days' },
  { value: '60-days', label: 'Within 60 days' },
  { value: 'ongoing', label: 'Ongoing Staffing Contract' },
];

const GENDER_OPTIONS = [
  { value: 'any', label: 'No Preference / Open' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

const PROVISION_OPTIONS = [
  { value: 'provided', label: 'Company Provided' },
  { value: 'allowance', label: 'Financial Allowance' },
  { value: 'not_provided', label: 'Not Provided / Self' },
];

export function EmployerEnquiryForm() {
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactDesignation, setContactDesignation] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [city, setCity] = useState('Dubai');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [preferredTimeline, setPreferredTimeline] = useState('30-days');
  const [deploymentLocation, setDeploymentLocation] = useState('');
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [consent, setConsent] = useState(false);

  // Dynamic positions (min 1, max 10)
  const [positions, setPositions] = useState<PositionFormItem[]>([DEFAULT_POSITION()]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    reference: string;
    totalPositions: number;
    totalHeadcount: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const categoryOptions = MANPOWER_CATEGORIES.map((c) => ({
    value: c.slug,
    label: c.title,
  }));

  const handleAddPosition = () => {
    if (positions.length >= 10) return;
    setPositions((prev) => [...prev, DEFAULT_POSITION()]);
  };

  const handleRemovePosition = (id: string) => {
    if (positions.length <= 1) return;
    setPositions((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpdatePosition = (id: string, field: keyof PositionFormItem, value: any) => {
    setPositions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!companyName.trim()) errs.companyName = 'Company name is required';
    if (!contactPerson.trim()) errs.contactPerson = 'Contact person name is required';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'A valid corporate email is required';
    }
    if (!phone.trim()) errs.phone = 'Contact phone number is required';
    if (!city.trim()) errs.city = 'Please select a UAE city / emirate';
    if (!consent) errs.consent = 'You must confirm authority to submit this manpower requisition';

    // Validate positions
    if (positions.length === 0) {
      errs.positions = 'At least one manpower role position is required';
    } else {
      positions.forEach((pos, idx) => {
        if (!pos.roleTitle.trim()) {
          errs[`pos_${idx}_roleTitle`] = `Role #${idx + 1}: Role title is required`;
        }
        if (!pos.headcount || pos.headcount < 1 || pos.headcount > 500) {
          errs[`pos_${idx}_headcount`] = `Role #${idx + 1}: Headcount must be between 1 and 500`;
        }
      });
    }

    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setErrorMessage('Please review the highlighted errors before submitting.');
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        companyName: companyName.trim(),
        contactPerson: contactPerson.trim(),
        contactDesignation: contactDesignation.trim() || null,
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || null,
        city: city.trim(),
        website: website.trim() || null,
        industry: industry.trim() || null,
        preferredTimeline: preferredTimeline || null,
        deploymentLocation: deploymentLocation.trim() || null,
        specialRequirements: specialRequirements.trim() || null,
        positions: positions.map((p) => ({
          categorySlug: p.categorySlug,
          roleTitle: p.roleTitle.trim(),
          headcount: Number(p.headcount),
          experienceYearsRequired: p.experienceYearsRequired ? Number(p.experienceYearsRequired) : null,
          qualification: p.qualification.trim() || null,
          genderRequirement: p.genderRequirement,
          languageRequirements: p.languageRequirements.trim() || null,
          salaryOffered: p.salaryOffered.trim() || null,
          accommodationProvided: p.accommodationProvided,
          transportProvided: p.transportProvided,
          foodProvided: p.foodProvided,
          notes: p.notes.trim() || null,
        })),
      };

      const res = await fetch(`${getPublicApiBaseUrl()}/manpower-enquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();

      if (!res.ok) {
        if (resData.error?.fieldErrors) {
          setErrors(resData.error.fieldErrors);
          setErrorMessage('Validation error. Please verify input fields.');
        } else if (res.status === 429) {
          setErrorMessage('Too many requisitions submitted from this network. Please wait before submitting another requirement.');
        } else {
          setErrorMessage(resData.error?.message || resData.message || 'Submission failed. Please try again.');
        }
        return;
      }

      setSubmittedData({
        reference: resData.data?.reference || 'CLC-MP-RECORDED',
        totalPositions: resData.data?.totalPositions || positions.length,
        totalHeadcount: resData.data?.totalHeadcount || positions.reduce((sum, p) => sum + p.headcount, 0),
      });
    } catch {
      setErrorMessage('Unable to connect to the manpower requisition service. Please check your network connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedData) {
    return (
      <FormSuccess
        title="Manpower Requirement Received"
        message={`Thank you for submitting your manpower requisition to Cityline Consultancy. Requisition reference: ${submittedData.reference} (${submittedData.totalPositions} role(s), ${submittedData.totalHeadcount} total personnel). Your requirement has been received and will be reviewed by our corporate advisory team. A representative may contact your organization if additional clarification is required.`}
        onReset={() => {
          setSubmittedData(null);
          setCompanyName('');
          setContactPerson('');
          setContactDesignation('');
          setEmail('');
          setPhone('');
          setWhatsapp('');
          setCity('Dubai');
          setIndustry('');
          setWebsite('');
          setPreferredTimeline('30-days');
          setDeploymentLocation('');
          setSpecialRequirements('');
          setConsent(false);
          setPositions([DEFAULT_POSITION()]);
        }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      {errorMessage && <FormError message={errorMessage} />}

      {/* --- Section 1: Company Profile --- */}
      <div className={styles.formSectionHeader}>
        <span>1. Corporate Establishment Profile</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
        <FormField
          id="emp-companyName"
          label="Company / Establishment Name"
          placeholder="e.g. Al Wasl Contracting LLC"
          required
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          error={errors.companyName}
        />

        <FormField
          id="emp-industry"
          label="Operating Industry / Sector"
          placeholder="e.g. Construction, Hospitality, Logistics"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
        <SelectField
          id="emp-city"
          label="Primary UAE Emirate"
          options={UAE_EMIRATES}
          required
          value={city}
          onChange={(e) => setCity(e.target.value)}
          error={errors.city}
        />

        <FormField
          id="emp-website"
          label="Company Website (Optional)"
          placeholder="e.g. https://www.example.ae"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      {/* --- Section 2: Authorized Contact Person --- */}
      <div className={styles.formSectionHeader}>
        <span>2. Contact Person Details</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
        <FormField
          id="emp-contactPerson"
          label="Contact Person Name"
          placeholder="e.g. Tariq Al Mansoori"
          required
          value={contactPerson}
          onChange={(e) => setContactPerson(e.target.value)}
          error={errors.contactPerson}
        />

        <FormField
          id="emp-contactDesignation"
          label="Designation / Role"
          placeholder="e.g. Operations Director / HR Lead"
          value={contactDesignation}
          onChange={(e) => setContactDesignation(e.target.value)}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
        <FormField
          id="emp-email"
          type="email"
          label="Corporate Email Address"
          placeholder="e.g. hr@company.ae"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />

        <FormField
          id="emp-phone"
          type="tel"
          label="Contact Phone / Mobile Number"
          placeholder="e.g. +971 4 000 0000"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          error={errors.phone}
        />

        <FormField
          id="emp-whatsapp"
          type="tel"
          label="WhatsApp Number (Optional)"
          placeholder="e.g. +971 50 000 0000"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
        />
      </div>

      {/* --- Section 3: Manpower Roles Breakdown (1 to 10 positions) --- */}
      <div className={styles.formSectionHeader}>
        <span>3. Manpower Roles & Specifications ({positions.length}/10)</span>
      </div>

      {errors.positions && <span className={styles.errorText}>{errors.positions}</span>}

      {positions.map((pos, index) => (
        <div key={pos.id} className={styles.positionCard}>
          <div className={styles.positionHeader}>
            <span className={styles.positionTitle}>
              Role #{index + 1}: {pos.roleTitle || 'New Role'}
            </span>
            {positions.length > 1 && (
              <button
                type="button"
                className={styles.removePositionBtn}
                onClick={() => handleRemovePosition(pos.id)}
                aria-label={`Remove role #${index + 1}`}
              >
                ✕ Remove Role
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
            <SelectField
              id={`pos-${pos.id}-category`}
              label="Job Category"
              options={categoryOptions}
              required
              value={pos.categorySlug}
              onChange={(e) => handleUpdatePosition(pos.id, 'categorySlug', e.target.value)}
            />

            <FormField
              id={`pos-${pos.id}-roleTitle`}
              label="Role / Title"
              placeholder="e.g. Block Mason / Delivery Rider"
              required
              value={pos.roleTitle}
              onChange={(e) => handleUpdatePosition(pos.id, 'roleTitle', e.target.value)}
              error={errors[`pos_${index}_roleTitle`]}
            />

            <FormField
              id={`pos-${pos.id}-headcount`}
              type="number"
              label="Headcount Required (1–500)"
              required
              value={pos.headcount.toString()}
              onChange={(e) => handleUpdatePosition(pos.id, 'headcount', parseInt(e.target.value, 10) || 1)}
              error={errors[`pos_${index}_headcount`]}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
            <FormField
              id={`pos-${pos.id}-exp`}
              type="number"
              label="Min. Experience (Years)"
              placeholder="e.g. 2"
              value={pos.experienceYearsRequired}
              onChange={(e) => handleUpdatePosition(pos.id, 'experienceYearsRequired', e.target.value)}
            />

            <FormField
              id={`pos-${pos.id}-qual`}
              label="Qualification (Optional)"
              placeholder="e.g. ITI Trade Certificate"
              value={pos.qualification}
              onChange={(e) => handleUpdatePosition(pos.id, 'qualification', e.target.value)}
            />

            <SelectField
              id={`pos-${pos.id}-gender`}
              label="Gender Specification"
              options={GENDER_OPTIONS}
              value={pos.genderRequirement}
              onChange={(e) => handleUpdatePosition(pos.id, 'genderRequirement', e.target.value)}
            />

            <FormField
              id={`pos-${pos.id}-lang`}
              label="Language Preferences"
              placeholder="e.g. English, Hindi, Arabic"
              value={pos.languageRequirements}
              onChange={(e) => handleUpdatePosition(pos.id, 'languageRequirements', e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
            <FormField
              id={`pos-${pos.id}-salary`}
              label="Indicative Salary (Optional)"
              placeholder="e.g. 1200 - 1500 AED"
              value={pos.salaryOffered}
              onChange={(e) => handleUpdatePosition(pos.id, 'salaryOffered', e.target.value)}
            />

            <SelectField
              id={`pos-${pos.id}-acc`}
              label="Accommodation Provision"
              options={PROVISION_OPTIONS}
              value={pos.accommodationProvided}
              onChange={(e) => handleUpdatePosition(pos.id, 'accommodationProvided', e.target.value)}
            />

            <SelectField
              id={`pos-${pos.id}-trans`}
              label="Transport Provision"
              options={PROVISION_OPTIONS}
              value={pos.transportProvided}
              onChange={(e) => handleUpdatePosition(pos.id, 'transportProvided', e.target.value)}
            />

            <SelectField
              id={`pos-${pos.id}-food`}
              label="Food / Catering Provision"
              options={PROVISION_OPTIONS}
              value={pos.foodProvided}
              onChange={(e) => handleUpdatePosition(pos.id, 'foodProvided', e.target.value)}
            />
          </div>

          <FormField
            id={`pos-${pos.id}-notes`}
            label="Specific Role Notes (Optional)"
            placeholder="Trade test specifics, shift timings, or site-specific requirements..."
            value={pos.notes}
            onChange={(e) => handleUpdatePosition(pos.id, 'notes', e.target.value)}
          />
        </div>
      ))}

      {positions.length < 10 && (
        <button type="button" className={styles.addPositionBtn} onClick={handleAddPosition}>
          + Add Another Role Requirement
        </button>
      )}

      {/* --- Section 4: Deployment Specs --- */}
      <div className={styles.formSectionHeader}>
        <span>4. Deployment Specifications</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
        <SelectField
          id="emp-timeline"
          label="Target Deployment Timeline"
          options={TIMELINE_OPTIONS}
          value={preferredTimeline}
          onChange={(e) => setPreferredTimeline(e.target.value)}
        />

        <FormField
          id="emp-location"
          label="Site / Project Location (Optional)"
          placeholder="e.g. Dubai South, Jebel Ali Industrial"
          value={deploymentLocation}
          onChange={(e) => setDeploymentLocation(e.target.value)}
        />
      </div>

      <TextareaField
        id="emp-specialRequirements"
        label="General Project & Operational Notes (Optional)"
        placeholder="Provide any additional details regarding project scope, shift rotations, or specialized tooling requirements..."
        value={specialRequirements}
        onChange={(e) => setSpecialRequirements(e.target.value)}
      />

      {/* --- Section 5: Authority & Consent --- */}
      <div className={styles.group}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          <span>
            I confirm authority to submit this manpower requisition on behalf of the employer organization and request Cityline Consultancy to review our requirements.
          </span>
        </label>
        {errors.consent && <span className={styles.errorText} role="alert">{errors.consent}</span>}
      </div>

      <Button type="submit" size="lg" variant="primary" disabled={isSubmitting}>
        {isSubmitting ? 'Transmitting Requisition...' : 'Submit Manpower Requisition'}
      </Button>
    </form>
  );
}
