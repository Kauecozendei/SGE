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

$id = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);

if (empty($id)) {
    echo json_encode(["status" => "error", "message" => "ID da cobrança inválido."]);
    exit;
}

try {
    $data_pagamento = date('Y-m-d');
    $sql = "UPDATE financeiro SET status = 'pago', data_pagamento = ? WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$data_pagamento, $id]);

    echo json_encode(["status" => "success", "message" => "Pagamento confirmado com sucesso!"]);
} catch (PDOException $e) {
    tratarErroBanco($e, 'confirmar_pagamento');
}
?>
