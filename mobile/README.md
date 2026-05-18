Fluxo de Inicialização e Árvore de Decisão de Rotas (Boot Logic)

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


# Tratamento de Falhas e Timeouts

- **Timeout > 5 segundos**: Exibe o indicador de progresso circular e texto de carregamento.
- **Timeout > 30 segundos**: Interrompe a inicialização por quebra de tempo limite e exibe tela de erro de conexão com botão de reativação.
- **Crash em Inicialização**: Captura falhas inesperadas no ecossistema nativo ou Dart, gerando log local e congelando o fluxo em tela de erro fatal genérica.