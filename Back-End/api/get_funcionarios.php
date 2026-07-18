<?php
require_once __DIR__ . '/../auth_guard.php';
require_once __DIR__ . '/../conexao.php';

verificarAutenticacao();

if (!$pdo) {
    http_response_code(503);
    echo json_encode(["status" => "error", "message" => "Serviço temporariamente indisponível.", "data" => []]);
    exit;
}

try {
    $sql = "
        SELECT f.id, f.nome, f.CPF as cpf, f.telefone as tel, f.email, f.status, f.formacao, c.nome as cargo
        FROM funcionarios f
        INNER JOIN cargos c ON f.cargos_id = c.id
        WHERE f.cargos_id != 2
        ORDER BY f.id DESC
    ";
    $stmt = $pdo->query($sql);
    $funcionarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($funcionarios as &$f) {
        $f['status'] = $f['status'] ? $f['status'] : 'ativo';
        $f['formacao'] = $f['formacao'] ? $f['formacao'] : '';
        $f['tel'] = $f['tel'] ? $f['tel'] : '';
        $f['email'] = $f['email'] ? $f['email'] : '';
    }

    echo json_encode(["status" => "success", "data" => $funcionarios]);
} catch (PDOException $e) {
    tratarErroBanco($e, 'get_funcionarios');
}
?>
