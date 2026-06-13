import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Test } from '@nestjs/testing';

async function expectApiErrorCode(
  promiseFactory: () => Promise<unknown>,
  expectedCode: string,
): Promise<void> {
  try {
    await promiseFactory();
  } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const body = (err as HttpException).getResponse() as { code: string };
    expect(body.code).toBe(expectedCode);
    return;
  }
  throw new Error(
    `expectApiErrorCode: promise não rejeitou (esperado code "${expectedCode}")`,
  );
}

jest.mock('sharp', () => {
  const chain = {
    resize: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('resized-bytes')),
  };
  return jest.fn(() => chain);
});

import { UploadsService } from './uploads.service';
import { StorageService } from '../storage/storage.service';
import { PrismaService } from '../../config/prisma.service';

const CITY_PAIC = 'cit_paic';
const CITY_OUTRA = 'cit_outra';
const EVENT_ID = 'evt_x';
const EVENT_ID_OTHER = 'evt_y';
const TICKET_ID = 'tkt_x';
const PHOTO_ID = 'pho_x';
const PHOTO_ID_OTHER = 'pho_y';
const PHOTO_ID_NEW = 'pho_z';
const PHOTO_ID_OLD = 'pho_old';

const STORAGE_PREFIX = 'https://obj/o/';
const evtUrl = (id: string, isThumb = false) =>
  `${STORAGE_PREFIX}photos/event/${EVENT_ID}/${id}${isThumb ? '-thumb' : ''}.webp`;
const avatarUrl = (userSub: string, id: string, isThumb = false) =>
  `${STORAGE_PREFIX}photos/user_avatar/${userSub}/${id}${isThumb ? '-thumb' : ''}.webp`;

const ADMIN_USER = {
  sub: 'usr_admin',
  role: Role.ADMIN,
  cityId: CITY_PAIC,
  email: 'a@b.c',
};

const CIDADAO_USER = {
  sub: 'usr_cit',
  role: Role.CIDADAO,
  cityId: CITY_PAIC,
  email: 'c@d.e',
};

const buildFakeJpeg = (size = 1024): Express.Multer.File =>
  ({
    fieldname: 'file',
    originalname: 'foto.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size,
    buffer: Buffer.from('jpeg-bytes'),
    stream: undefined as never,
    destination: '',
    filename: '',
    path: '',
  }) as Express.Multer.File;

const buildPhoto = (
  overrides: Partial<{
    id: string;
    url: string;
    thumbUrl: string | null;
    userId: string;
    eventId: string | null;
    localId: string | null;
    ticketId: string | null;
  }> = {},
) => ({
  id: PHOTO_ID,
  url: evtUrl(PHOTO_ID),
  thumbUrl: evtUrl(PHOTO_ID, true),
  userId: ADMIN_USER.sub,
  eventId: null,
  localId: null,
  ticketId: null,
  ...overrides,
});

const EVENT_UPLOAD_DTO = { entityType: 'event' as const, entityId: EVENT_ID };
const AVATAR_UPLOAD_DTO = { entityType: 'user_avatar' as const };

