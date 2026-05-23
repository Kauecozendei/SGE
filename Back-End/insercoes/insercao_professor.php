<?php
require_once '../conexao.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $nome            = filter_input(INPUT_POST, 'nome', FILTER_SANITIZE_STRING);
    $cpf             = filter_input(INPUT_POST, 'cpf', FILTER_SANITIZE_STRING);
    $telefone        = filter_input(INPUT_POST, 'telefone', FILTER_SANITIZE_STRING);
    $email           = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
    $senha           = filter_input(INPUT_POST, 'senha', FILTER_DEFAULT); 
    
    $cargos_id       = 1; 
    $instituicoes_id = 1; 
    $data_nascimento = '1980-01-01'; // Padrão caso não seja enviado no form

    if (empty($nome) || empty($cpf) || empty($email) || empty($senha)) {
        $response = ["status" => "error", "message" => "Por favor, preencha os campos obrigatórios."];
    } else {
        $senhaHash = password_hash($senha, PASSWORD_DEFAULT);

        if ($pdo) {
            try {
                $sql = "INSERT INTO funcionarios (nome, CPF, data_nascimento, cargos_id, instituicoes_id, telefone, email, senha_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$nome, $cpf, $data_nascimento, $cargos_id, $instituicoes_id, $telefone, $email, $senhaHash]);
                $response = ["status" => "success", "message" => "Professor cadastrado com sucesso!"];
            } catch (PDOException $e) {
                $response = ["status" => "error", "message" => "Erro ao realizar cadastro: " . $e->getMessage()];
            }
        } else {
            $response = ["status" => "warning", "message" => "Dados recebidos, mas banco não conectado (Simulação)."];
        }
    }
    header('Content-Type: application/json');
    echo json_encode($response);
    exit;
}
?>
