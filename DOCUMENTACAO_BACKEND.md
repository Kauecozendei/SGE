# Documentação do Back-End (SGE)

Esta documentação fornece uma visão geral técnica e estrutural do back-end do Sistema de Gestão Escolar (SGE). O back-end foi desenvolvido em **PHP (8.2)** utilizando **PDO** para comunicação segura com um banco de dados **MySQL/MariaDB**, orquestrado via **Docker**.

---

## 1. Arquitetura e Infraestrutura

A infraestrutura do banco de dados e as dependências do PHP estão localizadas na pasta `Back-End/db/`.

- **`docker-compose.yml`**: Configuração dos containers Docker. Levanta o banco de dados (MariaDB/MySQL) e expõe as portas necessárias (ex: 3306/3308).
- **`Dockerfile`**: Imagem personalizada do PHP (`php:8.2-cli`) com a extensão `pdo_mysql` habilitada para permitir a comunicação com o banco.
- **`Database_SGE.sql`**: Script DDL/DML que estrutura as tabelas do sistema (`BancoSGE`), como `alunos`, `funcionarios`, `responsaveis`, entre outras.

---

## 2. Configuração de Banco de Dados

### `conexao.php`
Este é o coração do acesso a dados. Ele inicializa a variável global `$pdo` que é importada por todos os outros scripts.
- **Configuração**: Define constantes (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`) para o acesso.
- **Segurança**: Utiliza o modo `PDO::ERRMODE_EXCEPTION` para capturar exceções.
- **Resiliência**: Possui um bloco `try-catch`. Se o banco não estiver online, ele define `$pdo = null` e permite testes (simulações) nas telas de front-end sem quebrar o sistema inteiro com um `Fatal Error`.

---

## 3. Endpoints e Scripts de Ação

Os arquivos na raiz de `Back-End/` e na subpasta `insercoes/` recebem dados (`POST`) do front-end e interagem com o banco de dados devolvendo sempre uma resposta estruturada em **JSON** (`{"status": "...", "message": "..."}`).

### 3.1. Autenticação

#### `login_funcionario.php`
- Responsável pela validação de acesso dos funcionários.
- Recebe `email` e `senha` via `POST`.
- Busca o funcionário pelo e-mail com `Prepared Statements` para evitar **SQL Injection**.
- Utiliza a função nativa `password_verify()` para validar a senha crua com a `senha_hash` armazenada no banco.
- Inicia e popula a global `$_SESSION` com os dados seguros do usuário autenticado.

### 3.2. Cadastro / Inserções (`/insercoes`)

Esta pasta isola os scripts responsáveis pela criação (Create) de novas entidades no sistema. Todos utilizam sanitização (`filter_input`) para limpar strings e `Prepared Statements` para inserir dados.

- **`insercao_funcionario.php`**: 
  - Recebe: `nome`, `cpf`, `data_nascimento`, `cargos_id`, `telefone`, `email` e `senha`.
  - Criptografa a `senha` imediatamente usando `password_hash(..., PASSWORD_DEFAULT)` antes de salvar na coluna `senha_hash`.
  - Atribui temporariamente `instituicoes_id = 1` por padrão.

- **`insercao_aluno.php`**: 
  - Recebe: `matricula`, `nome`, e `data_nascimento`.
  - Vincula o aluno automaticamente a uma instituição (`instituicoes_id = 1`).

- **`insercao_responsavel.php` (na pasta insercoes)**: 
  - Focado em dados cadastrais fiscais.
  - Recebe: `nome`, `cpf`, `telefone` e `data_nascimento`.

- **`insercao_responsavel.php` (na raiz do Back-End)**: 
  - Focado no cadastro de acesso do responsável.
  - Recebe: `nome`, `email`, `senha` (que é convertida para Hash) e `telefone`.

### 3.3. Outros Scripts
- **`edicao.php`**: Script reservado para o processamento de atualização (Update) de registros (ex: editar perfil, dados de alunos).
- **`exclusao.php`**: Script reservado para a remoção (Delete) ou inativação de registros do banco de dados.

---

## 4. Segurança Adotada

- **Prevenção contra SQL Injection**: Uso obrigatório de instâncias preparadas (`$pdo->prepare()`) em todas as queries.
- **Proteção de Senhas**: As senhas nunca trafegam em texto puro para o banco e não são descriptografáveis (uso de Bcrypt/Argon2 via `password_hash`).
- **Sanitização de Inputs**: Utilização de `filter_input` (como `FILTER_SANITIZE_STRING`, `FILTER_SANITIZE_EMAIL`) impedindo a injeção de HTML malicioso (XSS) nas variáveis de recebimento.
- **Respostas Controladas**: Nenhuma exceção do banco de dados cospe erros diretos no navegador (se bem configurado), o sistema converte erros de banco (`PDOException`) em retornos JSON genéricos, como `"Erro de servidor"`.

---

## 5. Como Testar as APIs do Back-End

Para testar os endpoints sem precisar de um front-end (já que a interface foi excluída), você pode utilizar ferramentas como **Postman**, **Insomnia** ou comandos **cURL**:

Exemplo de inserção de aluno via cURL:
```bash
curl -X POST http://localhost/SGE/Back-End/insercoes/insercao_aluno.php \
     -d "matricula=12345" \
     -d "nome=João Silva" \
     -d "data_nascimento=2015-05-10"
```
