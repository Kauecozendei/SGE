<?php
session_start();
require_once __DIR__ . '/../conexao.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $id = filter_input(INPUT_POST, 'id', FILTER_SANITIZE_NUMBER_INT);

    if (empty($id)) {
        echo json_encode(["status" => "error", "message" => "ID do aluno não fornecido."]);
        exit;
    }

    if ($pdo) {
        try {
            $pdo->beginTransaction();

            // Deletar relações primeiro (se não houver CASCADE configurado)
            $pdo->prepare("DELETE FROM aluno_responsavel WHERE alunos_id = ?")->execute([$id]);
            $pdo->prepare("DELETE FROM aluno_turma WHERE alunos_id = ?")->execute([$id]);
            $pdo->prepare("DELETE FROM restricoes_alimentares WHERE alunos_id = ?")->execute([$id]);
            $pdo->prepare("DELETE FROM horarios WHERE alunos_id = ?")->execute([$id]);
            $pdo->prepare("DELETE FROM alimentacao WHERE alunos_id = ?")->execute([$id]);
            $pdo->prepare("DELETE FROM banhos WHERE alunos_id = ?")->execute([$id]);

            // Deletar aluno
            $stmt = $pdo->prepare("DELETE FROM alunos WHERE id = ?");
            $stmt->execute([$id]);

            $pdo->commit();
            
            echo json_encode(["status" => "success", "message" => "Aluno removido com sucesso."]);
        } catch (PDOException $e) {
            $pdo->rollBack();
            echo json_encode(["status" => "error", "message" => "Erro ao remover aluno: " . $e->getMessage()]);
        }
    } else {
        echo json_encode(["status" => "warning", "message" => "Banco não conectado. Simulação de remoção."]);
    }
    exit;
}
?>
