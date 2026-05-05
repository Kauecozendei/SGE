# Documentação: Tela de Login e Autenticação

Este documento descreve a estrutura e a lógica implementadas para a nova tela de login de funcionários do Sistema de Gestão Escolar (SGE).

## 1. Estrutura de Diretórios Criada

Foi criada uma nova pasta raiz chamada `Front-End` para separar os arquivos de interface de usuário (HTML/CSS/JS) da lógica de negócios e banco de dados (PHP), mantendo uma arquitetura mais limpa.

```text
SGE/
├── Back-End/
│   ├── login_funcionario.php  <-- Novo endpoint criado
│   └── ...
├── Front-End/
│   ├── css/
│   │   └── style.css          <-- Estilos do login
│   ├── js/
│   │   └── login.js           <-- Integração Front -> Back
│   └── login.html             <-- Estrutura visual principal
```

## 2. Front-End (Interface de Usuário)

### `login.html`
- **Objetivo**: Renderizar o formulário de acesso para os funcionários.
- **Componentes principais**:
  - `div.login-card`: Card centralizado com efeito "glass" e cantos arredondados.
  - `form#loginForm`: Formulário contendo os inputs para `email` e `senha`.
  - `div#errorBox`: Caixa de mensagem de erro (vermelha) que inicia oculta (`hidden`) e só é exibida caso haja falha no acesso.

### `css/style.css`
- **Objetivo**: Garantir que a tela seja responsiva, moderna e idêntica à imagem de referência.
- **Características**:
  - `body`: Configurado para receber uma imagem de fundo estampada e centralizar todo o conteúdo no meio da tela (uso de `Flexbox`).
  - Inputs e botões com transições (`transition: all 0.3s ease`) que geram feedbacks visuais (mudança de cor da borda, sombreamento) ao passar o mouse ou clicar.

### `js/login.js`
- **Objetivo**: Interceptar o envio do formulário, evitando que a página sofra um *reload* (recarregamento) indesejado, garantindo uma experiência mais fluida (SPA - Single Page Application).
- **Lógica**:
  1. O usuário clica em "Entrar no Sistema".
  2. O JS captura o `email` e a `senha`.
  3. Desabilita o botão para impedir duplo-clique.
  4. Dispara uma requisição `POST` para `../Back-End/login_funcionario.php` através da API `fetch`.
  5. Se o servidor responder `{"status": "success"}`, redireciona o usuário para `../index.php` (ou para o dashboard futuro).
  6. Se o servidor responder `{"status": "error"}`, o JS exibe a `errorBox` com a mensagem retornada pelo PHP ("E-mail ou senha inválidos").

## 3. Back-End (Lógica de Autenticação)

### `login_funcionario.php`
- **Objetivo**: Receber as credenciais do front-end, validar no banco de dados e iniciar a sessão do usuário.
- **Fluxo de Dados**:
  1. **Inicialização**: Executa `session_start()` e inclui o arquivo de `conexao.php`.
  2. **Sanitização**: Pega as variáveis `$_POST['email']` (sanitizado) e `$_POST['senha']` (sem sanitização para manter os caracteres especiais da senha).
  3. **Busca no Banco**:
     ```sql
     SELECT id, nome, email, senha_hash FROM funcionarios WHERE email = :email LIMIT 1
     ```
  4. **Validação e Criptografia**:
     Utiliza a função nativa `password_verify($senha_digitada, $senha_hash_do_banco)` para conferir se a senha informada bate com a hash gerada pelo `password_hash()` (que foi usado na tela de `insercao_funcionario.php`).
  5. **Controle de Sessão**:
     Caso as credenciais estejam corretas, salva os dados na global `$_SESSION` para proteger as rotas internas:
     - `$_SESSION['usuario_id']`
     - `$_SESSION['usuario_nome']`
     - `$_SESSION['tipo_usuario'] = 'funcionario'`
  6. **Retorno**: Devolve um objeto JSON para que o Javascript `login.js` saiba o que fazer com a tela.

## 4. Próximos Passos (To-Do)

1. **Adicionar a imagem de fundo**: Colocar o arquivo de fundo em `Front-End/img/background.png`.
2. **Adicionar o Logo**: Colocar a imagem do logo "Mundo Encantado" em `Front-End/img/logo.png`.
3. **Definir a Rota de Sucesso**: Atualmente, o redirecionamento ao realizar o login com sucesso joga o usuário para o arquivo `index.php`. Quando o Painel (Dashboard) for criado, basta alterar a linha `window.location.href = "../index.php";` dentro de `login.js` para o caminho correto do dashboard.
