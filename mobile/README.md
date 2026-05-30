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

| Flavor  | Uso                   | API                           |
| ------- | --------------------- | ----------------------------- |
| dev     | Desenvolvimento local | API rodando na máquina do dev |
| staging | Homologação / QA      | API de testes/homologação     |
| prod    | Build final publicado | API oficial publicada         |

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

## Fluxo de Inicialização e Árvore de Decisão de Rotas (Boot Logic)

O aplicativo utiliza um sistema duplo de Splash Screen para garantir uma transição visual contínua e realizar verificações de segurança antes de expor as rotas principais.

## Sequência de Boot

1. **Splash Nativa**: Renderizada instantaneamente pelo sistema operacional Android/iOS enquanto a máquina virtual do Flutter é inicializada.
2. **Splash Dart**: Substitui a Splash Nativa de forma contínua e dispara o processo assíncrono de checagem.
3. **Verificação de Serviços**: Inicialização do cliente HTTP, localização e leitura dos tokens criptografados no Keychain via `AuthService`.

## Árvore de Decisão

[Inicialização da Splash]
│
▼
Está Autenticado?
│
├──► Não ──────────────────────────────► Rota: /login
│
└──► Sim ────────────────► Possui Cidade Associada (cityId)?
│
├──► Não ──► Rota: /onboarding
│
└──► Sim ──► Rota: /home


## Tratamento de Falhas e Timeouts

- **Timeout > 5 segundos**: Exibe o indicador de progresso circular e texto de carregamento.
- **Timeout > 30 segundos**: Interrompe a inicialização por quebra de tempo limite e exibe tela de erro de conexão com botão de reativação.
- **Crash em Inicialização**: Captura falhas inesperadas no ecossistema nativo ou Dart, gerando log local e congelando o fluxo em tela de erro fatal genérica.

### Cadastro e Autenticação (/register)

* **Regras de Senha Forte:** O formulário de cadastro exige senhas com no mínimo 8 caracteres, contendo pelo menos uma letra maiúscula, uma letra minúscula, um número e um caractere especial. O feedback visual (indicador de força) é atualizado em tempo real.
* **Cache de Cidades (TTL):** Para otimizar a experiência e reduzir chamadas desnecessárias à API, a lista de cidades do dropdown de cadastro é cacheada localmente. O cache possui um TTL (Time To Live) de 1 hora, alinhado com o backend. O pull-to-refresh não foi implementado nesta tela, pois o tempo de cache é suficiente para a taxa de atualização dessas informações.
### Cenários de erro tratados (POST /auth/register)

* **Campo vazio:** erros inline aparecem nos campos conforme o usuário digita. O botão "Criar conta" fica desabilitado até todos os campos estarem válidos.
* **Senha fraca:** mensagem inline `"Mín. 8 caracteres com maiúscula, minúscula, número e especial"` aparece no campo de senha; indicador de força mostra o nível em tempo real; botão desabilitado.
* **Backend 409 `email_exists`:** card vermelho abaixo do campo de email com a mensagem `"Esse email já tem conta. Faça login."` + botão `"Fazer login"` que navega para `/login`.
* **Backend 400 `validation_failed`:** o backend retorna `errors: { name, email, password }` e cada mensagem é mapeada inline no respectivo campo.
* **GET /cities falha:** o dropdown de cidades exibe `"Erro ao carregar cidades."` com o botão `"Tentar novamente"`. Todos os campos do formulário ficam desabilitados (`enabled: false`) e o checkbox de termos ignora cliques até a lista carregar.
* **Termos não aceitos:** botão `"Criar conta"` permanece desabilitado.
* **Erro de rede genérico (timeout, sem conexão, 5xx):** SnackBar vermelho `"Erro ao criar conta. Verifique sua conexão e tente novamente."` no rodapé da tela.

## Roteamento com pendingDeepLink no AppRouter

#### Fluxo:

1. Deep link chega via `uriLinkStream` ou cold start
2. `DeepLinkParser` valida e converte para `DeepLinkRoute`
3. Usuário não logado → `AppRouter.setPendingDeepLink(route)` salva o destino
4. App navega para `/login`
5. Login bem-sucedido → `AppRouter.consumePendingDeepLink()` retorna o path e limpa o estado
6. `context.go(path)` leva o usuário ao destino original

