<?php
// Inclui a conexão com o banco de dados (que está na pasta pai Back-End)
require_once '../conexao.php';

// Verifica se a requisição é do tipo POST
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    // Recebe os dados obrigatórios do formulário de responsável
    $nome            = filter_input(INPUT_POST, 'nome', FILTER_SANITIZE_STRING);
    $cpf             = filter_input(INPUT_POST, 'cpf', FILTER_SANITIZE_STRING);
    $telefone        = filter_input(INPUT_POST, 'telefone', FILTER_SANITIZE_STRING);
    $data_nascimento = filter_input(INPUT_POST, 'data_nascimento', FILTER_SANITIZE_STRING);

    // Validação básica dos campos obrigatórios
    if (empty($nome) || empty($cpf) || empty($telefone) || empty($data_nascimento)) {
        $response = ["status" => "error", "message" => "Por favor, preencha todos os campos obrigatórios (nome, CPF, telefone e data de nascimento)."];
    } else {
        if ($pdo) {
            try {
                // Prepara a query SQL para inserção na tabela de responsáveis
                $sql = "INSERT INTO responsaveis (nome, CPF, telefone, data_nascimento) VALUES (:nome, :cpf, :telefone, :data_nascimento)";
                $stmt = $pdo->prepare($sql);
                
                // Vincula os parâmetros e executa
                $stmt->execute([
                    ':nome'            => $nome,
                    ':cpf'             => $cpf,
                    ':telefone'        => $telefone,
                    ':data_nascimento' => $data_nascimento
                ]);

                $response = ["status" => "success", "message" => "Responsável cadastrado com sucesso!"];
            } catch (PDOException $e) {
                $response = ["status" => "error", "message" => "Erro ao realizar cadastro de responsável: " . $e->getMessage()];
            }
        } else {
            // Simulação sem banco
            $response = ["status" => "warning", "message" => "Dados de RESPONSÁVEL recebidos perfeitamente, mas o banco de dados não está conectado. (Simulação)"];
        }
    }

    // Retorna a resposta em JSON
    header('Content-Type: application/json');
    echo json_encode($response);
    exit;
}
?>
