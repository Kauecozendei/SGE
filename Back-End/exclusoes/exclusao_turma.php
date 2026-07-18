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
    echo json_encode(["status" => "error", "message" => "ID da turma não fornecido."]);
    exit;
}

if (!$pdo) {
    http_response_code(503);
    echo json_encode(["status" => "error", "message" => "Serviço temporariamente indisponível."]);
    exit;
}

try {
    $pdo->beginTransaction();

    $pdo->prepare("DELETE FROM aluno_turma WHERE turmas_id = :id")->execute([':id' => $id]);
    $pdo->prepare("DELETE FROM professor_turma WHERE turmas_id = :id")->execute([':id' => $id]);
    $pdo->prepare("DELETE FROM professor_turma_disciplina WHERE turmas_id = :id")->execute([':id' => $id]);

    $stmt = $pdo->prepare("DELETE FROM turmas WHERE id = :id");
    $stmt->execute([':id' => $id]);

    $pdo->commit();
    echo json_encode(["status" => "success", "message" => "Turma removida com sucesso!"]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    tratarErroBanco($e, 'exclusao_turma');
}
?>
