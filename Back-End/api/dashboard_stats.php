<?php
session_start();
require_once '../conexao.php';

header('Content-Type: application/json');

if (!$pdo) {
    echo json_encode(["status" => "error", "message" => "Erro de conexão com o banco de dados."]);
    exit;
}

try {
    $stats = [
        "alunos" => 0,
        "turmas" => 0,
        "funcionarios" => 0
    ];

    $stmtAlunos = $pdo->query("SELECT COUNT(*) as qtd FROM alunos");
    $stats["alunos"] = $stmtAlunos->fetch(PDO::FETCH_ASSOC)['qtd'];

    $stmtTurmas = $pdo->query("SELECT COUNT(*) as qtd FROM turmas");
    $stats["turmas"] = $stmtTurmas->fetch(PDO::FETCH_ASSOC)['qtd'];

    $stmtFunc = $pdo->query("SELECT COUNT(*) as qtd FROM funcionarios");
    $stats["funcionarios"] = $stmtFunc->fetch(PDO::FETCH_ASSOC)['qtd'];

    echo json_encode(["status" => "success", "data" => $stats]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Erro ao buscar dados do dashboard.", "error" => $e->getMessage()]);
}
?>
