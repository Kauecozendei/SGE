<?php
session_start();
require_once '../conexao.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $id = filter_input(INPUT_POST, 'id', FILTER_SANITIZE_NUMBER_INT);

    if (empty($id)) {
        echo json_encode(["status" => "error", "message" => "ID do horário não fornecido."]);
        exit;
    }

    if ($pdo) {
        try {
            // Deleta o registro de horário (Não tem tabelas dependentes dele)
            $sql = "DELETE FROM horarios WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([':id' => $id]);

            echo json_encode(["status" => "success", "message" => "Horário removido com sucesso!"]);
        } catch (PDOException $e) {
            echo json_encode(["status" => "error", "message" => "Erro ao realizar remoção de horário: " . $e->getMessage()]);
        }
    } else {
        echo json_encode(["status" => "warning", "message" => "Simulação: Banco desconectado."]);
    }
}
?>
