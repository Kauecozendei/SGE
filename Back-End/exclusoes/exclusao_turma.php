<?php
session_start();
require_once '../conexao.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $id = filter_input(INPUT_POST, 'id', FILTER_SANITIZE_NUMBER_INT);

    if (empty($id)) {
        echo json_encode(["status" => "error", "message" => "ID da turma não fornecido."]);
        exit;
    }

    if ($pdo) {
        try {
            $pdo->beginTransaction();

            // Deleta relações da turma
            $pdo->prepare("DELETE FROM aluno_turma WHERE turmas_id = :id")->execute([':id' => $id]);
            $pdo->prepare("DELETE FROM professor_turma WHERE turmas_id = :id")->execute([':id' => $id]);

            // Deleta a turma
            $sql = "DELETE FROM turmas WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([':id' => $id]);

            $pdo->commit();
            echo json_encode(["status" => "success", "message" => "Turma removida com sucesso!"]);
        } catch (PDOException $e) {
            $pdo->rollBack();
            echo json_encode(["status" => "error", "message" => "Erro ao realizar remoção de turma: " . $e->getMessage()]);
        }
    } else {
        echo json_encode(["status" => "warning", "message" => "Simulação: Banco desconectado."]);
    }
}
?>
