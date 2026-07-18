<?php
require_once __DIR__ . '/../auth_guard.php';
require_once __DIR__ . '/../conexao.php';

verificarAutenticacao();

if (!$pdo) {
    http_response_code(503);
    echo json_encode(["status" => "error", "message" => "Serviço temporariamente indisponível."]);
    exit;
}

$tipo = sanitizarEntrada(filter_input(INPUT_GET, 'tipo', FILTER_DEFAULT)) ?: 'frequencia';
$aluno_nome = sanitizarEntrada(filter_input(INPUT_GET, 'aluno', FILTER_DEFAULT));
$turma_id = filter_input(INPUT_GET, 'turma', FILTER_VALIDATE_INT);
$data_inicio = sanitizarEntrada(filter_input(INPUT_GET, 'data_inicio', FILTER_DEFAULT));
$data_fim = sanitizarEntrada(filter_input(INPUT_GET, 'data_fim', FILTER_DEFAULT));

// Validação de tipo permitido
$tipos_permitidos = ['frequencia', 'alimentacao', 'banhos', 'atrasos'];
if (!in_array($tipo, $tipos_permitidos)) {
    echo json_encode(["status" => "error", "message" => "Tipo de relatório inválido."]);
    exit;
}

if (empty($data_inicio)) $data_inicio = date('Y-m-01');
if (empty($data_fim)) $data_fim = date('Y-m-d');

// Validar datas
if (!validarData($data_inicio) || !validarData($data_fim)) {
    echo json_encode(["status" => "error", "message" => "Datas inválidas."]);
    exit;
}

function getDiasUteis($strStart, $strEnd) {
    $start = new DateTime($strStart);
    $end = new DateTime($strEnd);
    $end->modify('+1 day');
    $interval = new DateInterval('P1D');
    $period = new DatePeriod($start, $interval, $end);
    $businessDays = 0;
    foreach ($period as $dt) {
        if ($dt->format('N') < 6) $businessDays++;
    }
    return max(1, $businessDays);
}

$total_dias_uteis = getDiasUteis($data_inicio, $data_fim);

$where = " WHERE 1=1 ";
$params = [];

if (!empty($aluno_nome)) {
    $where .= " AND a.nome LIKE ? ";
    $params[] = "%" . $aluno_nome . "%";
}
if (!empty($turma_id)) {
    $where .= " AND t.id = ? ";
    $params[] = $turma_id;
}

