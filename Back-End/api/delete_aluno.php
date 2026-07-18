<?php
require_once __DIR__ . '/../auth_guard.php';
require_once __DIR__ . '/../conexao.php';

verificarAutenticacao();
validarCSRF();

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Método inválido."]);
    exit;
}

$id = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);

if (empty($id)) {
    echo json_encode(["status" => "error", "message" => "ID do aluno não fornecido."]);
    exit;
}

if (!$pdo) {
    http_response_code(503);
    echo json_encode(["status" => "error", "message" => "Serviço temporariamente indisponível."]);
    exit;
}

try {
    $pdo->beginTransaction();

    // Deletar relações primeiro
    $pdo->prepare("DELETE FROM aluno_responsavel WHERE alunos_id = ?")->execute([$id]);
    $pdo->prepare("DELETE FROM aluno_turma WHERE alunos_id = ?")->execute([$id]);
    $pdo->prepare("DELETE FROM restricoes_alimentares WHERE alunos_id = ?")->execute([$id]);
    $pdo->prepare("DELETE FROM horarios WHERE alunos_id = ?")->execute([$id]);
    $pdo->prepare("DELETE FROM alimentacao WHERE alunos_id = ?")->execute([$id]);
    $pdo->prepare("DELETE FROM banhos WHERE alunos_id = ?")->execute([$id]);
    $pdo->prepare("DELETE FROM financeiro WHERE alunos_id = ?")->execute([$id]);

    // Deletar aluno
    $stmt = $pdo->prepare("DELETE FROM alunos WHERE id = ?");
    $stmt->execute([$id]);

    $pdo->commit();
    echo json_encode(["status" => "success", "message" => "Aluno removido com sucesso."]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    tratarErroBanco($e, 'delete_aluno');
}
exit;
?>
