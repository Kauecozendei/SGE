<?php
session_start();
require_once '../conexao.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $id = filter_input(INPUT_POST, 'id', FILTER_SANITIZE_NUMBER_INT);

    if (empty($id)) {
        echo json_encode(["status" => "error", "message" => "ID do aluno não fornecido."]);
        exit;
    }

    if ($pdo) {
        try {
            $pdo->beginTransaction();

            // Deleta das tabelas dependentes
            $pdo->prepare("DELETE FROM aluno_turma WHERE alunos_id = :id")->execute([':id' => $id]);
            $pdo->prepare("DELETE FROM aluno_responsavel WHERE alunos_id = :id")->execute([':id' => $id]);
            $pdo->prepare("DELETE FROM horarios WHERE alunos_id = :id")->execute([':id' => $id]);
            
            // Tabelas extras caso existam no BD
            $pdo->prepare("DELETE FROM alimentacao WHERE alunos_id = :id")->execute([':id' => $id]);
            $pdo->prepare("DELETE FROM banhos WHERE alunos_id = :id")->execute([':id' => $id]);
            $pdo->prepare("DELETE FROM restricoes_alimentares WHERE alunos_id = :id")->execute([':id' => $id]);

            // Deleta o aluno
            $sql = "DELETE FROM alunos WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([':id' => $id]);

            $pdo->commit();
            echo json_encode(["status" => "success", "message" => "Aluno removido com sucesso!"]);
        } catch (PDOException $e) {
            $pdo->rollBack();
            echo json_encode(["status" => "error", "message" => "Erro ao realizar remoção de aluno: " . $e->getMessage()]);
        }
    } else {
        echo json_encode(["status" => "warning", "message" => "Simulação: Banco desconectado."]);
    }
}
?>