<?php
// Inclui a conexão com o banco de dados (que está na pasta pai Back-End)
require_once '../conexao.php';

// Verifica se a requisição é do tipo POST
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    // Recebe os dados do formulário de funcionário
    $nome  = filter_input(INPUT_POST, 'nome', FILTER_SANITIZE_STRING);
    $email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
    $senha = filter_input(INPUT_POST, 'senha', FILTER_DEFAULT); 
    // Exemplo de campos específicos para funcionário:
    $cargo = filter_input(INPUT_POST, 'cargo', FILTER_SANITIZE_STRING);
    $cpf   = filter_input(INPUT_POST, 'cpf', FILTER_SANITIZE_STRING);

    // Validação básica
    if (empty($nome) || empty($email) || empty($senha)) {
        $response = ["status" => "error", "message" => "Por favor, preencha todos os campos obrigatórios."];
    } else {
        // Criptografar a senha
        $senhaHash = password_hash($senha, PASSWORD_DEFAULT);

        if ($pdo) {
            try {
                // Prepara a query SQL para inserção na tabela de funcionários
                $sql = "INSERT INTO funcionarios (nome, email, senha, cargo, cpf) VALUES (:nome, :email, :senha, :cargo, :cpf)";
                $stmt = $pdo->prepare($sql);
                
                // Vincula os parâmetros e executa
                $stmt->execute([
                    ':nome'  => $nome,
                    ':email' => $email,
                    ':senha' => $senhaHash,
                    ':cargo' => $cargo,
                    ':cpf'   => $cpf
                ]);

                $response = ["status" => "success", "message" => "Funcionário cadastrado com sucesso!"];
            } catch (PDOException $e) {
                $response = ["status" => "error", "message" => "Erro ao realizar cadastro de funcionário: " . $e->getMessage()];
            }
        } else {
            // Simulação sem banco
            $response = ["status" => "warning", "message" => "Dados de FUNCIONÁRIO recebidos perfeitamente, mas o banco de dados não está conectado. (Simulação)"];
        }
    }

    // Retorna a resposta em JSON
    header('Content-Type: application/json');
    echo json_encode($response);
    exit;
}
?>
