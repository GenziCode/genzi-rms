/**
 * Comprehensive Logging System
 * Tracks user activity, device info, security events, and system health
 */

interface DeviceInfo {
  userAgent: string;
  platform: string;
  language: string;
  screenResolution: string;
  timezone: string;
  cookieEnabled: boolean;
  onLine: boolean;
  deviceMemory?: number;
  hardwareConcurrency?: number;
}

interface LocationInfo {
  timezone: string;
  timezoneOffset: number;
  locale: string;
  coords?: {
    latitude: number;
    longitude: number;
  };
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'security' | 'audit';
  category: string;
  action: string;
  userId?: string;
  tenantId?: string;
  deviceInfo: DeviceInfo;
  locationInfo: LocationInfo;
  data?: any;
  url: string;
  referrer: string;
  sessionId: string;
}

class Logger {
  private sessionId: string;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeSession();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  private getDeviceInfo(): DeviceInfo {
    const nav = navigator as any;
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      deviceMemory: nav.deviceMemory,
      hardwareConcurrency: navigator.hardwareConcurrency,
    };
  }

  private getLocationInfo(): LocationInfo {
    const now = new Date();
    return {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: now.getTimezoneOffset(),
      locale: navigator.language,
    };
  }

  private async fetchGeolocation(): Promise<LocationInfo> {
    const locationInfo = this.getLocationInfo();

    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            enableHighAccuracy: false,
          });
        });

        locationInfo.coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
      } catch (error) {
        // Geolocation not available or denied
      }
    }

    return locationInfo;
  }

  private async createLogEntry(
    level: LogEntry['level'],
    category: string,
    action: string,
    data?: any
  ): Promise<LogEntry> {
    const entry: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
      level,
      category,
      action,
      deviceInfo: this.getDeviceInfo(),
      locationInfo: await this.fetchGeolocation(),
      data,
      url: window.location.href,
      referrer: document.referrer,
      sessionId: this.sessionId,
    };

    // Add user context if available
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      try {
        const auth = JSON.parse(authStorage);
        if (auth.state?.user) {
          entry.userId = auth.state.user._id;
          entry.tenantId = auth.state.tenantId || auth.state.tenant;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }

    return entry;
  }

  private saveLog(entry: LogEntry) {
    this.logs.push(entry);

    // Trim logs if exceeding max
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Save to localStorage for persistence (last 100 logs)
    try {
      const recentLogs = this.logs.slice(-100);
      localStorage.setItem('app-logs', JSON.stringify(recentLogs));
    } catch (e) {
      // Storage full, clear old logs
      localStorage.removeItem('app-logs');
    }

    // Send to backend (in production)
    if (entry.level === 'error' || entry.level === 'security') {
      this.sendToBackend(entry);
    }
  }

  private async sendToBackend(entry: LogEntry) {
    try {
      // In production, send to logging API
      // await api.post('/logs', entry);
      console.log('Would send to backend:', entry);
    } catch (error) {
      // Failed to send log, store locally
    }
  }

  private initializeSession() {
    this.info('session', 'session_started', {
      previousSession: sessionStorage.getItem('previous_session'),
      pageLoadTime: performance.now(),
    });

    sessionStorage.setItem('previous_session', this.sessionId);

    // Track page visibility
    document.addEventListener('visibilitychange', () => {
      this.info('session', 'visibility_changed', {
        hidden: document.hidden,
      });
    });

    // Track network status
    window.addEventListener('online', () => {
      this.info('network', 'status_changed', { online: true });
    });

    window.addEventListener('offline', () => {
      this.warn('network', 'status_changed', { online: false });
    });

    // Track unload
    window.addEventListener('beforeunload', () => {
      this.info('session', 'session_ended', {
        duration: performance.now(),
      });
    });
  }

  // Public logging methods
  async info(category: string, action: string, data?: any) {
    const entry = await this.createLogEntry('info', category, action, data);
    this.saveLog(entry);
    console.log(`ℹ️ [${category}] ${action}`, data);
  }

  async warn(category: string, action: string, data?: any) {
    const entry = await this.createLogEntry('warn', category, action, data);
    this.saveLog(entry);
    console.warn(`⚠️ [${category}] ${action}`, data);
  }

  async error(category: string, action: string, error: any, data?: any) {
    const entry = await this.createLogEntry('error', category, action, {
      error: {
        message: error?.message || String(error),
        stack: error?.stack,
        name: error?.name,
      },
      ...data,
    });
    this.saveLog(entry);
    console.error(`❌ [${category}] ${action}`, error, data);
  }

  async security(action: string, data?: any) {
    const entry = await this.createLogEntry('security', 'security', action, data);
    this.saveLog(entry);
    console.warn(`🔒 [SECURITY] ${action}`, data);
  }

  async audit(action: string, data?: any) {
    const entry = await this.createLogEntry('audit', 'audit', action, data);
    this.saveLog(entry);
    console.log(`📋 [AUDIT] ${action}`, data);
  }

  // Specialized logging methods
  async trackPageView(page: string) {
    await this.info('navigation', 'page_view', {
      page,
      loadTime: performance.now(),
    });
  }

  async trackUserAction(action: string, details?: any) {
    await this.info('user_action', action, details);
  }

  async trackApiCall(method: string, url: string, status: number, duration: number) {
    await this.info('api', 'api_call', {
      method,
      url,
      status,
      duration,
    });
  }

  async trackError(error: Error, context?: string) {
    await this.error('application', context || 'unhandled_error', error);
  }

  async trackSecurityEvent(event: string, details?: any) {
    await this.security(event, details);
  }

  // Get logs
  getLogs(filter?: Partial<LogEntry>): LogEntry[] {
    if (!filter) return this.logs;

    return this.logs.filter((log) => {
      return Object.entries(filter).every(([key, value]) => {
        return log[key as keyof LogEntry] === value;
      });
    });
  }

  // Export logs
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
    localStorage.removeItem('app-logs');
    this.info('system', 'logs_cleared');
  }
}

// Create singleton instance
export const logger = new Logger();

// Export for use in components
export default logger;

