# Conecta Paraná — Mobile

App mobile construído com Flutter 3.11+ e Dart, com flavors para dev, staging  e prod.

## Pré-requisitos

Instalar antes de rodar o projeto:

- Flutter **3.11+**
- Dart **3+**
- Android Studio (SDK Android instalado)
- Xcode 15+ (apenas para iOS)
- Emulador Android API 33+

Verificar instalação:
```bash
flutter doctor
``` 

## Como rodar

### Android Studio (recomendado)

1. Abra o Android Studio e selecione **File → Open** → pasta `mobile/`
2. Aguarde o Flutter SDK ser detectado e as dependências resolvidas
3. Configure um emulador: **Tools → Device Manager → Create Virtual Device** — escolha um Pixel com API 33+
4. Selecione o flavor `dev` na configuração de run
5. Clique em **Run**

> Peça ajuda ao time se travar no setup do emulador.

### Limpeza inicial (primeira execução)

Execute antes de rodar o projeto pela primeira vez:

```bash
flutter clean
flutter pub get
```

> Isso evita erros de cache e build.

### Via CLI

```bash
cd mobile
flutter pub get
flutter run --flavor dev -t lib/main_dev.dart --dart-define=API_BASE_URL=http://10.0.2.2:3000
```

> `10.0.2.2` é o alias do emulador Android para o `localhost` da máquina host.

## Rodar no celular físico (Android)

1. Ative o **Modo Desenvolvedor** no celular
2. Ative **Depuração USB**
3. Conecte o celular ao computador via USB
4. Execute:

    ```bash
    flutter devices
    ```

    Se o celular aparecer na lista, rode:

    ```bash
    flutter run --flavor dev -t lib/main_dev.dart --dart-define=API_BASE_URL=http://SEU_IP:3000
    ```

## Configuração de ambiente

Copie o arquivo de config de dev:

```bash
cp .config_dev.example.json .config_dev.json
```

## Flavors

O projeto possui três ambientes:

| Flavor | Uso | API
|---|---| --- |
| dev | Desenvolvimento local | API rodando na máquina do dev
| staging | Homologação / QA  | API de testes/homologação
| prod | Build final publicado | API oficial publicada

> Use **apenas o flavor `dev`** para desenvolvimento. O flavor `prod` existe somente para geração do pacote final de produção.

## Testes

```bash
flutter test                       # Testes unitários
flutter test integration_test/     # Testes de integração
```

## Gerar APK

```bash
flutter build apk --flavor dev -t lib/main_dev.dart --dart-define=API_BASE_URL=http://10.0.2.2:3000
```

O APK fica em: `build/app/outputs/flutter-apk/app-dev-release.apk`

## Estrutura do projeto

```
mobile/
├── lib/
│   ├── app.dart           # Widget principal
│   ├── main_dev.dart      # Entry point — flavor dev
│   ├── main_staging.dart  # Entry point — flavor staging
│   ├── main_prod.dart     # Entry point — flavor prod
│   ├── core/              # Utilidades e serviços base
│   ├── data/              # API, repositories, DTOs
│   ├── domain/            # Entidades e regras de negócio
│   ├── features/          # Módulos de funcionalidade
│   ├── services/          # Serviços de negócio
│   └── shared/            # Componentes compartilhados
├── test/                  # Testes unitários
└── integration_test/      # Testes de integração
```

## Decisões técnicas

- **Flutter 3.11+** com Dart 3.11+
- **Flavors** dev/staging/prod com entry points separados (`main_dev.dart`, `main_staging.dart`, `main_prod.dart`)
- **API_BASE_URL** passada via `--dart-define` no build
- Arquitetura organizada em `core/`, `data/`, `domain/`, `features/`, `services/`, `shared/`

## Armazenamento seguro de tokens (M-07)

Os tokens de autenticação (access token e refresh token) são armazenados utilizando o pacote flutter_secure_storage.

#### Motivação:

- Armazenamento criptografado pelo sistema operacional
- Uso do Android Keystore e iOS Keychain
- Evita exposição de tokens em storages não seguros (ex: SharedPreferences)
- Segue boas práticas de segurança para aplicações mobile

#### Responsabilidades do storage:

- Persistir tokens após login
- Restaurar sessão ao abrir o app
- Remover tokens no logout
- Limpar tokens inválidos ou corrompidos automaticamente

## Role guard defensivo (bloqueio de ADMIN)

O aplicativo mobile é destinado **apenas a usuários finais (cidadãos)**.

Usuários com role **ADMIN** não podem utilizar o app mobile.

Se o JWT contiver:

```bahs
role = ADMIN
```

O fluxo será:

1. Login é interrompido
2. Tokens são removidos do storage
3. Usuário permanece deslogado
4. O app exibe mensagem orientando o uso do painel web administrativo

#### Motivação:

- Administração deve ocorrer exclusivamente via painel web
- Evita uso indevido do app por perfis administrativos
- Proteção adicional contra configurações incorretas do backend

## Restauração segura de sessão

Na inicialização do app, o AuthService tenta restaurar a sessão salva.

#### Caso os tokens armazenados estejam:

- expirados
- inválidos
- corrompidos
- com formato inesperado

#### O app automaticamente:

- remove os tokens do storage
- evita crash na inicialização
- mantém o usuário deslogado