try {
    if ($tipo === 'frequencia') {
        $sql = "
            SELECT a.id, a.nome as aluno, t.nome as turma,
                COUNT(DISTINCT CASE WHEN h.tipo = 'entrada' AND h.data BETWEEN ? AND ? THEN h.data END) as dias_presentes,
                COUNT(CASE WHEN h.tipo = 'entrada' AND (h.horario > '08:00:00' OR h.observacao LIKE '%Atraso%') AND h.data BETWEEN ? AND ? THEN 1 END) as atrasos
            FROM alunos a
            LEFT JOIN aluno_turma atu ON a.id = atu.alunos_id AND atu.data_fim IS NULL
            LEFT JOIN turmas t ON atu.turmas_id = t.id
            LEFT JOIN horarios h ON a.id = h.alunos_id
            $where GROUP BY a.id, a.nome, t.nome ORDER BY a.nome ASC
        ";
        $sqlParams = array_merge([$data_inicio, $data_fim, $data_inicio, $data_fim], $params);
        $stmt = $pdo->prepare($sql);
        $stmt->execute($sqlParams);
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $totalAlunos = count($result);
        $somaFrequencias = 0; $totalFaltas = 0; $totalAtrasos = 0;

        foreach ($result as &$row) {
            $row['dias_presentes'] = (int)$row['dias_presentes'];
            $row['atrasos'] = (int)$row['atrasos'];
            $row['faltas'] = max(0, $total_dias_uteis - $row['dias_presentes']);
            $row['frequencia'] = round(($row['dias_presentes'] / $total_dias_uteis) * 100, 1);
            $somaFrequencias += $row['frequencia'];
            $totalFaltas += $row['faltas'];
            $totalAtrasos += $row['atrasos'];
        }

        $avgFrequencia = $totalAlunos > 0 ? round($somaFrequencias / $totalAlunos, 1) : 100;

        echo json_encode([
            "status" => "success",
            "summary" => ["n1"=>$totalAlunos,"n2"=>$avgFrequencia."%","n3"=>$totalFaltas,"n4"=>$totalAtrasos,
                "labels"=>["n1"=>"Alunos","n2"=>"Freq. média","n3"=>"Faltas","n4"=>"Atrasos"]],
            "chart" => [], "data" => $result
        ]);

    } else if ($tipo === 'alimentacao') {
        $sql = "
            SELECT a.id, a.nome as aluno, t.nome as turma,
                COUNT(CASE WHEN al.alimentou = 1 AND al.data BETWEEN ? AND ? THEN 1 END) as refeicoes_servidas,
                COUNT(CASE WHEN al.alimentou = 0 AND al.data BETWEEN ? AND ? THEN 1 END) as refeicoes_recusadas
            FROM alunos a
            LEFT JOIN aluno_turma atu ON a.id = atu.alunos_id AND atu.data_fim IS NULL
            LEFT JOIN turmas t ON atu.turmas_id = t.id
            LEFT JOIN alimentacao al ON a.id = al.alunos_id
            $where GROUP BY a.id, a.nome, t.nome ORDER BY a.nome ASC
        ";
        $sqlParams = array_merge([$data_inicio, $data_fim, $data_inicio, $data_fim], $params);
        $stmt = $pdo->prepare($sql);
        $stmt->execute($sqlParams);
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $totalServidas = 0; $totalRecusadas = 0; $alunosAtendidos = 0;
        foreach ($result as &$row) {
            $row['refeicoes_servidas'] = (int)$row['refeicoes_servidas'];
            $row['refeicoes_recusadas'] = (int)$row['refeicoes_recusadas'];
            $row['total_refeicoes'] = $row['refeicoes_servidas'] + $row['refeicoes_recusadas'];
            $row['taxa_aceitacao'] = $row['total_refeicoes'] > 0 ? round(($row['refeicoes_servidas'] / $row['total_refeicoes']) * 100, 1) : 100;
            $totalServidas += $row['refeicoes_servidas'];
            $totalRecusadas += $row['refeicoes_recusadas'];
            if ($row['total_refeicoes'] > 0) $alunosAtendidos++;
        }
        $totalGeral = $totalServidas + $totalRecusadas;
        $avgAceitacao = $totalGeral > 0 ? round(($totalServidas / $totalGeral) * 100, 1) : 100;

        echo json_encode([
            "status" => "success",
            "summary" => ["n1"=>$totalGeral,"n2"=>$avgAceitacao."%","n3"=>$totalRecusadas,"n4"=>$alunosAtendidos,
                "labels"=>["n1"=>"Refeições Totais","n2"=>"Taxa Aceitação","n3"=>"Ref. Recusadas","n4"=>"Alunos Atendidos"]],
            "chart" => [], "data" => $result
        ]);

    } else if ($tipo === 'banhos') {
        $sql = "
            SELECT a.id, a.nome as aluno, t.nome as turma,
                COUNT(CASE WHEN b.realizou = 1 AND b.data BETWEEN ? AND ? THEN 1 END) as banhos_realizados,
                COUNT(CASE WHEN b.realizou = 0 AND b.data BETWEEN ? AND ? THEN 1 END) as banhos_recusados
            FROM alunos a
            LEFT JOIN aluno_turma atu ON a.id = atu.alunos_id AND atu.data_fim IS NULL
            LEFT JOIN turmas t ON atu.turmas_id = t.id
            LEFT JOIN banhos b ON a.id = b.alunos_id
            $where GROUP BY a.id, a.nome, t.nome ORDER BY a.nome ASC
        ";
        $sqlParams = array_merge([$data_inicio, $data_fim, $data_inicio, $data_fim], $params);
        $stmt = $pdo->prepare($sql);
        $stmt->execute($sqlParams);
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $totalRealizados = 0; $totalRecusados = 0; $alunosAtendidos = 0;
        foreach ($result as &$row) {
            $row['banhos_realizados'] = (int)$row['banhos_realizados'];
            $row['banhos_recusados'] = (int)$row['banhos_recusados'];
            $row['total_banhos'] = $row['banhos_realizados'] + $row['banhos_recusados'];
            $totalRealizados += $row['banhos_realizados'];
            $totalRecusados += $row['banhos_recusados'];
            if ($row['total_banhos'] > 0) $alunosAtendidos++;
        }
        $avgBanhos = $alunosAtendidos > 0 ? round($totalRealizados / $alunosAtendidos, 1) : 0;

        echo json_encode([
            "status" => "success",
            "summary" => ["n1"=>$alunosAtendidos,"n2"=>$totalRealizados,"n3"=>$totalRecusados,"n4"=>$avgBanhos,
                "labels"=>["n1"=>"Alunos Atendidos","n2"=>"Banhos Tomados","n3"=>"Banhos Recusados","n4"=>"Média por Aluno"]],
            "chart" => [], "data" => $result
        ]);

    } else if ($tipo === 'atrasos') {
        $sql = "
            SELECT h.id, a.nome as aluno, t.nome as turma, h.data, h.horario, h.observacao
            FROM horarios h
            JOIN alunos a ON h.alunos_id = a.id
            LEFT JOIN aluno_turma atu ON a.id = atu.alunos_id AND atu.data_fim IS NULL
            LEFT JOIN turmas t ON atu.turmas_id = t.id
            $where AND h.tipo = 'entrada' AND (h.horario > '08:00:00' OR h.observacao LIKE '%Atraso%')
            AND h.data BETWEEN ? AND ? ORDER BY h.data DESC, h.horario DESC
        ";
        $sqlParams = array_merge($params, [$data_inicio, $data_fim]);
        $stmt = $pdo->prepare($sql);
        $stmt->execute($sqlParams);
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $totalAtrasos = count($result);
        $alunosAtrasados = [];
        foreach ($result as $row) $alunosAtrasados[$row['aluno']] = true;
        $countAlunosAtrasados = count($alunosAtrasados);
        $mediaPorDia = round($totalAtrasos / $total_dias_uteis, 1);

        $maiorAtraso = "Não registrado";
        if ($totalAtrasos > 0) {
            $maxTime = '';
            foreach ($result as $row) {
                if ($row['horario'] > $maxTime) {
                    $maxTime = $row['horario'];
                    $maiorAtraso = $row['aluno'] . " (" . $row['horario'] . ")";
                }
            }
        }

        echo json_encode([
            "status" => "success",
            "summary" => ["n1"=>$totalAtrasos,"n2"=>$countAlunosAtrasados,"n3"=>$mediaPorDia,"n4"=>$maiorAtraso,
                "labels"=>["n1"=>"Total Atrasos","n2"=>"Alunos Atrasados","n3"=>"Média por Dia","n4"=>"Maior Atraso"]],
            "chart" => [], "data" => $result
        ]);
    }

} catch (PDOException $e) {
    tratarErroBanco($e, 'get_relatorio');
}
?>
