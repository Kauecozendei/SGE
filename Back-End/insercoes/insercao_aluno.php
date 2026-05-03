<?php
// Inclui a conexão com o banco de dados (que está na pasta pai Back-End)
require_once '../conexao.php';

// Verifica se a requisição é do tipo POST
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    // Recebe os dados obrigatórios do formulário de aluno
    $matricula       = filter_input(INPUT_POST, 'matricula', FILTER_SANITIZE_NUMBER_INT);
    $nome            = filter_input(INPUT_POST, 'nome', FILTER_SANITIZE_STRING);
    $data_nascimento = filter_input(INPUT_POST, 'data_nascimento', FILTER_SANITIZE_STRING);
    $instituicoes_id = filter_input(INPUT_POST, 'instituicoes_id', FILTER_SANITIZE_NUMBER_INT);

    // Validação básica dos campos obrigatórios
    if (empty($matricula) || empty($nome) || empty($data_nascimento) || empty($instituicoes_id)) {
        $response = ["status" => "error", "message" => "Por favor, preencha todos os campos obrigatórios (matrícula, nome, data de nascimento e instituição)."];
    } else {
        if ($pdo) {
            try {
                // Prepara a query SQL para inserção na tabela de alunos
                $sql = "INSERT INTO alunos (matricula, nome, data_nascimento, instituicoes_id) VALUES (:matricula, :nome, :data_nascimento, :instituicoes_id)";
                $stmt = $pdo->prepare($sql);
                
                // Vincula os parâmetros e executa
                $stmt->execute([
                    ':matricula'       => $matricula,
                    ':nome'            => $nome,
                    ':data_nascimento' => $data_nascimento,
                    ':instituicoes_id' => $instituicoes_id
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
