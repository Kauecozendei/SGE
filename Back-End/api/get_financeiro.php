<?php
session_start();
require_once __DIR__ . '/../conexao.php';

header('Content-Type: application/json');

if (!$pdo) {
    echo json_encode(["status" => "error", "message" => "Erro de conexão com o banco de dados."]);
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

    // 3. Listar todas as cobranças
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
    ";
    $stmtData = $pdo->query($sql);
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
    echo json_encode(["status" => "error", "message" => "Erro ao buscar dados financeiros: " . $e->getMessage()]);
}
?>
