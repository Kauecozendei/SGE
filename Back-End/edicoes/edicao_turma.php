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

$id = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);

if (empty($id)) {
    echo json_encode(["status" => "error", "message" => "ID da turma não fornecido."]);
    exit;
}

$updates = [];
$params = [':id' => $id];

if (isset($_POST['nome_turma'])) {
    $updates[] = "nome = :nome";
    $params[':nome'] = sanitizarEntrada(filter_input(INPUT_POST, 'nome_turma', FILTER_DEFAULT));
} else if (isset($_POST['nome'])) {
    $updates[] = "nome = :nome";
    $params[':nome'] = sanitizarEntrada(filter_input(INPUT_POST, 'nome', FILTER_DEFAULT));
}

if (isset($_POST['periodo'])) {
    $updates[] = "periodo = :periodo";
    $params[':periodo'] = sanitizarEntrada(filter_input(INPUT_POST, 'periodo', FILTER_DEFAULT));
}

if (isset($_POST['serie'])) {
    $updates[] = "serie = :serie";
    $params[':serie'] = sanitizarEntrada(filter_input(INPUT_POST, 'serie', FILTER_DEFAULT));
}

if (isset($_POST['sala'])) {
    $updates[] = "sala = :sala";
    $params[':sala'] = sanitizarEntrada(filter_input(INPUT_POST, 'sala', FILTER_DEFAULT));
}

if (isset($_POST['capacidade'])) {
    $updates[] = "capacidade = :capacidade";
    $params[':capacidade'] = filter_input(INPUT_POST, 'capacidade', FILTER_VALIDATE_INT);
}

if (isset($_POST['horario'])) {
    $updates[] = "horario = :horario";
    $params[':horario'] = sanitizarEntrada(filter_input(INPUT_POST, 'horario', FILTER_DEFAULT));
}

if (!$pdo) {
    http_response_code(503);
    echo json_encode(["status" => "error", "message" => "Serviço temporariamente indisponível."]);
    exit;
}

try {
    $pdo->beginTransaction();

    if (!empty($updates)) {
        $sql = "UPDATE turmas SET " . implode(', ', $updates) . " WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
    }

    if (isset($_POST['professor_id'])) {
        $professor_id = filter_input(INPUT_POST, 'professor_id', FILTER_VALIDATE_INT);
        $pdo->prepare("DELETE FROM professor_turma WHERE turmas_id = :turma_id")->execute([':turma_id' => $id]);
        if (!empty($professor_id)) {
            $pdo->prepare("INSERT INTO professor_turma (professores_id, turmas_id) VALUES (:prof_id, :turma_id)")
                ->execute([':prof_id' => $professor_id, ':turma_id' => $id]);
        }
    }

    $pdo->commit();
    echo json_encode(["status" => "success", "message" => "Turma atualizada com sucesso!"]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    tratarErroBanco($e, 'edicao_turma');
}
?>
