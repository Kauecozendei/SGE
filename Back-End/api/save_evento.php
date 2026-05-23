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

$titulo = filter_input(INPUT_POST, 'titulo', FILTER_DEFAULT);
$data = filter_input(INPUT_POST, 'data', FILTER_DEFAULT);
$hora = filter_input(INPUT_POST, 'hora', FILTER_DEFAULT);
$tipo = filter_input(INPUT_POST, 'tipo', FILTER_DEFAULT);
$descricao = filter_input(INPUT_POST, 'descricao', FILTER_DEFAULT);

if (empty($titulo) || empty($data) || empty($tipo)) {
    echo json_encode(["status" => "error", "message" => "Por favor, preencha todos os campos obrigatórios."]);
    exit;
}

try {
    $horaVal = !empty($hora) ? $hora : null;

    $sql = "INSERT INTO agenda (titulo, data, hora, tipo, descricao) VALUES (?, ?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$titulo, $data, $horaVal, $tipo, $descricao]);

    echo json_encode(["status" => "success", "message" => "Evento agendado com sucesso!"]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Erro ao salvar evento: " . $e->getMessage()]);
}
?>
