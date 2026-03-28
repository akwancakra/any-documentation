"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { 
  LoginLogData, 
  LoginLogResponse, 
  LoginLogFilters, 
  LoginLogStats 
} from '@/lib/login-log-types';

export function useLoginLogs(initialFilters: LoginLogFilters = {}) {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<LoginLogData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<LoginLogFilters>(initialFilters);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  // Check if user has admin access
  const hasAdminAccess = session?.user && (session.user as any).role === 'admin';

  const fetchLogs = useCallback(async (newFilters?: LoginLogFilters) => {
    if (!hasAdminAccess) {
      setError("Access denied. Admin role required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const activeFilters = newFilters || filters;
      const searchParams = new URLSearchParams();

      // Add filters to search params
      if (activeFilters.page) searchParams.set('page', activeFilters.page.toString());
      if (activeFilters.limit) searchParams.set('limit', activeFilters.limit.toString());
      if (activeFilters.success !== null && activeFilters.success !== undefined) {
        searchParams.set('success', activeFilters.success.toString());
      }
      if (activeFilters.provider) searchParams.set('provider', activeFilters.provider);
      if (activeFilters.startDate) searchParams.set('startDate', activeFilters.startDate);
      if (activeFilters.endDate) searchParams.set('endDate', activeFilters.endDate);

      const response = await fetch(`/api/login-log?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: LoginLogResponse = await response.json();
      
      setLogs(data.logs);
      setPagination(data.pagination);
      
      if (newFilters) {
        setFilters(newFilters);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch logs");
      console.error('Error fetching login logs:', err);
    } finally {
      setLoading(false);
    }
  }, [hasAdminAccess, filters]);

  // Update filters and fetch
  const updateFilters = useCallback((newFilters: Partial<LoginLogFilters>) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 }; // Reset to page 1
    fetchLogs(updatedFilters);
  }, [filters, fetchLogs]);

  // Change page
  const changePage = useCallback((page: number) => {
    const newFilters = { ...filters, page };
    fetchLogs(newFilters);
  }, [filters, fetchLogs]);

  // Refresh logs
  const refresh = useCallback(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Clear filters
  const clearFilters = useCallback(() => {
    const clearedFilters: LoginLogFilters = { page: 1, limit: filters.limit || 50 };
    fetchLogs(clearedFilters);
  }, [fetchLogs, filters.limit]);

  // Auto-fetch when session changes
  useEffect(() => {
    if (hasAdminAccess) {
      fetchLogs();
    }
  }, [hasAdminAccess, fetchLogs]);

  return {
    logs,
    loading,
    error,
    filters,
    pagination,
    hasAdminAccess,
    updateFilters,
    changePage,
    refresh,
    clearFilters,
  };
}

export function useLoginLogStats() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<LoginLogStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasAdminAccess = session?.user && (session.user as any).role === 'admin';

  const fetchStats = useCallback(async () => {
    if (!hasAdminAccess) {
      setError("Access denied. Admin role required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch all logs to calculate stats
      const response = await fetch('/api/login-log?limit=1000'); // Get more data for stats
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: LoginLogResponse = await response.json();
      const logs = data.logs;

      // Calculate stats
      const totalLogins = logs.length;
      const successfulLogins = logs.filter(log => log.success).length;
      const failedLogins = totalLogins - successfulLogins;
      const successRate = totalLogins > 0 ? (successfulLogins / totalLogins) * 100 : 0;
      
      const uniqueUsers = new Set(logs.map(log => log.user.email)).size;

      // Top browsers
      const browserCounts = logs.reduce((acc, log) => {
        acc[log.requestInfo.browser] = (acc[log.requestInfo.browser] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const topBrowsers = Object.entries(browserCounts)
        .map(([browser, count]) => ({ browser, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Top OS
      const osCounts = logs.reduce((acc, log) => {
        acc[log.requestInfo.os] = (acc[log.requestInfo.os] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const topOS = Object.entries(osCounts)
        .map(([os, count]) => ({ os, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Top devices
      const deviceCounts = logs.reduce((acc, log) => {
        acc[log.requestInfo.device] = (acc[log.requestInfo.device] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const topDevices = Object.entries(deviceCounts)
        .map(([device, count]) => ({ device, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      // Logins by provider
      const providerCounts = logs.reduce((acc, log) => {
        acc[log.provider] = (acc[log.provider] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const loginsByProvider = Object.entries(providerCounts)
        .map(([provider, count]) => ({ provider, count }));

      // Recent activity (last 10)
      const recentActivity = logs.slice(0, 10);

      const calculatedStats: LoginLogStats = {
        totalLogins,
        successfulLogins,
        failedLogins,
        successRate,
        uniqueUsers,
        topBrowsers,
        topOS,
        topDevices,
        loginsByProvider,
        recentActivity,
      };

      setStats(calculatedStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch log statistics");
      console.error('Error fetching login log stats:', err);
    } finally {
      setLoading(false);
    }
  }, [hasAdminAccess]);

  useEffect(() => {
    if (hasAdminAccess) {
      fetchStats();
    }
  }, [hasAdminAccess, fetchStats]);

  return {
    stats,
    loading,
    error,
    hasAdminAccess,
    refresh: fetchStats,
  };
} 