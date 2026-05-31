import type { OnboardingStatus } from '../../types';

export const ONBOARDING_BADGE: Record<OnboardingStatus, { label: string; cls: string }> = {
  application_received: { label: 'Applied',      cls: 'bg-gray-100 text-gray-600' },
  interview_scheduled:  { label: 'Interview',    cls: 'bg-blue-100 text-blue-700' },
  hired:                { label: 'Hired',        cls: 'bg-emerald-100 text-emerald-700' },
  not_accepted:         { label: 'Not Accepted', cls: 'bg-red-100 text-red-600' },
};

export const NEXT_TRANSITIONS: Record<OnboardingStatus, { value: OnboardingStatus; label: string }[]> = {
  application_received: [
    { value: 'interview_scheduled', label: 'Schedule Interview' },
    { value: 'not_accepted',        label: 'Mark Not Accepted' },
  ],
  interview_scheduled: [
    { value: 'hired',        label: 'Hire' },
    { value: 'not_accepted', label: 'Mark Not Accepted' },
  ],
  hired: [
    { value: 'not_accepted', label: 'Rescind Offer' },
  ],
  not_accepted: [
    { value: 'application_received', label: 'Reconsider' },
  ],
};
