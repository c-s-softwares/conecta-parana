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
  ...jest.requireActual<object>('fs'),
  readFileSync: jest.fn(() => 'fake-private-key-content'),
}));

import { StorageService } from './storage.service';

const NAMESPACE = 'ns-test';
const BUCKET = 'bucket-test';
const REGION = 'sa-saopaulo-1';

const ENV = {
  OCI_OBJECT_STORAGE_NAMESPACE: NAMESPACE,
  OCI_BUCKET_NAME: BUCKET,
  OCI_REGION: REGION,
  OCI_TENANCY_OCID: 'ocid1.tenancy.oc1..x',
  OCI_USER_OCID: 'ocid1.user.oc1..x',
  OCI_FINGERPRINT: 'aa:bb:cc',
  OCI_PRIVATE_KEY_PATH: '/fake/path.pem',
};

const STORAGE_BASE_URL = `https://objectstorage.${REGION}.oraclecloud.com`;
const PUBLIC_URL_PREFIX = `${STORAGE_BASE_URL}/n/${NAMESPACE}/b/${BUCKET}/o/`;

const SAMPLE_KEY = 'photos/event/evt_x/pho_y.webp';
const SIMPLE_KEY = 'k.webp';
const SAMPLE_KEY_WITH_ACCENTS = 'photos/event/evt_x/foto com espaço.webp';
const SAMPLE_KEY_WITH_ACCENTS_ENCODED =
  'photos/event/evt_x/foto%20com%20espa%C3%A7o.webp';

const PAR_ACCESS_URI = '/p/abc123/n/ns-test/b/bucket-test/o/k.webp';

const buildPutObjectArgs = (
  objectName: string,
  buffer: Buffer,
  contentType = 'image/webp',
) => ({
  namespaceName: NAMESPACE,
  bucketName: BUCKET,
  objectName,
  putObjectBody: buffer,
  contentLength: buffer.length,
  contentType,
});

const buildDeleteObjectArgs = (objectName: string) => ({
  namespaceName: NAMESPACE,
  bucketName: BUCKET,
  objectName,
});

const transientError = (statusCode = 503) => ({
  statusCode,
  message: 'Service Unavailable',
});

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
  });

  describe('upload', () => {
    it('faz upload bem-sucedido e retorna URL pública', async () => {
      putObjectMock.mockResolvedValueOnce({});
      const buf = Buffer.from('image-bytes');

      const url = await service.upload(SAMPLE_KEY, buf, 'image/webp');

      expect(url).toBe(`${PUBLIC_URL_PREFIX}${SAMPLE_KEY}`);
      expect(putObjectMock).toHaveBeenCalledWith(
        buildPutObjectArgs(SAMPLE_KEY, buf),
      );
    });

    it('retry exponencial em erro transitório (503) e sucesso no terceiro attempt', async () => {
      putObjectMock
        .mockRejectedValueOnce(transientError(503))
        .mockRejectedValueOnce(transientError(502))
        .mockResolvedValueOnce({});

      const url = await service.upload(
        SIMPLE_KEY,
        Buffer.from('x'),
        'image/webp',
      );

      expect(url).toBe(`${PUBLIC_URL_PREFIX}${SIMPLE_KEY}`);
      expect(putObjectMock).toHaveBeenCalledTimes(3);
    });

    it('retry também em erros de rede (ECONNRESET)', async () => {
      putObjectMock
        .mockRejectedValueOnce(networkError())
        .mockResolvedValueOnce({});

      await service.upload(SIMPLE_KEY, Buffer.from('x'), 'image/webp');

      expect(putObjectMock).toHaveBeenCalledTimes(2);
    });

    it('esgota retries e lança ServiceUnavailableException com code storage_unavailable', async () => {
      putObjectMock.mockRejectedValue(transientError(503));

      let caught: ServiceUnavailableException | undefined;
      try {
        await service.upload(SIMPLE_KEY, Buffer.from('x'), 'image/webp');
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
        service.upload(SIMPLE_KEY, Buffer.from('x'), 'image/webp'),
      ).rejects.toBe(permanent);
      expect(putObjectMock).toHaveBeenCalledTimes(1);
    });

    it('codifica caracteres especiais na URL preservando barras', async () => {
      putObjectMock.mockResolvedValueOnce({});

      const url = await service.upload(
        SAMPLE_KEY_WITH_ACCENTS,
        Buffer.from('x'),
        'image/webp',
      );

      expect(url).toBe(
        `${PUBLIC_URL_PREFIX}${SAMPLE_KEY_WITH_ACCENTS_ENCODED}`,
      );
    });
  });

  describe('delete', () => {
    it('delete bem-sucedido', async () => {
      deleteObjectMock.mockResolvedValueOnce({});

      await service.delete(SAMPLE_KEY);

      expect(deleteObjectMock).toHaveBeenCalledWith(
        buildDeleteObjectArgs(SAMPLE_KEY),
      );
    });

    it('trata 404 como sucesso (idempotência)', async () => {
      deleteObjectMock.mockRejectedValueOnce({ statusCode: 404 });

      await expect(service.delete(SIMPLE_KEY)).resolves.toBeUndefined();
    });

    it('propaga erro permanente diferente de 404', async () => {
      const err = { statusCode: 403, message: 'Forbidden' };
      deleteObjectMock.mockRejectedValueOnce(err);

      await expect(service.delete(SIMPLE_KEY)).rejects.toBe(err);
    });

    it('retry em transitório e lança STORAGE_UNAVAILABLE se esgotar', async () => {
      deleteObjectMock.mockRejectedValue(transientError(503));

      await expect(service.delete(SIMPLE_KEY)).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });

  describe('getSignedUrl', () => {
    it('gera PAR e devolve URL completa', async () => {
      createPARMock.mockResolvedValueOnce({
        preauthenticatedRequest: { accessUri: PAR_ACCESS_URI },
      });

      const url = await service.getSignedUrl(SIMPLE_KEY, 3600);

      expect(url).toBe(`${STORAGE_BASE_URL}${PAR_ACCESS_URI}`);
      const [firstCallArg] = createPARMock.mock.calls[0] as [
        {
          createPreauthenticatedRequestDetails: {
            objectName: string;
            accessType: string;
          };
        },
      ];
      expect(firstCallArg.createPreauthenticatedRequestDetails.objectName).toBe(
        SIMPLE_KEY,
      );
      expect(firstCallArg.createPreauthenticatedRequestDetails.accessType).toBe(
        'ObjectRead',
      );
    });
  });
});
