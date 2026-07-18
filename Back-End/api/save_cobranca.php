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

if (!$pdo) {
    http_response_code(503);
    echo json_encode(["status" => "error", "message" => "Serviço temporariamente indisponível."]);
    exit;
}

$aluno_id = filter_input(INPUT_POST, 'aluno_id', FILTER_VALIDATE_INT);
$tipo = sanitizarEntrada(filter_input(INPUT_POST, 'tipo', FILTER_DEFAULT));
$valor = filter_input(INPUT_POST, 'valor', FILTER_VALIDATE_FLOAT);
$vencimento = sanitizarEntrada(filter_input(INPUT_POST, 'vencimento', FILTER_DEFAULT));
$status = sanitizarEntrada(filter_input(INPUT_POST, 'status', FILTER_DEFAULT)) ?: 'pendente';
$observacao = sanitizarEntrada(filter_input(INPUT_POST, 'observacao', FILTER_DEFAULT));

if (empty($aluno_id) || empty($tipo) || $valor === false || empty($vencimento)) {
    echo json_encode(["status" => "error", "message" => "Por favor, preencha todos os campos obrigatórios."]);
    exit;
}

// Validar data de vencimento
if (!validarData($vencimento)) {
    echo json_encode(["status" => "error", "message" => "Data de vencimento inválida."]);
    exit;
}

// Validar valor positivo
if ($valor <= 0) {
    echo json_encode(["status" => "error", "message" => "O valor deve ser maior que zero."]);
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
    tratarErroBanco($e, 'save_cobranca');
}
?>
