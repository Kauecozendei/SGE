<?php
session_start();
require_once '../conexao.php';

header('Content-Type: application/json');

// Função auxiliar para determinar horários previstos baseado no período da turma ou na coluna horário
function calcularHorarioPrevisto($periodo, $horarioTurma) {
    $entrada_prevista = '08:00:00';
    $saida_prevista = '17:00:00';
    
    // Tenta parsear do formato "07:30 - 12:00" ou similar
    if (!empty($horarioTurma) && strpos($horarioTurma, '-') !== false) {
        $partes = explode('-', $horarioTurma);
        if (count($partes) == 2) {
            $entrada_prevista = date('H:i:s', strtotime(trim($partes[0])));
            $saida_prevista = date('H:i:s', strtotime(trim($partes[1])));
            return [$entrada_prevista, $saida_prevista];
        }
    }
    
    // Fallback baseado no período
    $p = mb_strtolower($periodo, 'UTF-8');
    if (strpos($p, 'manhã') !== false || strpos($p, 'matutino') !== false) {
        $entrada_prevista = '07:30:00';
        $saida_prevista = '12:00:00';
    } elseif (strpos($p, 'tarde') !== false || strpos($p, 'vespertino') !== false) {
        $entrada_prevista = '13:00:00';
        $saida_prevista = '17:30:00';
    } elseif (strpos($p, 'integral') !== false) {
        $entrada_prevista = '08:00:00';
        $saida_prevista = '17:00:00';
    }
    
    return [$entrada_prevista, $saida_prevista];
}

function calcularDiferencaMinutos($horaReal, $horaPrevista) {
    $real = strtotime($horaReal);
    $prevista = strtotime($horaPrevista);
    return ($real - $prevista) / 60;
}

function formatarDiferenca($minutos) {
    if ($minutos <= 0) return '';
    if ($minutos < 60) {
        return round($minutos) . ' min';
    }
    $horas = floor($minutos / 60);
    $resto = round($minutos % 60);
    return $resto > 0 ? "{$horas}h {$resto}m" : "{$horas}h";
}

