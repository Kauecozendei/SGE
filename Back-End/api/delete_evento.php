<?php
session_start();
require_once __DIR__ . '/../conexao.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "Método inválido."]);
    exit;
}

if (!$pdo) {
    echo json_encode(["status" => "warning", "message" => "Banco de dados não conectado. Operação simulada com sucesso!"]);
    exit;
}

$id = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);

if (empty($id)) {
    echo json_encode(["status" => "error", "message" => "Preencha o ID do evento a ser removido."]);
    exit;
}

try {
    $sql = "DELETE FROM agenda WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$id]);

    echo json_encode(["status" => "success", "message" => "Evento cancelado com sucesso!"]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Erro ao excluir evento: " . $e->getMessage()]);
}
?>
