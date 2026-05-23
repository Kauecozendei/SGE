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
    echo json_encode(["status" => "error", "message" => "Erro ao confirmar pagamento: " . $e->getMessage()]);
}
?>
