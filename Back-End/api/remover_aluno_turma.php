<?php
session_start();
require_once __DIR__ . '/../conexao.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $aluno_id = filter_input(INPUT_POST, 'aluno_id', FILTER_VALIDATE_INT);
    $turma_id = filter_input(INPUT_POST, 'turma_id', FILTER_VALIDATE_INT);

    if (empty($aluno_id) || empty($turma_id)) {
        echo json_encode(["status" => "error", "message" => "Aluno e Turma são obrigatórios."]);
        exit;
    }

    if ($pdo) {
        try {
            // Remove o registro da tabela aluno_turma
            $sql = "DELETE FROM aluno_turma WHERE alunos_id = :aluno_id AND turmas_id = :turma_id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':aluno_id' => $aluno_id,
                ':turma_id' => $turma_id
            ]);

            echo json_encode(["status" => "success", "message" => "Aluno removido da turma com sucesso!"]);
        } catch (PDOException $e) {
            echo json_encode(["status" => "error", "message" => "Erro ao remover aluno da turma: " . $e->getMessage()]);
        }
    } else {
        echo json_encode(["status" => "warning", "message" => "Banco desconectado."]);
    }
}
?>
