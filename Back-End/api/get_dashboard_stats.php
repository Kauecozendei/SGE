<?php
require_once __DIR__ . '/../auth_guard.php';
require_once __DIR__ . '/../conexao.php';

verificarAutenticacao();

$response = [
    "status" => "success",
    "total_alunos" => 0,
    "professores_ativos" => 0,
    "turmas_abertas" => 0,
    "mensalidades_pendentes" => 0,
    "ultimos_alunos" => [],
    "agenda_hoje" => [],
    "avisos" => []
];

if (!$pdo) {
    http_response_code(503);
    echo json_encode(["status" => "error", "message" => "Serviço temporariamente indisponível."]);
    exit;
}

try {
    $stmt = $pdo->query("SELECT COUNT(*) FROM alunos");
    $response['total_alunos'] = (int)$stmt->fetchColumn();

    $stmt = $pdo->query("SELECT COUNT(*) FROM funcionarios WHERE cargos_id = 2");
    $response['professores_ativos'] = (int)$stmt->fetchColumn();

    $stmt = $pdo->query("SELECT COUNT(*) FROM turmas");
    $response['turmas_abertas'] = (int)$stmt->fetchColumn();

    $stmt = $pdo->query("SELECT COUNT(*) FROM financeiro WHERE status = 'pendente'");
    $response['mensalidades_pendentes'] = (int)$stmt->fetchColumn();

    $sql = "
        SELECT a.nome, t.nome as turma, r.nome as responsavel 
        FROM alunos a
        LEFT JOIN aluno_turma at2 ON a.id = at2.alunos_id
        LEFT JOIN turmas t ON at2.turmas_id = t.id
        LEFT JOIN aluno_responsavel ar ON a.id = ar.alunos_id
        LEFT JOIN responsaveis r ON ar.responsaveis_id = r.id
        GROUP BY a.id
        ORDER BY a.id DESC LIMIT 5
    ";
    $stmt = $pdo->query($sql);
    $response['ultimos_alunos'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $sqlAgenda = "SELECT titulo, TIME_FORMAT(hora, '%H:%i') as hora, tipo, descricao FROM agenda WHERE data = CURDATE() ORDER BY hora ASC";
    $stmt = $pdo->query($sqlAgenda);
    $response['agenda_hoje'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $sqlAvisos = "SELECT texto, tipo FROM avisos ORDER BY id DESC LIMIT 5";
    $stmt = $pdo->query($sqlAvisos);
    $response['avisos'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

} catch (PDOException $e) {
    error_log("[SGE] Erro em get_dashboard_stats: " . $e->getMessage());
    $response['status'] = "error";
    $response['message'] = "Erro interno do servidor.";
}

echo json_encode($response);
exit;
?>
