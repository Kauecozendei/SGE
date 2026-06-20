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

    if (!empty($id)) {
        // Modo Edição
        $sql = "UPDATE agenda SET titulo = ?, data = ?, hora = ?, tipo = ?, descricao = ? WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$titulo, $data, $horaVal, $tipo, $descricao, $id]);
        $message = "Evento atualizado com sucesso!";
    } else {
        // Modo Inserção
        $sql = "INSERT INTO agenda (titulo, data, hora, tipo, descricao) VALUES (?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$titulo, $data, $horaVal, $tipo, $descricao]);
        $message = "Evento agendado com sucesso!";
    }

    echo json_encode(["status" => "success", "message" => $message]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Erro ao salvar evento: " . $e->getMessage()]);
}
?>
