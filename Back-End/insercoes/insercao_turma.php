<?php
require_once '../conexao.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    $nome = filter_input(INPUT_POST, 'nome_turma', FILTER_SANITIZE_STRING);
    $periodo = filter_input(INPUT_POST, 'periodo', FILTER_SANITIZE_STRING);
    $instituicoes_id = 1; // Default

    if (empty($nome) || empty($periodo)) {
        echo json_encode(["status" => "error", "message" => "Preencha os campos obrigatórios."]);
        exit;
    }

    if ($pdo) {
        try {
            $sqlTurma = "INSERT INTO turmas (nome, periodo, instituicoes_id) VALUES (:nome, :periodo, :inst)";
            $stmtTurma = $pdo->prepare($sqlTurma);
            $stmtTurma->execute([
                ':nome' => $nome,
                ':periodo' => $periodo,
                ':inst' => $instituicoes_id
            ]);

            echo json_encode(["status" => "success", "message" => "Turma cadastrada com sucesso!"]);
        } catch (PDOException $e) {
            echo json_encode(["status" => "error", "message" => "Erro ao salvar turma.", "error" => $e->getMessage()]);
        }
    } else {
        echo json_encode(["status" => "warning", "message" => "Simulação: Banco desconectado."]);
    }
}
?>
