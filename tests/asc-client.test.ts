import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock auth module
vi.mock('../src/core/auth', () => ({
  loadCredentials: vi.fn(() => ({
    keyId: 'KEY',
    issuerId: 'ISSUER',
    privateKeyPath: '/tmp/key.p8',
  })),
  generateToken: vi.fn(() => 'mock-token'),
}));

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('asc-client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('apiRequest', () => {
    it('makes authenticated GET request', async () => {
      const { apiRequest } = await import('../src/core/asc-client');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ data: [] })),
      });

      const result = await apiRequest('GET', '/apps');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.appstoreconnect.apple.com/v1/apps',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-token',
          }),
        })
      );
      expect(result).toEqual({ data: [] });
    });

    it('makes POST request with body', async () => {
      const { apiRequest } = await import('../src/core/asc-client');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ data: { id: '1' } })),
      });

      const body = { data: { type: 'test', attributes: { name: 'Test' } } };
      await apiRequest('POST', '/test', body);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(body),
        })
      );
    });

    it('throws on API error', async () => {
      const { apiRequest } = await import('../src/core/asc-client');

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: () => Promise.resolve('Forbidden'),
      });

      await expect(apiRequest('GET', '/apps')).rejects.toThrow('API error [403]');
    });

    it('uses full URL when provided', async () => {
      const { apiRequest } = await import('../src/core/asc-client');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ data: [] })),
      });

      await apiRequest('GET', 'https://custom.api.com/v1/test');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://custom.api.com/v1/test',
        expect.any(Object)
      );
    });
  });

  describe('fetchAll', () => {
    it('follows pagination links', async () => {
      const { fetchAll } = await import('../src/core/asc-client');

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(JSON.stringify({
            data: [{ id: '1' }],
            links: { next: 'https://api.appstoreconnect.apple.com/v1/apps?cursor=2' },
          })),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(JSON.stringify({
            data: [{ id: '2' }],
            links: {},
          })),
        });

      const result = await fetchAll('/apps');
      expect(result).toEqual([{ id: '1' }, { id: '2' }]);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('uploadBinary', () => {
    it('uploads buffer with PUT', async () => {
      const { uploadBinary } = await import('../src/core/asc-client');

      mockFetch.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('') });

      const data = Buffer.from('test-image-data');
      await uploadBinary('https://upload.example.com/file', data);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://upload.example.com/file',
        expect.objectContaining({
          method: 'PUT',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: data,
        })
      );
    });

    it('throws on upload failure', async () => {
      const { uploadBinary } = await import('../src/core/asc-client');

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Server Error'),
      });

      await expect(
        uploadBinary('https://upload.example.com/file', Buffer.from('data'))
      ).rejects.toThrow('Upload failed [500]');
    });
  });
});
