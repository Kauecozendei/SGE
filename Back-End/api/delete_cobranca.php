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
    $sql = "DELETE FROM financeiro WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$id]);

    echo json_encode(["status" => "success", "message" => "Cobrança cancelada/excluída com sucesso!"]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Erro ao excluir cobrança: " . $e->getMessage()]);
}
?>
