<?php
session_start();
require_once '../conexao.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    $aluno_id = filter_input(INPUT_POST, 'aluno_id', FILTER_SANITIZE_NUMBER_INT);
    $tipo = filter_input(INPUT_POST, 'tipo', FILTER_SANITIZE_STRING); // 'entrada' ou 'saida'
    $observacao = filter_input(INPUT_POST, 'observacao', FILTER_SANITIZE_STRING);
    
    // Opcional, se o usuário estiver logado
    $funcionarios_id = isset($_SESSION['usuario_id']) ? $_SESSION['usuario_id'] : 1;
    $data = date('Y-m-d');
    $horario = date('H:i:s');

    if (empty($aluno_id) || empty($tipo)) {
        echo json_encode(["status" => "error", "message" => "Preencha os campos obrigatórios."]);
        exit;
    }

    if ($pdo) {
        try {
            $sql = "INSERT INTO horarios (alunos_id, data, horario, tipo, observacao, funcionarios_id) 
                    VALUES (:aluno_id, :data, :horario, :tipo, :observacao, :funcionarios_id)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':aluno_id' => $aluno_id,
                ':data' => $data,
                ':horario' => $horario,
                ':tipo' => $tipo,
                ':observacao' => $observacao,
                ':funcionarios_id' => $funcionarios_id
            ]);

            echo json_encode(["status" => "success", "message" => ucfirst($tipo) . " registrada com sucesso!"]);
        } catch (PDOException $e) {
            echo json_encode(["status" => "error", "message" => "Erro ao registrar horário.", "error" => $e->getMessage()]);
        }
    } else {
        echo json_encode(["status" => "warning", "message" => "Simulação: Banco desconectado."]);
    }
}
?>
