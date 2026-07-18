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

$aluno_id = filter_input(INPUT_POST, 'aluno_id', FILTER_VALIDATE_INT);
$turma_id = filter_input(INPUT_POST, 'turma_id', FILTER_VALIDATE_INT);

if (empty($aluno_id) || empty($turma_id)) {
    echo json_encode(["status" => "error", "message" => "Aluno e Turma são obrigatórios."]);
    exit;
}

if (!$pdo) {
    http_response_code(503);
    echo json_encode(["status" => "error", "message" => "Serviço temporariamente indisponível."]);
    exit;
}

try {
    $sql = "DELETE FROM aluno_turma WHERE alunos_id = :aluno_id AND turmas_id = :turma_id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':aluno_id' => $aluno_id, ':turma_id' => $turma_id]);

    echo json_encode(["status" => "success", "message" => "Aluno removido da turma com sucesso!"]);
} catch (PDOException $e) {
    tratarErroBanco($e, 'remover_aluno_turma');
}
?>
