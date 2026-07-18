<?php
require_once __DIR__ . '/../auth_guard.php';
require_once __DIR__ . '/../conexao.php';

verificarAutenticacao();

if (!$pdo) {
    http_response_code(503);
    echo json_encode(["status" => "error", "message" => "Serviço temporariamente indisponível.", "data" => []]);
    exit;
}

$mes = filter_input(INPUT_GET, 'mes', FILTER_VALIDATE_INT);
$ano = filter_input(INPUT_GET, 'ano', FILTER_VALIDATE_INT);

try {
    if ($mes !== null && $mes !== false && $ano !== null && $ano !== false) {
        $sqlMes = $mes + 1;
        $sql = "SELECT id, titulo, data, TIME_FORMAT(hora, '%H:%i') as hora, tipo, descricao 
                FROM agenda 
                WHERE MONTH(data) = ? AND YEAR(data) = ? 
                ORDER BY data ASC, hora ASC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$sqlMes, $ano]);
    } else {
        $sql = "SELECT id, titulo, data, TIME_FORMAT(hora, '%H:%i') as hora, tipo, descricao 
                FROM agenda 
                ORDER BY data ASC, hora ASC";
        $stmt = $pdo->query($sql);
    }
    
    $eventos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($eventos as &$e) {
        $partes = explode('-', $e['data']);
        $e['dia'] = (int)$partes[2];
        if (empty($e['hora'])) {
            $e['hora'] = '—';
        }
    }

    echo json_encode(["status" => "success", "data" => $eventos]);
} catch (PDOException $e) {
    tratarErroBanco($e, 'get_eventos');
}
?>
