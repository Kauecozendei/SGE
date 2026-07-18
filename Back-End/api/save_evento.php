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
$titulo = sanitizarEntrada(filter_input(INPUT_POST, 'titulo', FILTER_DEFAULT));
$data = sanitizarEntrada(filter_input(INPUT_POST, 'data', FILTER_DEFAULT));
$hora = sanitizarEntrada(filter_input(INPUT_POST, 'hora', FILTER_DEFAULT));
$tipo = sanitizarEntrada(filter_input(INPUT_POST, 'tipo', FILTER_DEFAULT));
$descricao = sanitizarEntrada(filter_input(INPUT_POST, 'descricao', FILTER_DEFAULT));

if (empty($titulo) || empty($data) || empty($tipo)) {
    echo json_encode(["status" => "error", "message" => "Por favor, preencha todos os campos obrigatórios."]);
    exit;
}

if (!validarData($data)) {
    echo json_encode(["status" => "error", "message" => "Data inválida."]);
    exit;
}

try {
    $horaVal = !empty($hora) ? $hora : null;

    if (!empty($id)) {
        $sql = "UPDATE agenda SET titulo = ?, data = ?, hora = ?, tipo = ?, descricao = ? WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$titulo, $data, $horaVal, $tipo, $descricao, $id]);
        $message = "Evento atualizado com sucesso!";
    } else {
        $sql = "INSERT INTO agenda (titulo, data, hora, tipo, descricao) VALUES (?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$titulo, $data, $horaVal, $tipo, $descricao]);
        $message = "Evento agendado com sucesso!";
    }

    echo json_encode(["status" => "success", "message" => $message]);
} catch (PDOException $e) {
    tratarErroBanco($e, 'save_evento');
}
?>
