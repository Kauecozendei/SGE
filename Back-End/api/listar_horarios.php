<?php
session_start();
require_once '../conexao.php';

header('Content-Type: application/json');

if (!$pdo) {
    echo json_encode(["status" => "error", "message" => "Erro de conexão com o banco de dados."]);
    exit;
}

try {
    $sql = "
        SELECT
            h.id,
            h.alunos_id,
            a.nome as aluno,
            t.nome as turma,
            t.periodo,
            h.data,
            h.horario,
            h.tipo,
            h.observacao,
            f.nome as funcionario,
            (SELECT r.nome FROM responsaveis r 
             JOIN aluno_responsavel ar ON r.id = ar.responsaveis_id 
             WHERE ar.alunos_id = a.id LIMIT 1) as responsavel
        FROM horarios h
        JOIN alunos a ON h.alunos_id = a.id
        LEFT JOIN aluno_turma atu ON a.id = atu.alunos_id AND atu.data_fim IS NULL
        LEFT JOIN turmas t ON atu.turmas_id = t.id
        LEFT JOIN funcionarios f ON h.funcionarios_id = f.id
        ORDER BY h.data DESC, h.horario DESC
        LIMIT 100
    ";
    
    $stmt = $pdo->query($sql);
    $horarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["status" => "success", "data" => $horarios]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Erro ao buscar horários de entrada/saída.", "error" => $e->getMessage()]);
}
?>
