import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';

const putObjectMock = jest.fn();
const deleteObjectMock = jest.fn();
const createPARMock = jest.fn();

jest.mock('oci-objectstorage', () => ({
  ObjectStorageClient: jest.fn().mockImplementation(() => ({
    putObject: putObjectMock,
    deleteObject: deleteObjectMock,
    createPreauthenticatedRequest: createPARMock,
  })),
  models: {
    CreatePreauthenticatedRequestDetails: {
      AccessType: { ObjectRead: 'ObjectRead' },
    },
  },
}));

jest.mock('oci-common', () => ({
  SimpleAuthenticationDetailsProvider: jest.fn(),
  Region: { fromRegionId: jest.fn((id: string) => ({ regionId: id })) },
}));

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readFileSync: jest.fn(() => 'fake-private-key-content'),
}));

import { StorageService } from './storage.service';

const ENV = {
  OCI_OBJECT_STORAGE_NAMESPACE: 'ns-test',
  OCI_BUCKET_NAME: 'bucket-test',
  OCI_REGION: 'sa-saopaulo-1',
  OCI_TENANCY_OCID: 'ocid1.tenancy.oc1..x',
  OCI_USER_OCID: 'ocid1.user.oc1..x',
  OCI_FINGERPRINT: 'aa:bb:cc',
  OCI_PRIVATE_KEY_PATH: '/fake/path.pem',
};

const transientError = (statusCode = 503) => {
  const err: { statusCode: number; message: string } = {
    statusCode,
    message: 'Service Unavailable',
  };
  return err;
};

const networkError = (): NodeJS.ErrnoException => {
  const err = new Error('connection reset') as NodeJS.ErrnoException;
  err.code = 'ECONNRESET';
  return err;
};

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: keyof typeof ENV) => ENV[key]),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(StorageService);
    service.onModuleInit();
  });

  describe('upload', () => {
    it('faz upload bem-sucedido e retorna URL pública', async () => {
      putObjectMock.mockResolvedValueOnce({});
      const buf = Buffer.from('image-bytes');

      const url = await service.upload(
        'photos/event/evt_x/pho_y.webp',
        buf,
        'image/webp',
      );

      expect(url).toBe(
        'https://objectstorage.sa-saopaulo-1.oraclecloud.com/n/ns-test/b/bucket-test/o/photos/event/evt_x/pho_y.webp',
      );
      expect(putObjectMock).toHaveBeenCalledWith({
        namespaceName: 'ns-test',
        bucketName: 'bucket-test',
        objectName: 'photos/event/evt_x/pho_y.webp',
        putObjectBody: buf,
        contentLength: buf.length,
        contentType: 'image/webp',
      });
    });

    it('retry exponencial em erro transitório (503) e sucesso no terceiro attempt', async () => {
      putObjectMock
        .mockRejectedValueOnce(transientError(503))
        .mockRejectedValueOnce(transientError(502))
        .mockResolvedValueOnce({});

      const url = await service.upload('k.webp', Buffer.from('x'), 'image/webp');

      expect(url).toContain('/o/k.webp');
      expect(putObjectMock).toHaveBeenCalledTimes(3);
    });

    it('retry também em erros de rede (ECONNRESET)', async () => {
      putObjectMock
        .mockRejectedValueOnce(networkError())
        .mockResolvedValueOnce({});

      await service.upload('k.webp', Buffer.from('x'), 'image/webp');

      expect(putObjectMock).toHaveBeenCalledTimes(2);
    });

    it('esgota retries e lança ServiceUnavailableException com code storage_unavailable', async () => {
      putObjectMock.mockRejectedValue(transientError(503));

      let caught: ServiceUnavailableException | undefined;
      try {
        await service.upload('k.webp', Buffer.from('x'), 'image/webp');
      } catch (err) {
        caught = err as ServiceUnavailableException;
      }

      expect(caught).toBeInstanceOf(ServiceUnavailableException);
      expect(putObjectMock).toHaveBeenCalledTimes(3);

      const body = caught!.getResponse() as { code: string; message: string };
      expect(body.code).toBe('storage_unavailable');
    });

    it('não faz retry em erro permanente (4xx) - propaga direto', async () => {
      const permanent = { statusCode: 403, message: 'Forbidden' };
      putObjectMock.mockRejectedValueOnce(permanent);

      await expect(
        service.upload('k.webp', Buffer.from('x'), 'image/webp'),
      ).rejects.toBe(permanent);
      expect(putObjectMock).toHaveBeenCalledTimes(1);
    });

    it('codifica caracteres especiais na URL preservando barras', async () => {
      putObjectMock.mockResolvedValueOnce({});

      const url = await service.upload(
        'photos/event/evt_x/foto com espaço.webp',
        Buffer.from('x'),
        'image/webp',
      );

      expect(url).toContain(
        '/o/photos/event/evt_x/foto%20com%20espa%C3%A7o.webp',
      );
    });
  });

  describe('delete', () => {
    it('delete bem-sucedido', async () => {
      deleteObjectMock.mockResolvedValueOnce({});

      await service.delete('photos/event/evt_x/pho_y.webp');

      expect(deleteObjectMock).toHaveBeenCalledWith({
        namespaceName: 'ns-test',
        bucketName: 'bucket-test',
        objectName: 'photos/event/evt_x/pho_y.webp',
      });
    });

    it('trata 404 como sucesso (idempotência)', async () => {
      deleteObjectMock.mockRejectedValueOnce({ statusCode: 404 });

      await expect(service.delete('k.webp')).resolves.toBeUndefined();
    });

    it('propaga erro permanente diferente de 404', async () => {
      const err = { statusCode: 403, message: 'Forbidden' };
      deleteObjectMock.mockRejectedValueOnce(err);

      await expect(service.delete('k.webp')).rejects.toBe(err);
    });

    it('retry em transitório e lança STORAGE_UNAVAILABLE se esgotar', async () => {
      deleteObjectMock
        .mockRejectedValueOnce(transientError(503))
        .mockRejectedValueOnce(transientError(503))
        .mockRejectedValueOnce(transientError(503));

      await expect(service.delete('k.webp')).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });

  describe('getSignedUrl', () => {
    it('gera PAR e devolve URL completa', async () => {
      createPARMock.mockResolvedValueOnce({
        preauthenticatedRequest: {
          accessUri: '/p/abc123/n/ns-test/b/bucket-test/o/k.webp',
        },
      });

      const url = await service.getSignedUrl('k.webp', 3600);

      expect(url).toBe(
        'https://objectstorage.sa-saopaulo-1.oraclecloud.com/p/abc123/n/ns-test/b/bucket-test/o/k.webp',
      );
      expect(createPARMock).toHaveBeenCalledWith(
        expect.objectContaining({
          createPreauthenticatedRequestDetails: expect.objectContaining({
            objectName: 'k.webp',
            accessType: 'ObjectRead',
          }),
        }),
      );
    });
  });
});
