import { describe, expect, it } from 'vitest';

import type { AttachmentItem } from '@/types/attachments';
import {
  getAllowedAttachmentKinds,
  isAttachmentKindAllowed,
  resolvePrimaryPdfAttachment,
  resolvePrimaryImagePayload,
} from '@/utils/attachment-rules';

function buildPhotoAttachment(
  payload: AttachmentItem['backendPayload'],
  status: AttachmentItem['status'] = 'success',
): AttachmentItem {
  return {
    id: 'att-1',
    context: 'meal',
    kind: 'photo',
    name: 'foto.jpg',
    uri: 'file:///foto.jpg',
    mimeType: 'image/jpeg',
    status,
    backendPayload: payload,
  };
}

describe('attachment rules', () => {
  it('returns only photo for meal context', () => {
    expect(getAllowedAttachmentKinds('meal')).toEqual(['photo']);
    expect(isAttachmentKindAllowed('meal', 'pdf')).toBe(false);
    expect(isAttachmentKindAllowed('meal', 'photo')).toBe(true);
  });

  it('prioritizes inline base64 image when available', () => {
    const attachments: AttachmentItem[] = [
      buildPhotoAttachment({
        transport: 'remote_url',
        url: 'https://cdn.vidasync.com/existing.jpg',
      }),
      buildPhotoAttachment({
        transport: 'inline_base64',
        data: 'data:image/jpeg;base64,AAA',
        mimeType: 'image/jpeg',
      }),
    ];

    expect(resolvePrimaryImagePayload(attachments)).toBe('data:image/jpeg;base64,AAA');
  });

  it('falls back to remote url when no inline image exists', () => {
    const attachments: AttachmentItem[] = [
      buildPhotoAttachment({
        transport: 'remote_url',
        url: 'https://cdn.vidasync.com/existing.jpg',
      }),
    ];

    expect(resolvePrimaryImagePayload(attachments)).toBe('https://cdn.vidasync.com/existing.jpg');
  });

  it('returns null when there is no successful photo', () => {
    const attachments: AttachmentItem[] = [
      buildPhotoAttachment(
        {
          transport: 'inline_base64',
          data: 'data:image/jpeg;base64,AAA',
          mimeType: 'image/jpeg',
        },
        'error',
      ),
    ];

    expect(resolvePrimaryImagePayload(attachments)).toBeNull();
  });

  it('selects first successful pdf attachment for upload', () => {
    const attachments: AttachmentItem[] = [
      {
        id: 'pdf-1',
        context: 'plan',
        kind: 'pdf',
        name: 'plano.pdf',
        uri: 'file:///plano.pdf',
        mimeType: 'application/pdf',
        status: 'success',
        backendPayload: {
          transport: 'file_reference',
          uri: 'file:///plano.pdf',
          fileName: 'plano.pdf',
          mimeType: 'application/pdf',
        },
      },
    ];

    expect(resolvePrimaryPdfAttachment(attachments)?.name).toBe('plano.pdf');
  });
});
