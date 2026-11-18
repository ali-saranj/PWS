import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAuthStore } from './authStore';
import { api } from './api';

describe('authStore - checkAuth', () => {
  const originalUserAgent = navigator.userAgent;

  beforeEach(() => {
    useAuthStore.setState({
      customer: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    vi.restoreAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true,
    });
  });

  it('skips checkAuth network request when user agent is Googlebot', async () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      configurable: true,
    });

    const apiSpy = vi.spyOn(api, 'get');
    const result = await useAuthStore.getState().checkAuth();

    expect(result).toBeNull();
    expect(apiSpy).not.toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('skips checkAuth network request when user agent is Google-InspectionTool', async () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Mobile Safari/537.36 (compatible; Google-InspectionTool/1.0)',
      configurable: true,
    });

    const apiSpy = vi.spyOn(api, 'get');
    const result = await useAuthStore.getState().checkAuth();

    expect(result).toBeNull();
    expect(apiSpy).not.toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('performs checkAuth network request for regular browser user agent', async () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      configurable: true,
    });

    const apiSpy = vi.spyOn(api, 'get').mockResolvedValueOnce({
      id: 1,
      mobile: '09121112233',
      firstName: 'علی',
      lastName: 'تست',
    } as any);

    const result = await useAuthStore.getState().checkAuth();

    expect(apiSpy).toHaveBeenCalledWith('/api/shop/auth/me');
    expect(result).toEqual(expect.objectContaining({ id: 1, mobile: '09121112233' }));
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });
});