if ($pdo) {
    try {
        $sql = "
            SELECT
                h.id,
                h.alunos_id,
                a.nome as aluno,
                t.nome as turma,
                t.periodo,
                t.horario as turma_horario,
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
            LIMIT 150
        ";
        
        $stmt = $pdo->query($sql);
        $horarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $dataHoje = date('Y-m-d');
        
        // Buscar todas as saídas do dia de hoje para sabermos se cada entrada já teve sua saída registrada correspondente
        $stmtSaidasHoje = $pdo->query("SELECT alunos_id FROM horarios WHERE tipo = 'saida' AND data = CURDATE()");
        $saidasHoje = $stmtSaidasHoje->fetchAll(PDO::FETCH_COLUMN) ?: [];

        $horariosProcessados = [];
        $atrasadosHojeCount = 0;
        $excedentesHojeCount = 0;
        $devolucoesHojeCount = 0;

        foreach ($horarios as $h) {
            list($entrada_prev, $saida_prev) = calcularHorarioPrevisto($h['periodo'], $h['turma_horario']);
            
            $atraso = '';
            $excedido = '';
            $status_presenca = 'presente';
            $horario_prev_fmt = '';

            if ($h['tipo'] === 'entrada') {
                $dif = calcularDiferencaMinutos($h['horario'], $entrada_prev);
                $horario_prev_fmt = substr($entrada_prev, 0, 5);
                if ($dif > 15) { // Tolerância de 15 minutos
                    $atraso = formatarDiferenca($dif);
                    $status_presenca = 'atrasado';
                    if ($h['data'] === $dataHoje) {
                        $atrasadosHojeCount++;
                    }
                }
            } else if ($h['tipo'] === 'saida') {
                $dif = calcularDiferencaMinutos($h['horario'], $saida_prev);
                $horario_prev_fmt = substr($saida_prev, 0, 5);
                if ($dif > 15) { // Tolerância de 15 minutos
                    $excedido = formatarDiferenca($dif);
                    $status_presenca = 'excedente';
                    if ($h['data'] === $dataHoje) {
                        $excedentesHojeCount++;
                    }
                } else {
                    $status_presenca = 'saiu';
                }
                if ($h['data'] === $dataHoje) {
                    $devolucoesHojeCount++;
                }
            }
            
            $possuiSaida = in_array($h['alunos_id'], $saidasHoje);

            $horariosProcessados[] = [
                "id" => $h['id'],
                "alunos_id" => $h['alunos_id'],
                "aluno" => $h['aluno'],
                "turma" => $h['turma'],
                "periodo" => $h['periodo'],
                "data" => $h['data'],
                "horario" => $h['horario'],
                "tipo" => $h['tipo'],
                "observacao" => $h['observacao'],
                "funcionario" => $h['funcionario'],
                "responsavel" => $h['responsavel'],
                "horario_prev" => $horario_prev_fmt,
                "atraso" => $atraso,
                "excedido" => $excedido,
                "status_presenca" => $status_presenca,
                "possui_saida" => $possuiSaida
            ];
        }

        // Total Alunos da Manhã cadastrados
        $stmtManha = $pdo->query("
            SELECT COUNT(DISTINCT a.id) 
            FROM alunos a 
            JOIN aluno_turma at ON a.id = at.alunos_id AND at.data_fim IS NULL
            JOIN turmas t ON at.turmas_id = t.id
            WHERE t.periodo LIKE '%Manhã%' OR t.periodo LIKE '%Matutino%'
        ");
        $alunosManhaCount = (int)$stmtManha->fetchColumn();

        // Alunos reincidentes (últimos 30 dias)
        $stmtReincidentes = $pdo->query("
            SELECT h.alunos_id, a.nome as aluno, t.periodo, t.horario as turma_horario, h.horario as entrada_real
            FROM horarios h
            JOIN alunos a ON h.alunos_id = a.id
            LEFT JOIN aluno_turma atu ON a.id = atu.alunos_id AND atu.data_fim IS NULL
            LEFT JOIN turmas t ON atu.turmas_id = t.id
            WHERE h.tipo = 'entrada' AND h.data >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        ");
        $entradas30 = $stmtReincidentes->fetchAll(PDO::FETCH_ASSOC);

        $atrasosPorAluno = [];
        foreach ($entradas30 as $ent) {
            list($entrada_prev, $saida_prev) = calcularHorarioPrevisto($ent['periodo'], $ent['turma_horario']);
            $dif = calcularDiferencaMinutos($ent['entrada_real'], $entrada_prev);
            if ($dif > 15) {
                $alunoId = $ent['alunos_id'];
                if (!isset($atrasosPorAluno[$alunoId])) {
                    $atrasosPorAluno[$alunoId] = [
                        "aluno_id" => $alunoId,
                        "aluno" => $ent['aluno'],
                        "qtd_atrasos" => 0
                    ];
                }
                $atrasosPorAluno[$alunoId]['qtd_atrasos']++;
            }
        }

        $reincidentes = [];
        foreach ($atrasosPorAluno as $alunoId => $dados) {
            if ($dados['qtd_atrasos'] >= 3) {
                $nomes = explode(' ', $dados['aluno']);
                $iniciais = (count($nomes) > 1) ? substr($nomes[0], 0, 1) . substr($nomes[count($nomes)-1], 0, 1) : substr($nomes[0], 0, 2);
                $dados['avatar'] = strtoupper($iniciais);
                $dados['detalhes'] = "{$dados['qtd_atrasos']} atrasos no mês";
                
                $stmtResp = $pdo->prepare("
                    SELECT r.nome FROM responsaveis r 
                    JOIN aluno_responsavel ar ON r.id = ar.responsaveis_id 
                    WHERE ar.alunos_id = :aluno_id LIMIT 1
                ");
                $stmtResp->execute([':aluno_id' => $alunoId]);
                $dados['responsavel'] = $stmtResp->fetchColumn() ?: 'Responsável não cadastrado';

                $reincidentes[] = $dados;
            }
        }

        echo json_encode([
            "status" => "success",
            "data" => $horariosProcessados,
            "stats" => [
                "atrasados_hoje" => $atrasadosHojeCount,
                "excedentes_hoje" => $excedentesHojeCount,
                "alunos_manha" => $alunosManhaCount,
                "devolucoes_hoje" => $devolucoesHojeCount
            ],
            "reincidentes" => $reincidentes
        ]);

    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Erro ao buscar horários.", "error" => $e->getMessage()]);
    }
} else {
    // Simulação sem banco
    $dataHoje = date('Y-m-d');
    $dataOntem = date('Y-m-d', strtotime('-1 day'));

    $mockData = [
        [
            "id" => 1,
            "alunos_id" => 101,
            "aluno" => "Daniel Santos",
            "turma" => "Turma A",
            "periodo" => "Manhã",
            "data" => $dataHoje,
            "horario" => "08:15:00",
            "tipo" => "entrada",
            "observacao" => "Trânsito intenso na avenida principal",
            "funcionario" => "Rita de Cássia",
            "responsavel" => "Marcos Santos",
            "horario_prev" => "07:30",
            "atraso" => "45 min",
            "excedido" => "",
            "status_presenca" => "atrasado",
            "possui_saida" => false
        ],
        [
            "id" => 2,
            "alunos_id" => 102,
            "aluno" => "Manuela Costa",
            "turma" => "Turma B",
            "periodo" => "Tarde",
            "data" => $dataHoje,
            "horario" => "13:05:00",
            "tipo" => "entrada",
            "observacao" => "",
            "funcionario" => "Rita de Cássia",
            "responsavel" => "Fernanda Costa",
            "horario_prev" => "13:00",
            "atraso" => "",
            "excedido" => "",
            "status_presenca" => "presente",
            "possui_saida" => false
        ],
        [
            "id" => 3,
            "alunos_id" => 103,
            "aluno" => "Lucas Gabriel Oliveira",
            "turma" => "Turma C",
            "periodo" => "Integral",
            "data" => $dataHoje,
            "horario" => "08:35:00",
            "tipo" => "entrada",
            "observacao" => "Consulta odontológica pela manhã",
            "funcionario" => "Rita de Cássia",
            "responsavel" => "Mariana Oliveira",
            "horario_prev" => "08:00",
            "atraso" => "35 min",
            "excedido" => "",
            "status_presenca" => "atrasado",
            "possui_saida" => false
        ],
        [
            "id" => 4,
            "alunos_id" => 104,
            "aluno" => "Sophia Ribeiro",
            "turma" => "Turma A",
            "periodo" => "Manhã",
            "data" => $dataHoje,
            "horario" => "12:45:00",
            "tipo" => "saida",
            "observacao" => "Mãe atrasou na reunião de trabalho",
            "funcionario" => "Rita de Cássia",
            "responsavel" => "Patrícia Ribeiro",
            "horario_prev" => "12:00",
            "atraso" => "",
            "excedido" => "45 min",
            "status_presenca" => "excedente",
            "possui_saida" => true
        ],
        [
            "id" => 5,
            "alunos_id" => 105,
            "aluno" => "Enzo Gabriel Lima",
            "turma" => "Turma B",
            "periodo" => "Tarde",
            "data" => $dataHoje,
            "horario" => "18:20:00",
            "tipo" => "saida",
            "observacao" => "",
            "funcionario" => "Rita de Cássia",
            "responsavel" => "Roberto Lima",
            "horario_prev" => "17:30",
            "atraso" => "",
            "excedido" => "50 min",
            "status_presenca" => "excedente",
            "possui_saida" => true
        ],
        [
            "id" => 6,
            "alunos_id" => 106,
            "aluno" => "Valentina Rocha",
            "turma" => "Turma A",
            "periodo" => "Manhã",
            "data" => $dataHoje,
            "horario" => "07:25:00",
            "tipo" => "entrada",
            "observacao" => "",
            "funcionario" => "Rita de Cássia",
            "responsavel" => "Carlos Rocha",
            "horario_prev" => "07:30",
            "atraso" => "",
            "excedido" => "",
            "status_presenca" => "presente",
            "possui_saida" => false
        ],
        [
            "id" => 7,
            "alunos_id" => 107,
            "aluno" => "Gustavo Henrique",
            "turma" => "Turma A",
            "periodo" => "Manhã",
            "data" => $dataHoje,
            "horario" => "08:02:00",
            "tipo" => "entrada",
            "observacao" => "Acordou tarde",
            "funcionario" => "Rita de Cássia",
            "responsavel" => "Ana Henrique",
            "horario_prev" => "07:30",
            "atraso" => "32 min",
            "status_presenca" => "atrasado",
            "possui_saida" => false
        ],
        [
            "id" => 8,
            "alunos_id" => 108,
            "aluno" => "Alice Vieira",
            "turma" => "Turma A",
            "periodo" => "Manhã",
            "data" => $dataHoje,
            "horario" => "12:05:00",
            "tipo" => "saida",
            "observacao" => "",
            "funcionario" => "Rita de Cássia",
            "responsavel" => "Gabriela Vieira",
            "horario_prev" => "12:00",
            "atraso" => "",
            "excedido" => "",
            "status_presenca" => "saiu",
            "possui_saida" => true
        ],
        [
            "id" => 9,
            "alunos_id" => 109,
            "aluno" => "Heitor Souza",
            "turma" => "Turma B",
            "periodo" => "Tarde",
            "data" => $dataHoje,
            "horario" => "17:35:00",
            "tipo" => "saida",
            "observacao" => "",
            "funcionario" => "Rita de Cássia",
            "responsavel" => "Juliana Souza",
            "horario_prev" => "17:30",
            "atraso" => "",
            "excedido" => "",
            "status_presenca" => "saiu",
            "possui_saida" => true
        ]
    ];

    $mockReincidentes = [
        [
            "aluno_id" => 101,
            "aluno" => "Daniel Santos",
            "avatar" => "DS",
            "qtd_atrasos" => 3,
            "detalhes" => "3 atrasos no mês — 4 no ano",
            "responsavel" => "Marcos Santos"
        ]
    ];

    echo json_encode([
        "status" => "success",
        "data" => $mockData,
        "stats" => [
            "atrasados_hoje" => 3,
            "excedentes_hoje" => 2,
            "alunos_manha" => 12,
            "devolucoes_hoje" => 4
        ],
        "reincidentes" => $mockReincidentes
    ]);
}
exit;
?>
