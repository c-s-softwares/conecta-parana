# Glossário de Negócio - Conecta Paraná

Este documento define os termos do domínio para garantir que todos os envolvidos falem a mesma língua.

## Formato de cada termo

Cada termo deve seguir esta estrutura:

### Nome do Termo

- **Definição:** descrição objetiva e sem ambiguidade do que o termo significa no contexto do sistema.
- **Contexto de uso:** onde e como esse conceito aparece no sistema (telas, fluxos, entidades).

---

## Termos documentados

### Cidade

- **Definição:** Município do estado do Paraná cadastrado na plataforma. Cada cidade possui seus próprios locais, categorias e administradores.
- **Contexto de uso:** Unidade principal de organização do sistema. Cidadãos e locais pertencem a uma cidade. Admins municipais gerenciam uma cidade específica.

### Cidadão

- **Definição:** Usuário final da plataforma que acessa o _app mobile_. Pode visualizar locais, enviar sugestões e avaliações (quando logado).
- **Contexto de uso:** Perfil de acesso no app mobile. Não possui permissões administrativas.

### Usuário Administrador

- **Definição:** Administrador responsável que acessa a plataforma _admin (web)_ por uma cidade específica. Pode moderar conteúdo, gerenciar locais e responder sugestões dentro da sua cidade.
- **Contexto de uso:** Perfil de acesso no painel admin web, com escopo limitado à cidade atribuída.

### Local

- **Definição:** Lugar onde os serviços e eventos podem se encontrar.
- **Contexto de Uso:** Um evento ou um serviço citado no mapa do app terá um local atribuído a ele no mapa.

### Categoria

- **Definição:** Tipos de postagens que podem ser definidas no app.
- **Contexto de Uso:** Os posts com diferentes categorias podem aparecer em ordens diferentes dependendo da categoria dele, se for um evento ele poderá aparecer primeiro. 

### Sugestão

- **Definição:** Pedidos de usuários para o usuário Adm a respeito de novas ideias de eventos.
- **Contexto de Uso:** Os usuários autenticados poderão dar sugestões para os usuários administradores para dar ideias de novos eventos para movimentar a comunidade 

### Moderação

- **Definição:** Pessoas responsáveis por manter o aplicativo informado, atualizado e seguro 
- **Contexto de Uso:** Os moderadores irão averiguar e atualizar os dados do app, sendo novos detalhes de evento

### Avaliação

- **Definição:** Nota que os usuários poderam dar para os eventos que já foram finalizados.
- **Contexto de Uso:** Quando um evento for encerrado os usuários poderão dar uma avaliação para esse evento.

### Aviso 

- **Definição:** Notificações que o usuário poderá receber quando um ticket de acidente for validado.
- **Contexto de Uso:** Essa notificação poderá aparecer quando um evento próximo está prestes a acabar ou quando um acidente foi reportado.

### Newsletter

- **Definição:** Publicação periódica enviada por e-mail para uma base de usuários cadastrados.
- **Contexto de Uso:** Foca em entregar conteúdo relevante para os usuários (ex.: Eventos importantes ou grandes)

### Geolocalização

- **definição:** Tecnologia usada que permite identificar a posição geográfica de um usuário ou dispositivo.
- **Contexto de Uso:** Usada para ordenar eventos por proximidade no feed e identificar serviços próximos ao usuário no mapa interativo.

### Ticket

- **Definição:**  Registro de solicitação ou problema enviado pelo usuário. 
- **Contexto de Uso:** Utilizado para comunicar problemas urbanos à prefeitura (ex.: acidentes ou falta de sinalização em um trecho da cidade).

### Usuário Autenticado

- **Definição:** Cidadão que esteja cadastrado e logado no aplicativo.
- **Contexto de Uso:** Usuário autenticado terá mais acesso a funções doque o Usuário Anônimo.

### Usuário Anônimo

- **Definição:** Cidadão que não esteja cadastrado no aplicativo.
- **Contexto de Uso:** Usuários anônimos terão acesso limitado a plataforma sendo apenas algumas funcionalidades da home-page

<!-- Adicione mais termos conforme necessário -->
