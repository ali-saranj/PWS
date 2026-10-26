import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import AuthPage from './page';

const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: vi.fn(),
  }),
}));

describe('AuthPage redirect', () => {
  it('redirects to /profile on mount', () => {
    render(<AuthPage />);
    expect(mockReplace).toHaveBeenCalledWith('/profile');
  });
});
