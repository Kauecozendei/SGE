<?php
// Inclui a conexão com o banco de dados (que está na pasta pai Back-End)
require_once '../conexao.php';

// Verifica se a requisição é do tipo POST
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    // Recebe os dados obrigatórios do formulário de funcionário
    $nome            = filter_input(INPUT_POST, 'nome', FILTER_SANITIZE_STRING);
    $cpf             = filter_input(INPUT_POST, 'cpf', FILTER_SANITIZE_STRING);
    $data_nascimento = filter_input(INPUT_POST, 'data_nascimento', FILTER_SANITIZE_STRING);
    $cargos_id       = filter_input(INPUT_POST, 'cargos_id', FILTER_SANITIZE_NUMBER_INT);
    
    // O ID da instituição passa a ser automático (ex: ID 1 padrão, ou pego da sessão futuramente)
    $instituicoes_id = 1;

    $telefone        = filter_input(INPUT_POST, 'telefone', FILTER_SANITIZE_STRING);
    $email           = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
    $senha           = filter_input(INPUT_POST, 'senha', FILTER_DEFAULT); 

    // Validação básica dos campos obrigatórios
    if (empty($nome) || empty($cpf) || empty($data_nascimento) || empty($cargos_id) || empty($telefone) || empty($email) || empty($senha)) {
        $response = ["status" => "error", "message" => "Por favor, preencha todos os campos obrigatórios."];
    } else {
        // Criptografar a senha
        $senhaHash = password_hash($senha, PASSWORD_DEFAULT);

        if ($pdo) {
            try {
                // Prepara a query SQL para inserção na tabela de funcionários
                $sql = "INSERT INTO funcionarios (nome, CPF, data_nascimento, cargos_id, instituicoes_id, telefone, email, senha_hash) VALUES (:nome, :cpf, :data_nascimento, :cargos_id, :instituicoes_id, :telefone, :email, :senha_hash)";
                $stmt = $pdo->prepare($sql);
                
                // Vincula os parâmetros e executa
                $stmt->execute([
                    ':nome'            => $nome,
                    ':cpf'             => $cpf,
                    ':data_nascimento' => $data_nascimento,
                    ':cargos_id'       => $cargos_id,
                    ':instituicoes_id' => $instituicoes_id,
                    ':telefone'        => $telefone,
                    ':email'           => $email,
                    ':senha_hash'      => $senhaHash
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
