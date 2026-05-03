<?php
// Inclui a conexão com o banco de dados (que está na pasta pai Back-End)
require_once '../conexao.php';

// Verifica se a requisição é do tipo POST
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    // Recebe os dados do formulário de aluno
    $nome  = filter_input(INPUT_POST, 'nome', FILTER_SANITIZE_STRING);
    $email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
    $senha = filter_input(INPUT_POST, 'senha', FILTER_DEFAULT); 
    // Exemplo de campo específico para aluno:
    $matricula = filter_input(INPUT_POST, 'matricula', FILTER_SANITIZE_STRING);

    // Validação básica
    if (empty($nome) || empty($email) || empty($senha)) {
        $response = ["status" => "error", "message" => "Por favor, preencha todos os campos obrigatórios."];
    } else {
        // Criptografar a senha
        $senhaHash = password_hash($senha, PASSWORD_DEFAULT);

        if ($pdo) {
            try {
                // Prepara a query SQL para inserção na tabela de alunos
                $sql = "INSERT INTO alunos (nome, email, senha, matricula) VALUES (:nome, :email, :senha, :matricula)";
                $stmt = $pdo->prepare($sql);
                
                // Vincula os parâmetros e executa
                $stmt->execute([
                    ':nome'      => $nome,
                    ':email'     => $email,
                    ':senha'     => $senhaHash,
                    ':matricula' => $matricula
                ]);

                $response = ["status" => "success", "message" => "Aluno cadastrado com sucesso!"];
            } catch (PDOException $e) {
                $response = ["status" => "error", "message" => "Erro ao realizar cadastro de aluno: " . $e->getMessage()];
            }
        } else {
            // Simulação sem banco
            $response = ["status" => "warning", "message" => "Dados de ALUNO recebidos perfeitamente, mas o banco de dados não está conectado. (Simulação)"];
        }
    }

    // Retorna a resposta em JSON
    header('Content-Type: application/json');
    echo json_encode($response);
    exit;
}
?>
