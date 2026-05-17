<?php
session_start();
require_once '../conexao.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $id = filter_input(INPUT_POST, 'id', FILTER_SANITIZE_NUMBER_INT);

    if (empty($id)) {
        echo json_encode(["status" => "error", "message" => "ID do responsável não fornecido."]);
        exit;
    }

    if ($pdo) {
        try {
            $pdo->beginTransaction();

            // Deleta relações do responsável com os alunos
            $pdo->prepare("DELETE FROM aluno_responsavel WHERE responsaveis_id = :id")->execute([':id' => $id]);

            // Deleta o responsável
            $sql = "DELETE FROM responsaveis WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([':id' => $id]);

            $pdo->commit();
            echo json_encode(["status" => "success", "message" => "Responsável removido com sucesso!"]);
        } catch (PDOException $e) {
            $pdo->rollBack();
            echo json_encode(["status" => "error", "message" => "Erro ao realizar remoção de responsável: " . $e->getMessage()]);
        }
    } else {
        echo json_encode(["status" => "warning", "message" => "Simulação: Banco desconectado."]);
    }
}
?>
