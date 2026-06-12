<?php
session_start();
require_once __DIR__ . '/../conexao.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $id = filter_input(INPUT_POST, 'id', FILTER_SANITIZE_NUMBER_INT);

    if (empty($id)) {
        echo json_encode(["status" => "error", "message" => "ID não fornecido."]);
        exit;
    }

    if ($pdo) {
        try {
            $pdo->beginTransaction();
            // relations
            $pdo->prepare("DELETE FROM professor_turma_disciplina WHERE professores_id = ?")->execute([$id]);
            $pdo->prepare("DELETE FROM professor_turma WHERE professores_id = ?")->execute([$id]);
            $pdo->prepare("DELETE FROM horarios WHERE funcionarios_id = ?")->execute([$id]);
            $pdo->prepare("DELETE FROM alimentacao WHERE funcionarios_id = ?")->execute([$id]);
            $pdo->prepare("DELETE FROM banhos WHERE funcionarios_id = ?")->execute([$id]);
            
            $stmt = $pdo->prepare("DELETE FROM funcionarios WHERE id = ? AND cargos_id = 2");
            $stmt->execute([$id]);

            $pdo->commit();
            echo json_encode(["status" => "success", "message" => "Professor removido com sucesso."]);
        } catch (PDOException $e) {
            $pdo->rollBack();
            echo json_encode(["status" => "error", "message" => "Erro ao remover: " . $e->getMessage()]);
        }
    } else {
        echo json_encode(["status" => "warning", "message" => "Banco não conectado (Simulação)."]);
    }
    exit;
}
?>
