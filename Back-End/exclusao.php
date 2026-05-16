<?php
session_start();
require_once 'conexao.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $tabela = filter_input(INPUT_POST, 'tabela', FILTER_SANITIZE_STRING);
    $id = filter_input(INPUT_POST, 'id', FILTER_SANITIZE_NUMBER_INT);

    $tabelas_permitidas = ['alunos', 'funcionarios', 'turmas', 'horarios'];

    if (!in_array($tabela, $tabelas_permitidas)) {
        echo json_encode(["status" => "error", "message" => "Tabela inválida."]);
        exit;
    }

    if (empty($id)) {
        echo json_encode(["status" => "error", "message" => "ID não fornecido."]);
        exit;
    }

    if ($pdo) {
        try {
            $pdo->beginTransaction();

            // Remove referências antes de excluir o registro principal
            if ($tabela === 'alunos') {
                $pdo->prepare("DELETE FROM aluno_turma WHERE alunos_id = :id")->execute([':id' => $id]);
                $pdo->prepare("DELETE FROM aluno_responsavel WHERE alunos_id = :id")->execute([':id' => $id]);
                $pdo->prepare("DELETE FROM horarios WHERE alunos_id = :id")->execute([':id' => $id]);
                $pdo->prepare("DELETE FROM alimentacao WHERE alunos_id = :id")->execute([':id' => $id]);
                $pdo->prepare("DELETE FROM banhos WHERE alunos_id = :id")->execute([':id' => $id]);
                $pdo->prepare("DELETE FROM restricoes_alimentares WHERE alunos_id = :id")->execute([':id' => $id]);
            } else if ($tabela === 'funcionarios') {
                $pdo->prepare("DELETE FROM professor_turma WHERE professores_id = :id")->execute([':id' => $id]);
                $pdo->prepare("DELETE FROM professor_turma_disciplina WHERE professores_id = :id")->execute([':id' => $id]);
                $pdo->prepare("DELETE FROM horarios WHERE funcionarios_id = :id")->execute([':id' => $id]);
            } else if ($tabela === 'turmas') {
                $pdo->prepare("DELETE FROM aluno_turma WHERE turmas_id = :id")->execute([':id' => $id]);
                $pdo->prepare("DELETE FROM professor_turma WHERE turmas_id = :id")->execute([':id' => $id]);
            }

            $sql = "DELETE FROM $tabela WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([':id' => $id]);

            $pdo->commit();
            echo json_encode(["status" => "success", "message" => "Registro removido com sucesso."]);
        } catch (PDOException $e) {
            $pdo->rollBack();
            echo json_encode(["status" => "error", "message" => "Erro ao excluir registro.", "error" => $e->getMessage()]);
        }
    } else {
        echo json_encode(["status" => "warning", "message" => "Simulação: Banco desconectado."]);
    }
}
?>
