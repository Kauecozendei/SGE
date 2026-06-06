<?php
session_start();
require_once __DIR__ . '/../conexao.php';

$response = [
    "status" => "success",
    "total_alunos" => 0,
    "professores_ativos" => 0,
    "turmas_abertas" => 0,
    "mensalidades_pendentes" => 0,
    "ultimos_alunos" => [],
    "agenda_hoje" => [],
    "avisos" => []
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

        // Mensalidades Pendentes (tabela financeira real)
        $stmt = $pdo->query("SELECT COUNT(*) FROM financeiro WHERE status = 'pendente'");
        $response['mensalidades_pendentes'] = $stmt->fetchColumn();

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

        // Agenda de Hoje
        $sqlAgenda = "SELECT titulo, TIME_FORMAT(hora, '%H:%i') as hora, tipo, descricao FROM agenda WHERE data = CURDATE() ORDER BY hora ASC";
        $stmt = $pdo->query($sqlAgenda);
        $response['agenda_hoje'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Avisos Importantes
        $sqlAvisos = "SELECT texto, tipo FROM avisos ORDER BY id DESC LIMIT 5";
        $stmt = $pdo->query($sqlAvisos);
        $response['avisos'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    } catch (PDOException $e) {
        $response['status'] = "error";
        $response['message'] = "Erro ao buscar dados: " . $e->getMessage();
    }
} else {
    // Simulação sem banco
    $response['total_alunos'] = 245;
    $response['professores_ativos'] = 18;
    $response['turmas_abertas'] = 12;
    $response['mensalidades_pendentes'] = 37;
    $response['ultimos_alunos'] = [
        ["nome" => "Maria Eduarda Silva", "turma" => "Turma A", "responsavel" => "Ana Paula Silva"],
        ["nome" => "Pedro Henrique Costa", "turma" => "Turma B", "responsavel" => "Fernanda Costa"],
        ["nome" => "Lucas Gabriel Oliveira", "turma" => "Turma C", "responsavel" => "Mariana Oliveira"]
    ];
    $response['agenda_hoje'] = [
        ["titulo" => "Reunião Pedagógica", "hora" => "08:30", "tipo" => "reuniao", "descricao" => "Reunião mensal"],
        ["titulo" => "Aula de Reforço - Turma B", "hora" => "10:00", "tipo" => "evento", "descricao" => "Reforço escolar"],
        ["titulo" => "Entrega de Boletins", "hora" => "14:00", "tipo" => "lembrete", "descricao" => "Entrega aos pais"]
    ];
    $response['avisos'] = [
        ["texto" => "Prazo de matrícula aberto até 15/05", "tipo" => "success"],
        ["texto" => "Reunião de pais na sexta-feira às 19h", "tipo" => "warning"],
        ["texto" => "Atualização do sistema agendada para domingo", "tipo" => "info"]
    ];
}

header('Content-Type: application/json');
echo json_encode($response);
exit;
?>
