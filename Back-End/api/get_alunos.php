<?php
session_start();
require_once __DIR__ . '/../conexao.php';

if ($pdo) {
    try {
        $sql = "
            SELECT a.id, a.nome, a.CPF as cpf, a.matricula, a.data_nascimento as nasc, t.nome as turma, t.periodo, r.nome as resp, r.telefone as tel, r.email, ar.relacao as parentesco
            FROM alunos a
            LEFT JOIN aluno_turma at ON a.id = at.alunos_id
            LEFT JOIN turmas t ON at.turmas_id = t.id
            LEFT JOIN aluno_responsavel ar ON a.id = ar.alunos_id
            LEFT JOIN responsaveis r ON ar.responsaveis_id = r.id
            GROUP BY a.id
            ORDER BY a.id DESC
        ";
        $stmt = $pdo->query($sql);
        $alunos = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(["status" => "success", "data" => $alunos]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Erro ao buscar alunos: " . $e->getMessage()]);
    }
} else {
    // Simulação se não tiver banco
    echo json_encode(["status" => "warning", "message" => "Banco não conectado.", "data" => []]);
}
?>
