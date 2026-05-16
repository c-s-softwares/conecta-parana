# Glossário Técnico - Conecta Paraná

Este documento detalha a infraestrutura e as ferramentas tecnológicas que sustentam a plataforma.

---

### API REST (NestJS)
- **Definição:** Interface que utiliza **NestJS 11** para servir dados via requisições HTTP.
- **Contexto de uso:** Localizada na porta **3000 (Staging)** ou **3001 (Produção)**.

### PostgreSQL + PostGIS
- **Definição:** Banco de dados relacional com extensão para armazenamento e consulta de dados espaciais.
- **Contexto de uso:** Onde ocorrem as buscas por raio de distância e localização.

### Prisma ORM
- **Definição:** Ferramenta que mapeia o código TypeScript para o banco de dados.
- **Contexto de uso:** Utilizado para realizar operações de leitura, escrita e migrações.

### Object Storage (Oracle Cloud)
- **Definição:** Serviço de nuvem para armazenamento de arquivos binários (fotos).
- **Contexto de uso:** A API faz o upload e salva o link de retorno no banco de dados.

### Swagger
- **Definição:** Documentação interativa de todos os endpoints da API.
- **Contexto de uso:** Acessível via rota `/api/docs` para consulta dos desenvolvedores.

### ULID Prefixado
- **Definição:** Identificador Único Universal Ordenável Lexicograficamente (Universally Unique Lexicographically Sortable Identifier) quem tem um prefixo de 4 caracteres que indica a entidade (ex: `usr_01HZX...`).
- **Contexto de uso:** Chave primária padrão em todas as tabelas e referências de chave estrangeira, garantindo formatação type-safe e ordenação baseada no tempo sem depender de autoincrementos do banco.

<!-- Adicione mais termos conforme necessário -->