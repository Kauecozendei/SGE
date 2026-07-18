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
    echo json_encode(["status" => "error", "message" => "ID não fornecido."]);
    exit;
}

if (!$pdo) {
    http_response_code(503);
    echo json_encode(["status" => "error", "message" => "Serviço temporariamente indisponível."]);
    exit;
}

try {
    $pdo->beginTransaction();

    $pdo->prepare("DELETE FROM professor_turma_disciplina WHERE professores_id = ?")->execute([$id]);
    $pdo->prepare("DELETE FROM professor_turma WHERE professores_id = ?")->execute([$id]);
    $pdo->prepare("DELETE FROM horarios WHERE funcionarios_id = ?")->execute([$id]);
    $pdo->prepare("DELETE FROM alimentacao WHERE funcionarios_id = ?")->execute([$id]);
    $pdo->prepare("DELETE FROM banhos WHERE funcionarios_id = ?")->execute([$id]);

    $stmt = $pdo->prepare("DELETE FROM funcionarios WHERE id = ? AND cargos_id = 2");
    $stmt->execute([$id]);

    if ($stmt->rowCount() > 0) {
        $pdo->commit();
        echo json_encode(["status" => "success", "message" => "Professor removido com sucesso."]);
    } else {
        $pdo->rollBack();
        echo json_encode(["status" => "error", "message" => "Professor não encontrado."]);
    }
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    tratarErroBanco($e, 'delete_professor');
}
exit;
?>
