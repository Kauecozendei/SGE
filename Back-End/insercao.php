<?php
// Configurações do Banco de Dados (Pronto para o Docker)
// Quando for conectar ao banco no Docker, altere o DB_HOST para o nome do container do banco (ex: 'db' ou 'mysql') 
// ou deixe 'localhost' se a porta estiver exposta para o host e você estiver rodando o PHP localmente.
define("DB_HOST", "localhost"); // ou '127.0.0.1' ou 'mysql' (se o PHP também estiver no Docker)
define("DB_PORT", "3306"); // Porta padrão do MySQL
define("DB_NAME", "nome_do_seu_banco");
define("DB_USER", "seu_usuario");
define("DB_PASS", "sua_senha");

try {
    // Criação da conexão com o banco de dados usando PDO
    $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
} catch (PDOException $e) {
    // Como o banco ainda não está vinculado, vamos apenas ignorar a falha por enquanto
    // para não quebrar a página ao testar o front-end. Deixamos $pdo como null.
    // Descomente a linha abaixo para debugar erros de conexão futuramente:
    // die("Erro de conexão: " . $e->getMessage()); 
    $pdo = null; 
}

// Verifica se a requisição é do tipo POST (envio do formulário)
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    // Recebe os dados do formulário de forma genérica
    // Aqui usamos campos comuns (nome, email, senha), que podem ser adaptados pro seu front-end
    $nome  = filter_input(INPUT_POST, 'nome', FILTER_SANITIZE_STRING);
    $email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
    $senha = filter_input(INPUT_POST, 'senha', FILTER_DEFAULT); 

    // Validação básica
    if (empty($nome) || empty($email) || empty($senha)) {
        $response = ["status" => "error", "message" => "Por favor, preencha todos os campos obrigatórios."];
    } else {
        // Criptografar a senha antes de salvar no banco (Boa prática de segurança)
        $senhaHash = password_hash($senha, PASSWORD_DEFAULT);

        if ($pdo) {
            try {
                // Prepara a query SQL para inserção. Altere 'usuarios' para o nome correto da sua tabela
                $sql = "INSERT INTO usuarios (nome, email, senha) VALUES (:nome, :email, :senha)";
                $stmt = $pdo->prepare($sql);
                
                // Vincula os parâmetros e executa
                $stmt->execute([
                    ':nome'  => $nome,
                    ':email' => $email,
                    ':senha' => $senhaHash
                ]);

                $response = ["status" => "success", "message" => "Cadastro realizado com sucesso!"];
            } catch (PDOException $e) {
                // Em caso de email duplicado ou outro erro no banco
                $response = ["status" => "error", "message" => "Erro ao realizar cadastro: " . $e->getMessage()];
            }
        } else {
            // Simula o sucesso caso o banco não esteja conectado (Mock para testes do Front-end)
            $response = ["status" => "warning", "message" => "Dados recebidos perfeitamente, mas o banco de dados não está conectado. (Simulação)"];
        }
    }

    // Retorna a resposta em JSON (ideal para chamadas AJAX/Fetch API do front-end)
    header('Content-Type: application/json');
    echo json_encode($response);
    exit;
}
?>