<?php
require_once __DIR__ . '/../auth_guard.php';
require_once __DIR__ . '/../conexao.php';

verificarAutenticacao();

if (!$pdo) {
    http_response_code(503);
    echo json_encode(["status" => "error", "message" => "Serviço temporariamente indisponível."]);
    exit;
}

try {
    $sql = "
        SELECT 
            t.id, t.nome, t.periodo, t.serie, t.sala, t.capacidade, t.horario,
            (SELECT COUNT(*) FROM aluno_turma atu WHERE atu.turmas_id = t.id AND atu.data_fim IS NULL) as qtd_alunos,
            (SELECT COUNT(*) FROM professor_turma ptu WHERE ptu.turmas_id = t.id) as qtd_professores,
            GROUP_CONCAT(DISTINCT f.nome SEPARATOR ', ') as professores,
            GROUP_CONCAT(DISTINCT pt.professores_id SEPARATOR ',') as professor_ids
        FROM turmas t
        LEFT JOIN professor_turma pt ON t.id = pt.turmas_id
        LEFT JOIN funcionarios f ON pt.professores_id = f.id
        GROUP BY t.id, t.nome, t.periodo, t.serie, t.sala, t.capacidade, t.horario
        ORDER BY t.nome ASC
    ";
    $stmt = $pdo->query($sql);
    $turmas = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["status" => "success", "data" => $turmas]);
} catch (PDOException $e) {
    tratarErroBanco($e, 'listar_turmas');
}
?>
