<?php
session_start();
require_once __DIR__ . '/../conexao.php';

$response = [
    "status" => "success",
    "total_alunos" => 0,
    "professores_ativos" => 0,
    "turmas_abertas" => 0,
    "mensalidades_pendentes" => 12, // mock (sem tabela financeira no DB)
    "ultimos_alunos" => []
];

if ($pdo) {
    try {
        // Total Alunos
        $stmt = $pdo->query("SELECT COUNT(*) FROM alunos");
        $response['total_alunos'] = $stmt->fetchColumn();

        // Professores Ativos (cargos_id = 1)
        $stmt = $pdo->query("SELECT COUNT(*) FROM funcionarios WHERE cargos_id = 1");
        $response['professores_ativos'] = $stmt->fetchColumn();

        // Turmas Abertas
        $stmt = $pdo->query("SELECT COUNT(*) FROM turmas");
        $response['turmas_abertas'] = $stmt->fetchColumn();

        // Últimos Alunos Cadastrados (limite 5)
        $sql = "
            SELECT a.nome, t.nome as turma, r.nome as responsavel 
            FROM alunos a
            LEFT JOIN aluno_turma at ON a.id = at.alunos_id
            LEFT JOIN turmas t ON at.turmas_id = t.id
            LEFT JOIN aluno_responsavel ar ON a.id = ar.alunos_id
            LEFT JOIN responsaveis r ON ar.responsaveis_id = r.id
            GROUP BY a.id
            ORDER BY a.id DESC LIMIT 5
        ";
        $stmt = $pdo->query($sql);
        $response['ultimos_alunos'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    } catch (PDOException $e) {
        $response['status'] = "error";
        $response['message'] = "Erro ao buscar dados: " . $e->getMessage();
    }
} else {
    // Simulação sem banco
    $response['total_alunos'] = 245;
    $response['professores_ativos'] = 18;
    $response['turmas_abertas'] = 12;
    $response['ultimos_alunos'] = [
        ["nome" => "Maria Eduarda Silva", "turma" => "Turma A", "responsavel" => "Ana Paula Silva"],
        ["nome" => "Pedro Henrique Costa", "turma" => "Turma B", "responsavel" => "Fernanda Costa"],
        ["nome" => "Lucas Gabriel Oliveira", "turma" => "Turma C", "responsavel" => "Mariana Oliveira"]
    ];
}

header('Content-Type: application/json');
echo json_encode($response);
?>
