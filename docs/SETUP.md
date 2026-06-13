# Guia de Setup para Desenvolvedores

Passo a passo para rodar o Conecta Paraná localmente. Se travar em algum ponto, peça ajuda ao time, alguém estará disponível para auxiliar.

## Pré-requisitos

| Ferramenta | Versão mínima |
|---|---|
| Node.js | 20 |
| npm | 10+ |
| Flutter | 3.11+ |
| Docker e Docker Compose | Última stable |
| Angular CLI | 21+ (`npm i -g @angular/cli`) |
| Android Studio | Última stable (para o mobile) |

## 1. Clonar o repositório

```bash
# Via SSH
git clone git@github.com:c-s-softwares/conecta-parana.git

# Via HTTPS
git clone https://github.com/c-s-softwares/conecta-parana.git

# Navegar até o repositório
cd conecta-parana
```

## 2. Configurar variáveis de ambiente

### Raiz do projeto

```bash
cp .env.example .env
```

Preencha os valores:

```env
DB_USER=usuario
DB_PASSWORD=senha
DB_NAME=banco
```

### Backend

```bash
cp backend/.env.example backend/.env
```

Ajuste o `DATABASE_URL` para bater com o `.env` da raiz:

```env
# Exemplo
DATABASE_URL=postgresql://usuario:senha@localhost:5432/banco?schema=public
PORT=3000
NODE_ENV=development
```

As demais variáveis (JWT, CORS, Redis, GlitchTip, storage) já vêm preenchidas com placeholders no `.env.example`. Storage de fotos vem em modo `local` por padrão - ver seção 9 se precisar trocar.

### Mobile

```bash
cp mobile/.config_dev.example.json mobile/.config_dev.json
```

Para desenvolvimento local apontando ao backend via emulador Android:

```json
{
  "API_BASE_URL": "http://10.0.2.2:3000"
}
```

> `10.0.2.2` é o alias do emulador Android para `localhost` da máquina host.

## 3. Subir os serviços com Docker

```bash
docker-compose up -d

# Isso sobe: banco de dados (PostgreSQL + PostGIS),
# backend (com hot reload) e admin (com hot reload)

# Você pode subir separadamente (ou subir apenas o 
# serviço desejado) utilizando os comandos a seguir

docker compose up db -d
docker compose up backend -d
docker compose up admin -d
```



Verifique se tudo está rodando:

```bash
docker-compose ps
```

## 4. Rodar migrations do Prisma

```bash
cd backend
npm install
npx prisma migrate dev
cd ..
```

## 5. Rodar o backend (isolado, sem Docker)

Se preferir rodar o backend fora do Docker (ex: para debug):

```bash
cd backend
npm install
npm run start:dev
```

Acesse a documentação Swagger em: `http://localhost:3000/api/docs`

## 6. Rodar o admin (isolado, sem Docker)

```bash
cd admin
npm install
npm start
```

Acesse em: `http://localhost:4200`

## 7. Rodar o app mobile

### Setup no Android Studio

Peça ajuda para fazer o setup do Android Studio com mais exatidão no passo 4/5.

1. Abra o Android Studio
2. **File → Open** e selecione a pasta `mobile/`
3. Aguarde o Flutter SDK ser detectado e as dependências resolvidas
4. Configure um emulador: **Tools → Device Manager → Create Virtual Device** — escolha um Pixel e uma imagem com API 33+
5. Selecione o flavor `dev` na configuração de run (ou rode pelo terminal abaixo)
6. Clique em **Run**

### Via CLI

```bash
cd mobile
flutter pub get
flutter run --flavor dev -t lib/main_dev.dart --dart-define=API_BASE_URL=http://10.0.2.2:3000
```

> Use **apenas o flavor `dev`** para desenvolvimento. O flavor `prod` existe somente para geração do pacote final de produção.

## 8. Rodar testes

### Backend

```bash
cd backend
npm run test              # Testes unitários
npm run test:e2e          # Testes E2E (requer banco rodando)
npm run test:mutation     # Testes de mutação (Stryker)
```

### Admin

```bash
cd admin
npm run test              # Testes unitários
npm run e2e               # Testes E2E (Playwright)
npm run test:mutation     # Testes de mutação (Stryker)
```

### Mobile

```bash
cd mobile
flutter test                       # Testes unitários
flutter test integration_test/     # Testes de integração
```

Você também pode rodar os testes direto pela IDE caso esteja disponível.

## 9. Storage de arquivos em dev

O backend tem dois drivers (`STORAGE_DRIVER`):

- `local` (**padrão em dev**): persiste em `backend/.local-uploads/` e serve em `http://localhost:3000/dev-uploads/<key>`. **Dispensa qualquer configuração Oracle.**
- `oci`: integra com Oracle Cloud Object Storage real.

Para desenvolver, basta manter `STORAGE_DRIVER=local` no seu `.env` (padrão do `.env.example`). As envs `OCI_*` ficam em branco - são validadas pelo Joi apenas quando o driver é `oci`. Arquivos enviados via `POST /uploads/photos` vão para o seu disco, isolados de outros devs.

Se você precisar testar contra OCI real localmente (raro - normalmente só para debugar problemas específicos do SDK), gere uma chave Oracle pessoal e aponte para um bucket próprio. Nunca usar buckets compartilhados de outros ambientes do seu `.env` local.

## 10. Email transacional em dev

O backend tem dois drivers (`MAIL_DRIVER`):

- `mock` (**padrão em dev**): loga os parâmetros no console sem enviar emails reais. **Dispensa qualquer configuração Resend.**
- `resend`: integra com a API do Resend para envio real.

Para desenvolver, basta manter `MAIL_DRIVER=mock` no seu `.env` (padrão do `.env.example`). As envs `RESEND_API_KEY` e `MAIL_FROM` ficam em branco - são validadas pelo Joi apenas quando o driver é `resend`. Chamadas a `sendVerificationCode` e `sendPasswordResetCode` aparecem no log do backend com todos os dados (destinatário, código, validade).

Se você precisar testar envio real localmente (raro - normalmente só para validar templates no email client), crie uma conta gratuita em [resend.com](https://resend.com), gere uma API key pessoal e configure:

```env
MAIL_DRIVER=resend
RESEND_API_KEY=re_sua_chave_aqui
MAIL_FROM=seuemail@email.com
```

O free tier do Resend permite 100 emails/dia - suficiente para testes manuais.