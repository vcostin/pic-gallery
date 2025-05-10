// Mock for next/navigation
const useRouter = () => ({
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  pathname: '/test',
  query: {},
});

const useSearchParams = () => ({
  get: jest.fn(),
  getAll: jest.fn(),
});

const usePathname = () => '/test';
const redirect = jest.fn();

module.exports = {
  useRouter,
  useSearchParams,
  usePathname,
  redirect,
};
