import { describe, expect, it } from 'vitest';

import { resolveRemoteFileUrl } from '@/services/file-url';

describe('resolveRemoteFileUrl', () => {
  it('derives file_key path when localUri is already a remote URL', async () => {
    const remoteUrl = 'https://storage.example.com/image/tenant-1/photo-01.jpg?signature=abc';

    const resolved = await resolveRemoteFileUrl({
      kind: 'photo',
      localUri: remoteUrl,
      mimeType: 'image/jpeg',
      fileName: 'photo-01.jpg',
    });

    expect(resolved.remoteUrl).toBe(remoteUrl);
    expect(resolved.fileKey).toBe('image/tenant-1/photo-01.jpg');
  });

  it('normalizes encoded leading slashes in remote URL path', async () => {
    const remoteUrl = 'https://storage.example.com/%2Fimage%2Ftenant-1%2Fphoto-02.jpg';

    const resolved = await resolveRemoteFileUrl({
      kind: 'photo',
      localUri: remoteUrl,
      mimeType: 'image/jpeg',
      fileName: 'photo-02.jpg',
    });

    expect(resolved.fileKey).toBe('image/tenant-1/photo-02.jpg');
  });
});
