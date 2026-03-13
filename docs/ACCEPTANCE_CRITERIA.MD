### Critério de Aceitação

### 001.CADASTRO/LOGIN DE USUÁRIO
**Dado** que o usuário esteja na tela de login do aplicativo. 
**Quando** ele clicar no botão de “Cadastro” ou “Login”. 
**Então** o sistema deve exibir uma janela com os campos de email e senha.

### 002.ESQUECI A SENHA
**Dado** que o usuário tenha esquecido da senha na tela de login; 
**Quando** ele clicar na opção de “esqueci a senha”; 
**Então** será exibido um pop-up com os campos para colocar o email e o código de verificação.

### 003.LOGOUT DE USUÁRIO
**Dado** que o usuário esteja na tela de configuração de usuário; 
**Quando** ele clicar em “Logout de usuário”; 
**Então** o sistema deverá apresentar para o usuário uma aba com o campo para ele digitar a sua senha e depois de digitado o sistema deve fazer logout da conta dele.

### 004.GERENCIAR PERMISSÕES DE USUÁRIO
**Dado** que o usuário esteja abrindo o aplicativo pela primeira vez; 
**Quando** ele clicar em qualquer funcionalidade seja de, foto ou gps; 
**Então** o sistema deve pedir autorização do usuário para ter acesso a essas funções.

### 005.MENU INTERATIVO
**Dado** que o usuário esteja em qualquer tela do aplicativo; 
**Quando** ele clicar no menu interativo; 
**Então** será exibido um menu com as opções de configuração de conta e sair da conta.

### 006.BUSCAR NOVAS POSTAGENS (RELOGAR)
**Dado** que na página inicial apresente posts antigos para o usuário; 
**Quando** ele clicar no ícone de atualização, 
**Então** a página inicial será atualizada e  mostrará postagens mais atuais. 

### 007.POSTAGEM PREFEITURA
**Dado** que o usuário consiga entrar com a sua conta 
**Quando** ele acessar a home page, 
**Então** será apresentado as postagens da prefeitura da sua cidade.

### 008.BARRA DE BUSCA POR NOME
**Dado** que o usuário está na barra de pesquisa, 
**Quando** digita um termo na barra de procura e confirma; 
**Então** o sistema deve exibir os resultados correspondentes ao assunto digitado.

### 009.ORDENAÇÃO DE PROXIMIDADE (EVENTO)
**Dado** que usuário esteja visualizando posts de eventos; 
**Quando** ele realizar a ação de atualizar o feed (scroll para cima no topo ou clicando no ícone de atualizar); 
**Então** o sistema deve organizar os eventos da prefeitura em distância (mais próximo será exibido primeiro) e cronologia (em andamento seguidos dos próximos a ocorrer).

### 010.FILTRO CIDADE
**Dado** que o usuário esteja com as opções de filtro aberta; 
**Quando** ele clicar na opção de filtros e filtrar por cidade; 
**Então** o feed deverá ser atualizado mostrando os posts da cidade selecionada.

### 011.FILTRO GERAL
**Dado** que o usuário esteja na página principal com o feed carregado; 
**Quando** ele clicar na opção de filtragem e selecionar as etiquetas desejadas; 
**Então** o sistema deve atualizar e apresentar as postagens com as tags selecionadas.


### 012.DETALHAMENTO POSTAGEM
**Dado** que o usuário esteja na home page e visualizando as postagens; 
**Quando** ele clicar em uma postagem que lhe chame atenção; 
**Então** ela será exibida em tela cheia mostrando os detalhes fornecidos da postagem.
 
### 013.SISTEMA DE TICKET DE USUÁRIO
**Dado** que o usuário esteja na aba de tickets; 
**Quando** o usuário preencher o campo com a ocorrência dele; 
**Então** o sistema deverá encaminhar esse ticket para a prefeitura.  

