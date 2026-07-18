<?php
require_once __DIR__ . '/../auth_guard.php';
require_once __DIR__ . '/../conexao.php';

verificarAutenticacao();

$turma_id = filter_input(INPUT_GET, 'turma_id', FILTER_VALIDATE_INT);

if (empty($turma_id)) {
    echo json_encode(["status" => "error", "message" => "ID da turma é obrigatório."]);
    exit;
}

if (!$pdo) {
    http_response_code(503);
    echo json_encode(["status" => "error", "message" => "Serviço temporariamente indisponível.", "data" => []]);
    exit;
}

try {
    $sql = "
        SELECT a.id, a.nome, a.matricula
        FROM aluno_turma alt
        JOIN alunos a ON alt.alunos_id = a.id
        WHERE alt.turmas_id = :turma_id AND alt.data_fim IS NULL
        ORDER BY a.nome ASC
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':turma_id' => $turma_id]);
    $alunos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["status" => "success", "data" => $alunos]);
} catch (PDOException $e) {
    tratarErroBanco($e, 'get_alunos_turma');
}
?>
