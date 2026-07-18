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
    $stats = ["alunos" => 0, "turmas" => 0, "funcionarios" => 0];

    $stats["alunos"] = (int)$pdo->query("SELECT COUNT(*) FROM alunos")->fetchColumn();
    $stats["turmas"] = (int)$pdo->query("SELECT COUNT(*) FROM turmas")->fetchColumn();
    $stats["funcionarios"] = (int)$pdo->query("SELECT COUNT(*) FROM funcionarios")->fetchColumn();

    echo json_encode(["status" => "success", "data" => $stats]);
} catch (PDOException $e) {
    tratarErroBanco($e, 'dashboard_stats');
}
?>
