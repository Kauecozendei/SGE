<?php
session_start();
require_once '../conexao.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $id = filter_input(INPUT_POST, 'id', FILTER_SANITIZE_NUMBER_INT);

    if (empty($id)) {
        echo json_encode(["status" => "error", "message" => "ID do funcionário não fornecido."]);
        exit;
    }

    if ($pdo) {
        try {
            $pdo->beginTransaction();

            // Deleta das tabelas dependentes
            $pdo->prepare("DELETE FROM professor_turma WHERE professores_id = :id")->execute([':id' => $id]);
            $pdo->prepare("DELETE FROM professor_turma_disciplina WHERE professores_id = :id")->execute([':id' => $id]);
            $pdo->prepare("DELETE FROM horarios WHERE funcionarios_id = :id")->execute([':id' => $id]);

            // Deleta o funcionário
            $sql = "DELETE FROM funcionarios WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([':id' => $id]);

            $pdo->commit();
            echo json_encode(["status" => "success", "message" => "Funcionário removido com sucesso!"]);
        } catch (PDOException $e) {
            $pdo->rollBack();
            echo json_encode(["status" => "error", "message" => "Erro ao realizar remoção de funcionário: " . $e->getMessage()]);
        }
    } else {
        echo json_encode(["status" => "warning", "message" => "Simulação: Banco desconectado."]);
    }
}
?>
