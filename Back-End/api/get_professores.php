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
        SELECT f.id, f.nome, f.CPF as cpf, f.telefone as tel, f.email, f.status, f.formacao,
               COALESCE(
                   (SELECT GROUP_CONCAT(DISTINCT d.nome SEPARATOR ', ') 
                    FROM professor_turma_disciplina ptd 
                    JOIN disciplinas d ON d.id = ptd.disciplinas_id 
                    WHERE ptd.professores_id = f.id), 
                   f.disciplinas_estatico
               ) as disc,
               (SELECT GROUP_CONCAT(DISTINCT t.nome SEPARATOR ', ') 
                FROM professor_turma pt 
                JOIN turmas t ON t.id = pt.turmas_id 
                WHERE pt.professores_id = f.id) as turmas
        FROM funcionarios f
        WHERE f.cargos_id = 2
        ORDER BY f.id DESC
    ";
    $stmt = $pdo->query($sql);
    $professores = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($professores as &$p) {
        $p['status'] = $p['status'] ? $p['status'] : 'ativo';
        $p['formacao'] = $p['formacao'] ? $p['formacao'] : 'Não informada';
        $p['disc'] = $p['disc'] ? $p['disc'] : '';
        $p['turmas'] = $p['turmas'] ? $p['turmas'] : 'Sem Turma';
    }

    echo json_encode(["status" => "success", "data" => $professores]);
} catch (PDOException $e) {
    tratarErroBanco($e, 'get_professores');
}
?>
