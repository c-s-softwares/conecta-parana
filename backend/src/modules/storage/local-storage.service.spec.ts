import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { promises as fs } from 'fs';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { LocalStorageService } from './local-storage.service';

const TEST_PORT = 3000;
const SAMPLE_KEY = 'photos/event/evt_x/pho_y.webp';
const SAMPLE_BUFFER = Buffer.from('image-bytes-fake');
const EXPECTED_URL_PREFIX = `http://localhost:${TEST_PORT}/dev-uploads`;

describe('LocalStorageService', () => {
  let service: LocalStorageService;
  let tempCwd: string;
  let originalCwd: string;

  beforeEach(async () => {
    // Cria um diretório temporário e usa como cwd para que `.local-uploads/`
    // seja isolado por teste (sem mexer no FS real do projeto).
    originalCwd = process.cwd();
    tempCwd = mkdtempSync(join(tmpdir(), 'cpr-storage-spec-'));
    process.chdir(tempCwd);

    const moduleRef = await Test.createTestingModule({
      providers: [
        LocalStorageService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) =>
              key === 'PORT' ? TEST_PORT : undefined,
            ),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(LocalStorageService);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tempCwd, { recursive: true, force: true });
  });

  describe('upload', () => {
    it('escreve no disco e retorna URL pública /dev-uploads/...', async () => {
      const url = await service.upload(SAMPLE_KEY, SAMPLE_BUFFER, 'image/webp');

      expect(url).toBe(`${EXPECTED_URL_PREFIX}/${SAMPLE_KEY}`);
      const written = await fs.readFile(
        join(tempCwd, '.local-uploads', SAMPLE_KEY),
      );
      expect(written.equals(SAMPLE_BUFFER)).toBe(true);
    });

    it('cria diretórios intermediários (mkdir recursivo)', async () => {
      const deepKey = 'photos/local/loc_abc/foo/bar/pho_deep.webp';
      await service.upload(deepKey, SAMPLE_BUFFER, 'image/webp');

      const exists = await fs
        .access(join(tempCwd, '.local-uploads', deepKey))
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);
    });

    it('codifica caracteres especiais na URL preservando barras', async () => {
      const accentedKey = 'photos/event/evt_x/foto com espaço.webp';
      const url = await service.upload(
        accentedKey,
        SAMPLE_BUFFER,
        'image/webp',
      );

      expect(url).toBe(
        `${EXPECTED_URL_PREFIX}/photos/event/evt_x/foto%20com%20espa%C3%A7o.webp`,
      );
    });

    it('bloqueia path traversal (key com ../)', async () => {
      await expect(
        service.upload('../escape.webp', SAMPLE_BUFFER, 'image/webp'),
      ).rejects.toThrow(/Path traversal/);
    });
  });

  describe('delete', () => {
    it('remove arquivo existente', async () => {
      await service.upload(SAMPLE_KEY, SAMPLE_BUFFER, 'image/webp');
      await service.delete(SAMPLE_KEY);

      const exists = await fs
        .access(join(tempCwd, '.local-uploads', SAMPLE_KEY))
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(false);
    });

    it('idempotente: arquivo inexistente não lança', async () => {
      await expect(
        service.delete('photos/event/evt_x/inexistente.webp'),
      ).resolves.toBeUndefined();
    });
  });

  describe('getSignedUrl', () => {
    it('devolve a mesma URL pública (não há assinatura local)', async () => {
      const url = await service.getSignedUrl(SAMPLE_KEY, 3600);
      expect(url).toBe(`${EXPECTED_URL_PREFIX}/${SAMPLE_KEY}`);
    });
  });
});
