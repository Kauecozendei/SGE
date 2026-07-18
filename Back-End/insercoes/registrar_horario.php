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

$aluno_id = filter_input(INPUT_POST, 'aluno_id', FILTER_VALIDATE_INT);
$tipo = sanitizarEntrada(filter_input(INPUT_POST, 'tipo', FILTER_DEFAULT));
$observacao = sanitizarEntrada(filter_input(INPUT_POST, 'observacao', FILTER_DEFAULT));

$funcionarios_id = $_SESSION['usuario_id'];
$data = date('Y-m-d');
$horario = date('H:i:s');

if (empty($aluno_id) || empty($tipo)) {
    echo json_encode(["status" => "error", "message" => "Preencha os campos obrigatórios."]);
    exit;
}

// Validar tipo permitido
if (!in_array($tipo, ['entrada', 'saida'])) {
    echo json_encode(["status" => "error", "message" => "Tipo de registro inválido."]);
    exit;
}

if (!$pdo) {
    http_response_code(503);
    echo json_encode(["status" => "error", "message" => "Serviço temporariamente indisponível."]);
    exit;
}

try {
    $sql = "INSERT INTO horarios (alunos_id, data, horario, tipo, observacao, funcionarios_id) 
            VALUES (:aluno_id, :data, :horario, :tipo, :observacao, :funcionarios_id)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':aluno_id' => $aluno_id, ':data' => $data, ':horario' => $horario,
        ':tipo' => $tipo, ':observacao' => $observacao, ':funcionarios_id' => $funcionarios_id
    ]);

    echo json_encode(["status" => "success", "message" => ucfirst($tipo) . " registrada com sucesso!"]);
} catch (PDOException $e) {
    tratarErroBanco($e, 'registrar_horario');
}
?>
