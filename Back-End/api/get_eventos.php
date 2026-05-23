<?php
session_start();
require_once __DIR__ . '/../conexao.php';

header('Content-Type: application/json');

if (!$pdo) {
    echo json_encode(["status" => "error", "message" => "Erro de conexão com o banco de dados."]);
    exit;
}

$mes = filter_input(INPUT_GET, 'mes', FILTER_VALIDATE_INT);
$ano = filter_input(INPUT_GET, 'ano', FILTER_VALIDATE_INT);

try {
    if ($mes !== null && $mes !== false && $ano !== null && $ano !== false) {
        // Obter eventos do mês especificado
        // O PHP/JS envia o mês de 0 a 11 (JS Date). Portanto, adicionamos 1 para corresponder ao SQL (1 a 12)
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

    // Ajustar o formato da data para retornar somente o dia para compatibilidade com o front-end, se necessário
    // No front-end atual, ele faz: `eventosData.filter(e => e.dia === d)`.
    // Então, se retornamos eventos para um mês específico, precisamos do campo 'dia'!
    // Vamos adicionar o campo 'dia' extraindo o dia da data.
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
