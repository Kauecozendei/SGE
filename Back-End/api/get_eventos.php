<?php
session_start();
require_once __DIR__ . '/../conexao.php';

header('Content-Type: application/json');

if (!$pdo) {
    // Simulação se não houver banco
    $mockEventos = [
        ["id" => 1, "titulo" => "Reunião Pedagógica", "data" => date('Y-m-') . '05', "hora" => "08:30", "tipo" => "reuniao", "descricao" => "Reunião mensal de professores e coordenação", "dia" => 5],
        ["id" => 2, "titulo" => "Apresentação Cultural", "data" => date('Y-m-') . '12', "hora" => "14:00", "tipo" => "evento", "descricao" => "Apresentação de teatro dos alunos para os pais", "dia" => 12],
        ["id" => 3, "titulo" => "Entrega de Boletins", "data" => date('Y-m-') . '20', "hora" => "10:00", "tipo" => "lembrete", "descricao" => "Plantão de atendimento aos pais para entrega dos boletins", "dia" => 20],
        ["id" => 4, "titulo" => "Prova Bimestral", "data" => date('Y-m-') . '25', "hora" => "09:00", "tipo" => "prova", "descricao" => "Avaliação bimestral integrada de língua portuguesa", "dia" => 25],
    ];
    echo json_encode(["status" => "warning", "data" => $mockEventos, "message" => "Banco de dados não conectado. Exibindo dados simulados."]);
    exit;
}

$mes = filter_input(INPUT_GET, 'mes', FILTER_VALIDATE_INT);
$ano = filter_input(INPUT_GET, 'ano', FILTER_VALIDATE_INT);

try {
    if ($mes !== null && $mes !== false && $ano !== null && $ano !== false) {
        // Obter eventos do mês especificado (JS envia mês 0-11, MySQL usa 1-12)
        $sqlMes = $mes + 1;
        $sql = "SELECT id, titulo, data, TIME_FORMAT(hora, '%H:%i') as hora, tipo, descricao 
                FROM agenda 
                WHERE MONTH(data) = ? AND YEAR(data) = ? 
                ORDER BY data ASC, hora ASC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$sqlMes, $ano]);
    } else {
        // Listar todos os eventos
        $sql = "SELECT id, titulo, data, TIME_FORMAT(hora, '%H:%i') as hora, tipo, descricao 
                FROM agenda 
                ORDER BY data ASC, hora ASC";
        $stmt = $pdo->query($sql);
    }
    
    $eventos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Adicionar campo 'dia' para compatibilidade com o front-end
    foreach ($eventos as &$e) {
        $partes = explode('-', $e['data']);
        $e['dia'] = (int)$partes[2];
        if (empty($e['hora'])) {
            $e['hora'] = '—';
        }
    }

    echo json_encode(["status" => "success", "data" => $eventos]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Erro ao buscar eventos: " . $e->getMessage()]);
}
?>
