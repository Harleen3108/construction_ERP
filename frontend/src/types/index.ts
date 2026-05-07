export type UserRole =
  | 'JE' | 'SDO' | 'EE' | 'CE'
  | 'TENDER_OFFICER' | 'CONTRACTOR'
  | 'ACCOUNTANT' | 'TREASURY' | 'ADMIN';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  designation?: string;
  department?: string;
  employeeId?: string;
  companyName?: string;
  gstNumber?: string;
  panNumber?: string;
  registrationNumber?: string;
  experienceYears?: number;
  active: boolean;
  avatar?: string;
  token?: string;
  createdAt?: string;
}

export type ProjectStatus =
  | 'PROPOSED' | 'UNDER_APPROVAL' | 'SANCTIONED' | 'TENDER_CREATED'
  | 'TENDER_PUBLISHED' | 'BIDDING_OPEN' | 'BID_EVALUATION'
  | 'AWARDED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'ON_HOLD';

export interface Project {
  _id: string;
  projectId: string;
  name: string;
  description?: string;
  location: string;
  district?: string;
  state?: string;
  estimatedCost: number;
  finalCost?: number;
  projectType: string;
  fundingSource: string;
  department?: string;
  status: ProjectStatus;
  proposedBy: User | string;
  documents: any[];
  drawings: any[];
  boqFile?: any;
  approvals: any[];
  tender?: any;
  awardedTo?: User | string;
  awardedAmount?: number;
  workOrder?: any;
  startDate?: string;
  endDate?: string;
  actualEndDate?: string;
  overallProgress: number;
  proposedAt?: string;
  sanctionedAt?: string;
  awardedAt?: string;
  completedAt?: string;
  closureReport?: string;
  createdAt: string;
}

export interface Approval {
  _id: string;
  entityType: string;
  entityId: string;
  stage: 'JE' | 'SDO' | 'EE' | 'CE' | 'ACCOUNTANT' | 'TREASURY';
  order: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED';
  approver?: any;
  approverName?: string;
  approverRole?: string;
  remarks?: string;
  approvedAt?: string;
  rejectedAt?: string;
  createdAt: string;
  entity?: any;
}

export interface Tender {
  _id: string;
  tenderId: string;
  project: any;
  title: string;
  description?: string;
  estimatedCost: number;
  emd: number;
  tenderFee: number;
  status: string;
  publishDate?: string;
  bidSubmissionStartDate?: string;
  bidSubmissionEndDate?: string;
  bidOpeningDate?: string;
  boq: BOQItem[];
  documents: any[];
  technicalSpecs?: string;
  eligibilityCriteria?: string;
  bids: any[];
  l1Bid?: any;
  awardedTo?: any;
  awardedAmount?: number;
  awardedAt?: string;
}

export interface BOQItem {
  serialNo: number;
  description: string;
  unit: string;
  quantity: number;
  rate?: number;
  amount?: number;
}

export interface Bid {
  _id: string;
  tender: any;
  contractor: any;
  contractorName?: string;
  technicalDocuments: any[];
  technicalScore?: number;
  technicallyQualified?: boolean;
  technicalRemarks?: string;
  quotedAmount?: number;
  rateAnalysis?: any[];
  status: string;
  rank?: number;
  isL1: boolean;
  submittedAt?: string;
  createdAt: string;
}

export interface MeasurementBook {
  _id: string;
  mbId: string;
  project: any;
  workOrder: any;
  contractor: any;
  entryDate: string;
  workItem: string;
  location?: string;
  entries: MBEntry[];
  totalAmount: number;
  status: string;
  recordedBy: any;
  approvals: any[];
}

export interface MBEntry {
  itemNo?: number;
  description: string;
  location?: string;
  length?: number;
  width?: number;
  height?: number;
  quantity: number;
  unit: string;
  rate?: number;
  amount?: number;
  remarks?: string;
}

export interface Bill {
  _id: string;
  billId: string;
  billNumber: string;
  billType: string;
  project: any;
  workOrder: any;
  contractor: any;
  measurementBooks: any[];
  grossAmount: number;
  previousBillsTotal: number;
  currentBillAmount: number;
  gstPercent: number;
  gstAmount: number;
  tdsPercent: number;
  tdsAmount: number;
  securityPercent: number;
  securityAmount: number;
  retentionPercent: number;
  retentionAmount: number;
  otherDeductions: number;
  totalDeductions: number;
  netPayable: number;
  status: string;
  submittedAt?: string;
  approvals: any[];
  payment?: any;
  createdAt: string;
}

export interface Payment {
  _id: string;
  paymentId: string;
  bill: any;
  project: any;
  contractor: any;
  amount: number;
  paymentMode: string;
  utrNumber?: string;
  bankName?: string;
  accountNumber?: string;
  ifsc?: string;
  paymentDate: string;
  status: string;
  receiptUrl?: string;
}

export interface WorkOrder {
  _id: string;
  workOrderId: string;
  loaId: string;
  project: any;
  tender: any;
  contractor: any;
  contractorName?: string;
  awardedAmount: number;
  startDate: string;
  endDate: string;
  durationDays: number;
  agreementUrl?: string;
  loaUrl?: string;
  workOrderUrl?: string;
  acceptedByContractor: boolean;
  acceptedAt?: string;
  issuedAt: string;
}

export interface Milestone {
  _id: string;
  project: string;
  name: string;
  description?: string;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  progress: number;
  status: string;
  remarks?: string;
  photos: any[];
}
