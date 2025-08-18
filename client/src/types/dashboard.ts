export interface User {
  id: string;
  name: string;
  email: string;
  baseCurrency: string;
  kycStatus: string;
  trialDaysLeft: number;
  isTrialActive: boolean;
}

export interface NetWorth {
  current: number;
  previous30Days: number;
  change: number;
  changePercentage: number;
  trend: string;
}

export interface FxRates {
  lastRefresh: string;
  source: string;
  rates: {
    INR: number;
    USD: number;
    GBP: number;
    AED: number;
  };
}

export interface TaxInfo {
  total: number;
  dueDate: string | null;
  confidence: string;
  status: string;
}

export interface Country {
  code: string;
  name: string;
  currency: string;
  netWorth: number;
  assets: number;
  liabilities: number;
  taxes: TaxInfo;
  kycStatus: string;
  residencyStatus: string;
}

export interface AssetType {
  type: string;
  value: number;
  percentage: number;
}

export interface LiabilityType {
  type: string;
  value: number;
  percentage: number;
}

export interface Assets {
  total: number;
  byType: AssetType[];
}

export interface Liabilities {
  total: number;
  byType: LiabilityType[];
}

export interface TaxByCountry {
  country: string;
  amount: number;
  dueDate: string | null;
  confidence: string;
}

export interface Taxes {
  total: number;
  nextDueDate: string;
  byCountry: TaxByCountry[];
}

export interface NetWorthHistoryPoint {
  month: string;
  value: number;
}

export interface Reminders {
  total: number;
  nextDue: string | null;
}

export interface DashboardData {
  user: User;
  netWorth: NetWorth;
  fxRates: FxRates;
  countries: Country[];
  assets: Assets;
  liabilities: Liabilities;
  taxes: Taxes;
  netWorthHistory: NetWorthHistoryPoint[];
  reminders: Reminders;
}