### 014.SISTEMA DE AVALIAÇÃO(CURTIDAS)
**Dado** que o usuário esteja visualizando um post; 
**Quando** ele clicar no botão de curtir; 
**Então** o sistema deve computar essa curtida e armazenar ela ao lado do ícone de curtir.


### 015.MANTER POSTAGENS
**Dado** que o usuário tenha feito uma postagem; 
**Quando** ele acessar o perfil dele; 
**Então** o sistema deverá apresentar todas as postagens que ele realizou desde o momento em que ele criou a conta. 

### 016.USAR GEOLOCALIZAÇÃO PARA ENCONTRAR SERVIÇOS
**Dado** que o usuário esteja visualizando o mapa interativo; 
**Quando** ele der zoom no mapa; 
**Então** o mapa usando geolocalização deverá mostrar ao usuário serviços próximos.

### 017.MAPA INTERATIVO
**Dado** que o usuário esteja na página inicial;
**Quando** ele clicar no ícone de mapa; 
**Então** o sistema deve apresentar para o usuário um mapa da cidade dele.

### 018.NAVEGAR PELO MAPA INTERATIVO
**Dado** que o usuário esteja no mapa da cidade; 
**Quando** ele arrastar o dedo pelo mapa; 
**Então** o mapa deverá acompanhar o arrastar de dedo do usuário.

### 019.ROTA DO EVENTO
**Dado** que o usuário esteja no post do evento da prefeitura; 
**Quando** ele clicar em rotas para evento; 
**Então** o sistema deve calcular a rota dele com base no ponto de partida.

### 020.LOCALIZAR PONTOS DE INTERESSE
**Dado** que o usuário esteja dentro do mapa interativo; 
**Quando** ele digitar um local; 
**Então** o mapa deverá localizar esse ponto e definir um rota até lá.

### 021.IDENTIFICAÇÃO DE LOCAIS PRÓXIMOS
**Dado** que o usuário esteja na home page; 
**Quando** o usuário clicar no ícone de mapa; 
**Então** ao redor do ícone do usuário deverá ser identificado locais/comércios ao redor.

### 022.BOTÃO DE PERFIL DO USUÁRIO
**Dado** que o usuário esteja na home page; 
**Quando** ele clicar ele clicar no ícone de perfil (seja a foto de perfil no canto inferior direito); 
**Então** o sistema deverá direcionar o usuário para o perfil dele.

### 023.PERFIL DO USUÁRIO
**Dado** que o usuário esteja na aba de configurações; 
**Quando** ele clicar em Meu Perfil; 
**Então** o sistema deverá apresentar para o usuário todos os detalhes do perfil para o usuário.

### 024.FOTO DE PERFIL (OPCIONAL)
**Dado** que o usuário esteja na aba de criação de perfil; 
**Quando** ele clicar em foto de perfil; 
**Então** o sistema deverá pedir permissão para usar a câmera dele e conseguir tirar a foto, o sistema deverá armazenar a foto tirada no perfil do usuário.

### 025.EDITAR DADOS PESSOAIS
**Dado** que usuário esteja na página do perfil; 
**Quando** o usuário selecionar “dados pessoais”; 
**Então** o sistema deverá exibir os campos para o usuário preencher e quando preenchido o sistema deve salvar e alterar.

### 026.BAIRRO
**Dado** que o usuário esteja dentro do menu de opções; 
**Quando** ele selecionar a opção de colocar o bairro dentro do campo do perfil; 
**Então** o sistema tem que armazenar o bairro dentro do perfil.

### 027.MULTIMÍDIA DO EVENTO
**Dado** que o usuário esteja visualizando um evento em sua home page; 
**Quando** ele clicar no post do evento; 
**Então** logo abaixo dos detalhes do evento o sistema deverá apresentar para o usuário  as fotos do evento;

