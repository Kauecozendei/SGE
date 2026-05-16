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
            a.id, 
            a.matricula, 
            a.nome, 
            a.CPF as cpf, 
            a.data_nascimento as nasc,
            t.nome as turma,
            t.periodo,
            r.nome as resp,
            r.telefone as tel,
            r.email,
            ar.relacao as parentesco
        FROM alunos a
        LEFT JOIN aluno_turma atu ON a.id = atu.alunos_id AND atu.data_fim IS NULL
        LEFT JOIN turmas t ON atu.turmas_id = t.id
        LEFT JOIN aluno_responsavel ar ON a.id = ar.alunos_id
        LEFT JOIN responsaveis r ON ar.responsaveis_id = r.id
        ORDER BY a.nome ASC
    ";
    $stmt = $pdo->query($sql);
    $alunos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["status" => "success", "data" => $alunos]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Erro ao buscar alunos.", "error" => $e->getMessage()]);
}
?>
