// Types for the login log system

import { formatLoginLogTime } from "@/lib/formatters";

export interface LoginLogData {
  event: string;
  success: boolean;
  user: {
    id?: string;
    email?: string;
    name?: string;
    role?: string;
  };
  provider: string;
  requestInfo: {
    ip: string;
    userAgent: string;
    browser: string;
    os: string;
    device: string;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    timestamp: string;
    headers: {
      forwarded?: string | null;
      realIp?: string | null;
      host?: string | null;
      referer?: string | null;
    };
  };
  sessionId: string;
}

export interface LoginLogResponse {
  logs: LoginLogData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    success?: string | null;
    provider?: string | null;
    startDate?: string | null;
    endDate?: string | null;
  };
}

export interface LoginLogFilters {
  page?: number;
  limit?: number;
  success?: boolean | null;
  /** Filter by auth provider (e.g. credentials, error; legacy logs may differ) */
  provider?: string | null;
  startDate?: string;
  endDate?: string;
}

export interface LoginLogStats {
  totalLogins: number;
  successfulLogins: number;
  failedLogins: number;
  successRate: number;
  uniqueUsers: number;
  topBrowsers: Array<{ browser: string; count: number }>;
  topOS: Array<{ os: string; count: number }>;
  topDevices: Array<{ device: string; count: number }>;
  loginsByProvider: Array<{ provider: string; count: number }>;
  recentActivity: LoginLogData[];
}

// Utility functions
export const formatLoginTime = formatLoginLogTime;

export const getDeviceIcon = (device: string): string => {
  switch (device.toLowerCase()) {
    case 'mobile':
      return '📱';
    case 'tablet':
      return '📱';
    case 'desktop':
      return '💻';
    default:
      return '🖥️';
  }
};

export const getBrowserIcon = (browser: string): string => {
  switch (browser.toLowerCase()) {
    case 'chrome':
      return '🌐';
    case 'firefox':
      return '🦊';
    case 'safari':
      return '🧭';
    case 'edge':
      return '🌍';
    case 'opera':
      return '🎭';
    default:
      return '🌐';
  }
};

export const getOSIcon = (os: string): string => {
  switch (os.toLowerCase()) {
    case 'windows':
      return '🪟';
    case 'macos':
      return '🍎';
    case 'linux':
      return '🐧';
    case 'android':
      return '🤖';
    case 'ios':
      return '📱';
    default:
      return '💻';
  }
};

export const getStatusColor = (success: boolean): string => {
  return success ? 'text-green-600' : 'text-red-600';
};

export const getStatusBadgeColor = (success: boolean): string => {
  return success 
    ? 'bg-green-100 text-green-800' 
    : 'bg-red-100 text-red-800';
}; 