describe('UploadsService', () => {
  let service: UploadsService;
  let prisma: {
    client: {
      event: { findUnique: jest.Mock };
      local: { findFirst: jest.Mock };
      user: { findUnique: jest.Mock };
      photo: {
        count: jest.Mock;
        create: jest.Mock;
        findMany: jest.Mock;
        findUnique: jest.Mock;
        delete: jest.Mock;
      };
    };
  };
  let storage: { upload: jest.Mock; delete: jest.Mock };

  const mockEventForUpload = (cityId = CITY_PAIC, id = EVENT_ID): void => {
    prisma.client.event.findUnique
      .mockResolvedValueOnce({ id })
      .mockResolvedValueOnce({ cityId });
  };

  const mockStorageUploadFor = (id: string): void => {
    storage.upload
      .mockResolvedValueOnce(evtUrl(id))
      .mockResolvedValueOnce(evtUrl(id, true));
  };

  const echoCreatedPhoto = (): void => {
    prisma.client.photo.create.mockImplementation(
      (args: { data: Record<string, unknown> }) =>
        Promise.resolve({ ...args.data }),
    );
  };

  beforeEach(async () => {
    prisma = {
      client: {
        event: { findUnique: jest.fn() },
        local: { findFirst: jest.fn() },
        user: { findUnique: jest.fn() },
        photo: {
          count: jest.fn(),
          create: jest.fn(),
          findMany: jest.fn(),
          findUnique: jest.fn(),
          delete: jest.fn(),
        },
      },
    };
    storage = {
      upload: jest.fn().mockResolvedValue('https://obj/o/dummy'),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        UploadsService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: storage },
      ],
    }).compile();

    service = moduleRef.get(UploadsService);
  });

  describe('upload - validações de arquivo', () => {
    it('lança INVALID_FILE_TYPE se file ausente', async () => {
      await expect(
        service.upload(undefined, AVATAR_UPLOAD_DTO, CIDADAO_USER),
      ).rejects.toThrow(BadRequestException);
    });

    it('lança INVALID_FILE_TYPE se mime não suportado (pdf)', async () => {
      const f = {
        ...buildFakeJpeg(),
        mimetype: 'application/pdf',
      } as Express.Multer.File;
      await expectApiErrorCode(
        () => service.upload(f, AVATAR_UPLOAD_DTO, CIDADAO_USER),
        'invalid_file_type',
      );
    });

    it('lança FILE_TOO_LARGE se size > 5MB', async () => {
      const big = buildFakeJpeg(6 * 1024 * 1024);
      await expectApiErrorCode(
        () => service.upload(big, AVATAR_UPLOAD_DTO, CIDADAO_USER),
        'file_too_large',
      );
    });
  });

  describe('upload - validações de entidade', () => {
    it('lança INVALID_ENTITY_TYPE se entityType fora da whitelist', async () => {
      await expectApiErrorCode(
        () =>
          service.upload(
            buildFakeJpeg(),
            { entityType: 'foo' as never },
            CIDADAO_USER,
          ),
        'invalid_entity_type',
      );
    });

    it('lança ENTITY_ID_REQUIRED para event sem entityId', async () => {
      await expectApiErrorCode(
        () =>
          service.upload(buildFakeJpeg(), { entityType: 'event' }, ADMIN_USER),
        'entity_id_required',
      );
    });

    it('lança ENTITY_NOT_FOUND para event inexistente', async () => {
      prisma.client.event.findUnique.mockResolvedValue(null);
      await expectApiErrorCode(
        () => service.upload(buildFakeJpeg(), EVENT_UPLOAD_DTO, ADMIN_USER),
        'entity_not_found',
      );
    });
  });

  describe('upload - autorização', () => {
    it('CIDADAO não pode upload em event - 403 not_owner_or_admin', async () => {
      prisma.client.event.findUnique.mockResolvedValue({
        id: EVENT_ID,
        cityId: CITY_PAIC,
      });
      await expect(
        service.upload(buildFakeJpeg(), EVENT_UPLOAD_DTO, CIDADAO_USER),
      ).rejects.toThrow(ForbiddenException);
    });

    it('ADMIN de outra cidade - 403 city_scope_denied', async () => {
      mockEventForUpload(CITY_OUTRA);
      await expectApiErrorCode(
        () => service.upload(buildFakeJpeg(), EVENT_UPLOAD_DTO, ADMIN_USER),
        'city_scope_denied',
      );
    });

    it('foto de avatar de outro usuário não pode ser apagada por terceiro - 403 not_owner_or_admin', async () => {
      prisma.client.photo.findUnique.mockResolvedValue(
        buildPhoto({
          id: PHOTO_ID_OTHER,
          url: avatarUrl('usr_outro', PHOTO_ID_OTHER),
          thumbUrl: null,
          userId: 'usr_outro',
        }),
      );
      await expect(
        service.remove(PHOTO_ID_OTHER, CIDADAO_USER),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('upload - limite de fotos', () => {
    it('lança PHOTO_LIMIT_REACHED se entidade já tem 10 fotos', async () => {
      mockEventForUpload();
      prisma.client.photo.count.mockResolvedValue(10);

      await expectApiErrorCode(
        () => service.upload(buildFakeJpeg(), EVENT_UPLOAD_DTO, ADMIN_USER),
        'photo_limit_reached',
      );
    });
  });

  describe('upload - happy path', () => {
    it('cria photo para event, faz upload original + thumb, retorna DTO', async () => {
      mockEventForUpload();
      prisma.client.photo.count.mockResolvedValue(3);
      mockStorageUploadFor(PHOTO_ID_NEW);
      echoCreatedPhoto();

      const result = await service.upload(
        buildFakeJpeg(),
        EVENT_UPLOAD_DTO,
        ADMIN_USER,
      );

      expect(storage.upload).toHaveBeenCalledTimes(2);
      expect(result).toMatchObject({
        entityType: 'event',
        entityId: EVENT_ID,
        url: evtUrl(PHOTO_ID_NEW),
        thumbUrl: evtUrl(PHOTO_ID_NEW, true),
      });
      const [createArg] = prisma.client.photo.create.mock.calls[0] as [
        { data: Record<string, unknown> },
      ];
      expect(createArg.data).toMatchObject({
        eventId: EVENT_ID,
        localId: null,
        ticketId: null,
        userId: ADMIN_USER.sub,
      });
    });

    it('user_avatar substitui avatar anterior (1 ativo por user)', async () => {
      prisma.client.user.findUnique.mockResolvedValue({ id: CIDADAO_USER.sub });
      prisma.client.photo.findMany.mockResolvedValue([
        {
          id: PHOTO_ID_OLD,
          url: avatarUrl(CIDADAO_USER.sub, PHOTO_ID_OLD),
          thumbUrl: avatarUrl(CIDADAO_USER.sub, PHOTO_ID_OLD, true),
        },
      ]);
      echoCreatedPhoto();

      await service.upload(buildFakeJpeg(), AVATAR_UPLOAD_DTO, CIDADAO_USER);

      // 2 deletes do avatar antigo (original + thumb) + 2 uploads do novo.
      expect(storage.delete).toHaveBeenCalledTimes(2);
      expect(prisma.client.photo.delete).toHaveBeenCalledWith({
        where: { id: PHOTO_ID_OLD },
      });
      expect(storage.upload).toHaveBeenCalledTimes(2);
    });

    it('cleanup de orfãos se persistência falhar', async () => {
      mockEventForUpload();
      prisma.client.photo.count.mockResolvedValue(0);
      mockStorageUploadFor(PHOTO_ID_NEW);
      prisma.client.photo.create.mockRejectedValue(new Error('db down'));

      await expect(
        service.upload(buildFakeJpeg(), EVENT_UPLOAD_DTO, ADMIN_USER),
      ).rejects.toThrow('db down');

      // Cleanup: deve ter tentado apagar ambos os objetos do bucket.
      expect(storage.delete).toHaveBeenCalledTimes(2);
    });

    it('cleanup do original se upload da thumb falhar', async () => {
      mockEventForUpload();
      prisma.client.photo.count.mockResolvedValue(0);
      storage.upload
        .mockResolvedValueOnce(evtUrl(PHOTO_ID_NEW))
        .mockRejectedValueOnce(new Error('storage 5xx'));

      await expect(
        service.upload(buildFakeJpeg(), EVENT_UPLOAD_DTO, ADMIN_USER),
      ).rejects.toThrow('storage 5xx');

      expect(storage.delete).toHaveBeenCalledTimes(1);
    });
  });

  describe('upload - ticket (sem modelo)', () => {
    it('aceita ticket sem verificar existência (CPR-27)', async () => {
      prisma.client.photo.count.mockResolvedValue(0);
      echoCreatedPhoto();

      const result = await service.upload(
        buildFakeJpeg(),
        { entityType: 'ticket', entityId: TICKET_ID },
        CIDADAO_USER,
      );

      expect(result.entityType).toBe('ticket');
      expect(result.entityId).toBe(TICKET_ID);
      // Não houve consulta de event/local/user pois ticket é skip.
      expect(prisma.client.event.findUnique).not.toHaveBeenCalled();
      expect(prisma.client.local.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('404 photo_not_found se id inexistente', async () => {
      prisma.client.photo.findUnique.mockResolvedValue(null);
      await expect(service.remove(PHOTO_ID, ADMIN_USER)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('ADMIN da mesma cidade pode apagar foto de event', async () => {
      prisma.client.photo.findUnique.mockResolvedValue(
        buildPhoto({
          url: evtUrl(PHOTO_ID).replace(EVENT_ID, EVENT_ID_OTHER),
          thumbUrl: evtUrl(PHOTO_ID, true).replace(EVENT_ID, EVENT_ID_OTHER),
          userId: 'usr_outro_admin',
          eventId: EVENT_ID_OTHER,
        }),
      );
      prisma.client.event.findUnique.mockResolvedValue({ cityId: CITY_PAIC });

      await service.remove(PHOTO_ID, ADMIN_USER);

      expect(storage.delete).toHaveBeenCalledTimes(2);
      expect(prisma.client.photo.delete).toHaveBeenCalledWith({
        where: { id: PHOTO_ID },
      });
    });

    it('user_avatar: dono pode apagar', async () => {
      prisma.client.photo.findUnique.mockResolvedValue(
        buildPhoto({
          url: avatarUrl(CIDADAO_USER.sub, PHOTO_ID),
          thumbUrl: null,
          userId: CIDADAO_USER.sub,
        }),
      );

      await service.remove(PHOTO_ID, CIDADAO_USER);

      expect(storage.delete).toHaveBeenCalledTimes(1);
      expect(prisma.client.photo.delete).toHaveBeenCalled();
    });

    it('ticket: CIDADAO não pode apagar (apenas ADMIN; city scope chegará em CPR-27)', async () => {
      prisma.client.photo.findUnique.mockResolvedValue(
        buildPhoto({
          url: `${STORAGE_PREFIX}photos/ticket/${TICKET_ID}/${PHOTO_ID}.webp`,
          thumbUrl: null,
          userId: CIDADAO_USER.sub,
          ticketId: TICKET_ID,
        }),
      );

      await expect(service.remove(PHOTO_ID, CIDADAO_USER)).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.client.photo.delete).not.toHaveBeenCalled();
    });

    it('ticket: ADMIN pode apagar', async () => {
      prisma.client.photo.findUnique.mockResolvedValue(
        buildPhoto({
          url: `${STORAGE_PREFIX}photos/ticket/${TICKET_ID}/${PHOTO_ID}.webp`,
          thumbUrl: null,
          userId: CIDADAO_USER.sub,
          ticketId: TICKET_ID,
        }),
      );

      await service.remove(PHOTO_ID, ADMIN_USER);

      expect(prisma.client.photo.delete).toHaveBeenCalledWith({
        where: { id: PHOTO_ID },
      });
    });
  });
});
