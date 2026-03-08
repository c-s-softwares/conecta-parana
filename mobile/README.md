# Conecta Paraná — Mobile

App mobile construído com Flutter 3.11+ e Dart, com flavors para dev e prod.

## Como rodar

### Android Studio (recomendado)

1. Abra o Android Studio e selecione **File → Open** → pasta `mobile/`
2. Aguarde o Flutter SDK ser detectado e as dependências resolvidas
3. Configure um emulador: **Tools → Device Manager → Create Virtual Device** — escolha um Pixel com API 33+
4. Selecione o flavor `dev` na configuração de run
5. Clique em **Run**

> Peça ajuda ao time se travar no setup do emulador.

### Via CLI

```bash
cd mobile
flutter pub get
flutter run --flavor dev -t lib/main_dev.dart --dart-define=API_BASE_URL=http://10.0.2.2:3000
```

> `10.0.2.2` é o alias do emulador Android para o `localhost` da máquina host.

## Configuração de ambiente

Copie o arquivo de config de dev:

```bash
cp .config_dev.example.json .config_dev.json
```

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
│   ├── main_prod.dart     # Entry point — flavor prod
│   ├── core/              # Utilidades e serviços base
│   ├── features/          # Módulos de funcionalidade
│   ├── services/          # Serviços de negócio
│   └── shared/            # Componentes compartilhados
├── test/                  # Testes unitários
└── integration_test/      # Testes de integração
```

## Decisões técnicas

- **Flutter 3.11+** com Dart 3.11+
- **Flavors** dev/prod com entry points separados (`main_dev.dart`, `main_prod.dart`)
- **API_BASE_URL** passada via `--dart-define` no build
- Arquitetura organizada em `core/`, `features/`, `services/`, `shared/`
