export type Role = 'CANDIDATE' | 'RECRUITER' | 'PLATFORM_ADMINISTRATOR';
export type UserStatus = 'ACTIVE' | 'PENDING' | 'REJECTED' | 'INACTIVE';

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword?: string;
  fullName: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface TokenResponse {
  accessToken: string;
  tokenType: string;
  expiresAt: string;
}

export interface UserView {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  role: Role;
  status: UserStatus;
  createdAt?: string;
}

export interface Business {
  id: string;
  ownerUserId: string;
  name: string;
  description?: string;
  website?: string;
  industry?: string;
  address?: string;
  city?: string;
  country?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
}
export type BusinessRequest = Pick<Business, 'name' | 'description' | 'website' | 'industry' | 'address' | 'city' | 'country'>;

export interface Job {
  id: string;
  businessId: string;
  createdByUserId: string;
  title: string;
  description: string;
  location: string;
  contractType: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'EXPIRED' | 'DELETED';
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  expiresAt?: string;
}
export type JobRequest = Pick<Job, 'businessId' | 'title' | 'description' | 'location' | 'contractType' | 'expiresAt'>;

export interface Application {
  id: string;
  jobId: string;
  candidateId: string;
  candidateCvId: string;
  message?: string;
  status: 'PENDING' | 'REVIEWING' | 'INTERVIEW' | 'HIRED' | 'REJECTED' | 'UNAVAILABLE';
  createdAt: string;
  updatedAt: string;
}

export interface CandidateCv {
  id: string;
  candidateId: string;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
  status: 'ACTIVE' | 'DELETED';
  uploadedAt: string;
  deletedAt?: string;
}

export interface CvAnalysis {
  id: string;
  cvId: string;
  analysisType: string;
  provider: string;
  model: string;
  score: number;
  skills: string[];
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
  createdAt: string;
}

export interface JobRecommendation {
  jobId: string;
  title: string;
  location?: string;
  score: number;
  reason: string;
}

export interface Notification {
  id: string;
  recipientUserId: string;
  sourceEventId?: string;
  eventType?: string;
  type: string;
  title: string;
  content: string;
  readAt?: string;
  createdAt: string;
}

export type SubscriptionAudience = 'CANDIDATE' | 'RECRUITER';
export type SubscriptionStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED' | 'SUSPENDED';
export interface SubscriptionPlan {
  id: string;
  planCode: string;
  displayName: string;
  description?: string;
  audience: SubscriptionAudience;
  price: number;
  currency: string;
  billingPeriodDays: number;
  trialDays: number;
  active: boolean;
  features: string[];
  createdAt?: string;
  updatedAt?: string;
}
export type PlanRequest = Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>;
export interface Subscription {
  id: string;
  ownerId: string;
  audience: SubscriptionAudience;
  planCode: string;
  planName: string;
  status: SubscriptionStatus;
  startsAt: string;
  endsAt: string;
  cancelledAt?: string;
  autoRenew: boolean;
  pendingPlanCode?: string;
  changeEffectiveAt?: string;
  createdAt?: string;
}
export interface SubscriptionHistory {
  id: string;
  subscriptionId: string;
  action: string;
  fromStatus?: string;
  toStatus: string;
  fromPlanCode?: string;
  toPlanCode?: string;
  details?: string;
  occurredAt: string;
}
export interface Invoice {
  id: string;
  subscriptionId: string;
  planCode: string;
  amount: number;
  currency: string;
  status: 'PAID' | 'FAILED' | 'VOID';
  issuedAt: string;
}

export interface Interview {
  id: string;
  applicationId: string;
  candidateId: string;
  recruiterId: string;
  jobId?: string;
  scheduledAt: string;
  externalMeetingUrl?: string;
  status: string;
}

export interface AnalyticsOverview {
  publishedJobs: number;
  closedJobs: number;
  applications: number;
  interviews: number;
  hires: number;
  applicationsByStatus: Record<string, number>;
  generatedAt: string;
}
export interface OfferMetric {
  jobId: string;
  title: string;
  status: string;
  applications: number;
  lastActivityAt: string;
}
export interface ApplicationMetric {
  status: string;
  count: number;
  lastActivityAt: string;
}

export interface Page<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}
export interface JwtPayload {
  sub?: string;
  user_id?: string;
  roles?: Role[];
  exp?: number;
  iss?: string;
}
