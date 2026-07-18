<?php
require_once __DIR__ . '/../auth_guard.php';
require_once __DIR__ . '/../conexao.php';

verificarAutenticacao();

if (!$pdo) {
    http_response_code(503);
    echo json_encode(["status" => "error", "message" => "Serviço temporariamente indisponível.", "data" => []]);
    exit;
}

try {
    // Paginação
    $pagina = max(1, filter_input(INPUT_GET, 'pagina', FILTER_VALIDATE_INT) ?: 1);
    $limite = min(100, max(10, filter_input(INPUT_GET, 'limite', FILTER_VALIDATE_INT) ?: 50));
    $offset = ($pagina - 1) * $limite;

    $sql = "
        SELECT a.id, a.nome, a.CPF as cpf, a.matricula, a.data_nascimento as nasc, t.nome as turma, t.periodo, r.nome as resp, r.telefone as tel, r.email, ar.relacao as parentesco
        FROM alunos a
        LEFT JOIN aluno_turma at2 ON a.id = at2.alunos_id
        LEFT JOIN turmas t ON at2.turmas_id = t.id
        LEFT JOIN aluno_responsavel ar ON a.id = ar.alunos_id
        LEFT JOIN responsaveis r ON ar.responsaveis_id = r.id
        GROUP BY a.id
        ORDER BY a.id DESC
        LIMIT :limite OFFSET :offset
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':limite', $limite, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $alunos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Total para paginação
    $stmtTotal = $pdo->query("SELECT COUNT(*) FROM alunos");
    $total = (int)$stmtTotal->fetchColumn();

    echo json_encode([
        "status" => "success",
        "data"   => $alunos,
        "total"  => $total,
        "pagina" => $pagina,
        "limite" => $limite
    ]);
} catch (PDOException $e) {
    tratarErroBanco($e, 'get_alunos');
}
?>
