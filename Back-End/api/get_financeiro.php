<?php
require_once __DIR__ . '/../auth_guard.php';
require_once __DIR__ . '/../conexao.php';

verificarAutenticacao();

if (!$pdo) {
    http_response_code(503);
    echo json_encode(["status" => "error", "message" => "Serviço temporariamente indisponível."]);
    exit;
}

try {
    // 1. Calcular somas
    $stmtPrevisto = $pdo->query("SELECT COALESCE(SUM(valor), 0) FROM financeiro");
    $total_previsto = (float)$stmtPrevisto->fetchColumn();

    $stmtRecebido = $pdo->query("SELECT COALESCE(SUM(valor), 0) FROM financeiro WHERE status = 'pago'");
    $recebido = (float)$stmtRecebido->fetchColumn();

    $stmtPendente = $pdo->query("SELECT COALESCE(SUM(valor), 0) FROM financeiro WHERE status = 'pendente'");
    $pendente = (float)$stmtPendente->fetchColumn();

    $stmtAtrasado = $pdo->query("SELECT COALESCE(SUM(valor), 0) FROM financeiro WHERE status = 'atrasado'");
    $atrasado = (float)$stmtAtrasado->fetchColumn();

    // 2. Calcular contagens
    $stmtCounts = $pdo->query("
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'pago' THEN 1 ELSE 0 END) as pago,
            SUM(CASE WHEN status = 'pendente' THEN 1 ELSE 0 END) as pendente,
            SUM(CASE WHEN status = 'atrasado' THEN 1 ELSE 0 END) as atrasado
        FROM financeiro
    ");
    $counts = $stmtCounts->fetch(PDO::FETCH_ASSOC);

    // 3. Listar cobranças com paginação
    $pagina = max(1, filter_input(INPUT_GET, 'pagina', FILTER_VALIDATE_INT) ?: 1);
    $limite = min(100, max(10, filter_input(INPUT_GET, 'limite', FILTER_VALIDATE_INT) ?: 50));
    $offset = ($pagina - 1) * $limite;

    $sql = "
        SELECT 
            f.id,
            f.alunos_id,
            a.nome as aluno,
            t.nome as turma,
            f.tipo,
            f.data_vencimento,
            f.valor,
            f.status,
            f.observacao
        FROM financeiro f
        JOIN alunos a ON f.alunos_id = a.id
        LEFT JOIN aluno_turma atu ON a.id = atu.alunos_id AND atu.data_fim IS NULL
        LEFT JOIN turmas t ON atu.turmas_id = t.id
        ORDER BY f.data_vencimento DESC, f.id DESC
        LIMIT :limite OFFSET :offset
    ";
    $stmtData = $pdo->prepare($sql);
    $stmtData->bindValue(':limite', $limite, PDO::PARAM_INT);
    $stmtData->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmtData->execute();
    $cobrancas = $stmtData->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "total_previsto" => $total_previsto,
        "recebido" => $recebido,
        "pendente" => $pendente,
        "atrasado" => $atrasado,
        "counts" => [
            "total" => (int)$counts['total'],
            "pago" => (int)$counts['pago'],
            "pendente" => (int)$counts['pendente'],
            "atrasado" => (int)$counts['atrasado']
        ],
        "data" => $cobrancas
    ]);

} catch (PDOException $e) {
    tratarErroBanco($e, 'get_financeiro');
}
?>
