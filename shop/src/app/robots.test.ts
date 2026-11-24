import { describe, it, expect } from 'vitest';
import robots from './robots';

describe('robots metadata route', () => {
  it('returns valid Robots configuration with allow and disallow rules', () => {
    const res = robots();
    expect(res).toBeDefined();
    expect(res.sitemap).toBe('https://proteinirany.ir/sitemap.xml');

    const rules = Array.isArray(res.rules) ? res.rules : [res.rules];
    const wildcardRule = rules.find((r) => r.userAgent === '*');
    expect(wildcardRule).toBeDefined();
    const allowRules = Array.isArray(wildcardRule?.allow)
      ? wildcardRule?.allow
      : [wildcardRule?.allow];
    expect(allowRules).toEqual(
      expect.arrayContaining(['/', '/api/shop/catalog/', '/api/shop/auth/me'])
    );
    expect(wildcardRule?.disallow).toEqual(
      expect.arrayContaining([
        '/profile',
        '/checkout',
        '/auth',
        '/track',
        '/api/',
        '/search',
      ])
    );
  });
});