### 028.LOCALIZAÇÃO EVENTO
**Dado** que o usuário esteja visualizando um post de um evento para o homepage; 
**Quando** ele clicar no post; 
**Então** embaixo do post terá a localização do evento, podendo clicar nele para ter a rota para o evento.

### 029.CRIAÇÃO DE POSTAGEM
**Dado** que o usuários esteja na home page do aplicativo; 
**Quando** ele clicar no ícone de criar postagem; 
**Então** o sistema irá direcionar ele para uma aba onde ele poderá criar a postagem dele.

### 030.EDIÇÃO DE POSTAGEM EXISTENTE
**Dado** que o usuário esteja no perfil dele; 
**Quando** ele clicar em uma postagem já existente e clicar no ícone de edição; 
**Então** o sistema deve permitir que o usuário possa alterar a postagem, uma vez alterada o sistema deve publicar a edição da postagem.

### 031.AGENDAMENTO DE PUBLICAÇÃO
**Dado** que o usuário esteja na aba de publicar postagem; 
**Quando** ele selecionar a data em em um calendário; 
**Então** o sistema deve publicar a postagem na data selecionada;

### 032.DESTACAR POSTAGENS PRIORITÁRIAS
**Dado** que exista postagens prioritárias; 
**Quando** o usuário atualizar o feed; 
**Então** os posts marcados como “Prioridade” ou “Evento” serão mostradas primeiro com a ordem do mais próximo para o mais afastado.

### 033.ATUALIZAÇÃO AUTOMÁTICA DE LOCALIZAÇÃO DO USUÁRIO
**Dado** que o usuário mude de posição ou vá para outra área ou cidade; 
**Quando** ele clicar no acessar o aplicativo novamente; 
**Então** o sistema deve reconhecer que ele está em outro lugar ou cidade e mostrar os posts relacionados aquele lugar.

### 034.EXCLUSÃO DE POSTAGEM
**Dado** que o usuário esteja na aba de configuração da postagem; 
**Quando** o usuário clicar na opção de excluir postagem; 
**Então** o sistema deve deletar a postagem do banco de dados. 

### 035.VISUALIZAR NOTIFICAÇÕES
**Dado** que o usuário esteja na home page do aplicativo; 
**Quando** ele clicar no ícone de notificação; 
**Então** o sistema deve apresentar para o usuário todas as notificações para ele, novos posts, eventos, novos comércios e ETC…

### 036.SALVAR EVENTO COMO FAVORITO
**Dado** que o usuário esteja visualizando um post de um evento; 
**Quando** ele clicar no ícone de salvar (parecido com uma bandeira); 
**Então** o sistema deverá armazenar o evento em uma aba específica de “Posts Salvos”.

### 037.COMPARTILHAR EVENTO EXTERNAMENTE
**Dado** que o usuário esteja visualizando um post de um evento; 
**Quando** ele clicar no ícone de compartilhar; 
**Então** o sistema deve criar um link daquela postagem/evento, podendo ser compartilhado para outras pessoas.

### 038.BACKUP E RESTAURAÇÃO DA BASE DE DADOS
**Dado** que eu seja o administrador e esteja na área de manutenção; 
**Quando** eu selecionar a opção de “Gerar backup”; 
**Então** o sistema deve criar um arquivo compactado com todos os dados atuais e exibir uma mensagem de confirmação de download.

### 039.PRIORIZAR EXIBIÇÃO DE SERVIÇOS ESSENCIAIS
**Dado** que o usuário esteja na aba de publicar uma postagem; 
**Quando** ele selecionar a opção de postagem prioritária; 
**Então** o sistema irá avaliar se a postagem é realmente válida.

### 040.EXIBIR CAMPOS OBRIGATÓRIOS CONFORME TIPO DE POSTAGEM
**Dado** que o usuário esteja na home page; 
**Quando** ele clicar em criar postagem; 
**Então** o sistema deverá apresentar para ele os campos obrigatórios (Ex: evento, Campo obrigatório: endereço).
