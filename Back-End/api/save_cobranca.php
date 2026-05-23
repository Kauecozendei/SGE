<?php
session_start();
require_once __DIR__ . '/../conexao.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "Método inválido."]);
    exit;
}

if (!$pdo) {
    echo json_encode(["status" => "error", "message" => "Erro de conexão com o banco de dados."]);
    exit;
}

$aluno_id = filter_input(INPUT_POST, 'aluno_id', FILTER_VALIDATE_INT);
$tipo = filter_input(INPUT_POST, 'tipo', FILTER_DEFAULT);
$valor = filter_input(INPUT_POST, 'valor', FILTER_VALIDATE_FLOAT);
$vencimento = filter_input(INPUT_POST, 'vencimento', FILTER_DEFAULT);
$status = filter_input(INPUT_POST, 'status', FILTER_DEFAULT) ?: 'pendente';
$observacao = filter_input(INPUT_POST, 'observacao', FILTER_DEFAULT);

if (empty($aluno_id) || empty($tipo) || $valor === false || empty($vencimento)) {
    echo json_encode(["status" => "error", "message" => "Por favor, preencha todos os campos obrigatórios."]);
    exit;
}

try {
    $data_pagamento = ($status === 'pago') ? date('Y-m-d') : null;

    $sql = "INSERT INTO financeiro (alunos_id, tipo, data_vencimento, valor, status, observacao, data_pagamento) 
            VALUES (?, ?, ?, ?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$aluno_id, $tipo, $vencimento, $valor, $status, $observacao, $data_pagamento]);

    echo json_encode(["status" => "success", "message" => "Cobrança registrada com sucesso!"]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Erro ao salvar cobrança: " . $e->getMessage()]);
}
?>