## Custom scheme como fallback de deep links

Além dos Universal Links / App Links (`https://conectaparana.app/share/...`), o app
suporta um custom scheme próprio (`conectaparana://share/...`).

#### Quando usar cada um:

| Scheme | Ambiente | Observação |
| --- | --- | --- |
| `https://conectaparana.app/share/...` | Produção | Requer `assetlinks.json` e `apple-app-site-association` no domínio |
| `conectaparana://share/...` | Dev / Staging | Funciona sem verificação de domínio |

> Custom schemes são menos seguros que Universal Links — qualquer app pode registrar o mesmo scheme. Em produção o fluxo principal sempre usa HTTPS.

## Algoritmo de Ordenação do Feed

O feed editorial da aba Home é uma lista combinada de **Eventos**, **Comunicados** e **Notícias** ordenada pelo backend (`GET /feed`). O mobile exibe a ordem exatamente como recebida — nenhuma reordenação é feita no cliente.

### Paginação por cursor

O endpoint retorna `nextCursor` (string base64 opaca) e `hasMore: bool`. O cliente passa `cursor=` na próxima requisição. O backend garante estabilidade de cursor: novos itens inseridos entre páginas não causam duplicatas. Cursors expirados ou malformados retornam `400 invalid_cursor` — o mobile reinicia a lista do início silenciosamente.

### Parâmetros do endpoint

| Campo    | Tipo   | Obrigatório | Notas                          |
|----------|--------|-------------|--------------------------------|
| `cityId` | string | Sim         | ULID `cit_`. Ausente → `400 city_required` e redirect para `/onboarding`. |
| `lat`    | float  | Não         | Melhora ordenação por proximidade. |
| `lng`    | float  | Não         | Idem. Nunca solicitado automaticamente na Home (regra M-08). |
| `cursor` | string | Não         | Paginação. Ausente = primeira página. |
| `limit`  | int    | Não         | Default 20, máximo 50.         |

### Comportamento de cache no mobile

- **Pull-to-refresh**: invalida o cursor local e busca sem `cursor`, garantindo dados frescos.
- **Scroll infinito**: acumula itens em memória usando o `cursor` da última página recebida.
- **Cache em memória**: o `FeedNotifier` mantém o estado enquanto a aba Home permanece montada. Trocar de aba e voltar **não** recarrega — mantém posição de scroll.
- **Cache no backend**: TTL de 2 minutos (responsabilidade do backend, transparente para o mobile).

---

## Bottom Navigation — tap em aba já ativa

Tap em uma aba já ativa faz pop até o root dessa aba. Se o usuário já estiver no root, o tap não tem efeito.

Exemplo:
1. Usuário navega para `/map/loc_X` (detalhe dentro da aba Mapa)
2. Toca na aba Mapa novamente → volta para `/map` (root da aba)
3. Toca na aba Mapa mais uma vez → sem efeito (já no root)

## Fluxo de Onboarding 

O onboarding é exibido após o cadastro ou quando o usuário autenticado não possui `cityId` no perfil.

### Quando é acionado

- Após cadastro bem-sucedido (`/register` navega para `/onboarding`)
- No boot, quando `isLogged == true` e `hasCity == false`

### Passos do wizard

| Passo | Tela | Obrigatório |
|-------|------|-------------|
| 1 | Confirmar cidade (`PUT /users/me/city`) | Sim |
| 2 | Informar bairro (`PUT /users/me`) | Não — pode pular |
| 3 | Permissões (localização e notificações) | Não — pode pular |

### Comportamento

- Botão **"Pular"** disponível nos passos 2 e 3
- Permissões negadas não bloqueiam a finalização
- Ao concluir, navega para `/home`
- Se o usuário veio do cadastro com cidade já selecionada, o passo 1 vem preenchido

### Cenários de erro tratados

| Cenário | Comportamento |
|---------|---------------|
| `PUT /users/me/city` retorna 429 `update_too_frequent` | Snackbar amarelo + botão "Próximo" desabilitado por 60s |
| `PUT /users/me` falha | Snackbar genérico + usuário pode tentar novamente ou pular |
| Permissão negada pelo usuário | Onboarding segue normalmente |
| Usuário nega permissão e tenta novamente | Abre configurações do app (`openAppSettings`) |
