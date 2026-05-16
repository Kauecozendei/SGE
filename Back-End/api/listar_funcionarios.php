<?php
session_start();
require_once '../conexao.php';

header('Content-Type: application/json');

if (!$pdo) {
    echo json_encode(["status" => "error", "message" => "Erro de conexão com o banco de dados."]);
    exit;
}

$cargoFiltro = isset($_GET['cargo']) ? $_GET['cargo'] : null;

try {
    $sql = "
        SELECT 
            f.id,
            f.nome,
            f.CPF as cpf,
            f.data_nascimento as nasc,
            f.telefone as tel,
            f.email,
            c.nome as cargo,
            c.id as cargo_id
        FROM funcionarios f
        JOIN cargos c ON f.cargos_id = c.id
    ";
    
    if ($cargoFiltro) {
        $sql .= " WHERE c.nome LIKE :cargo";
    }
    
    $sql .= " ORDER BY f.nome ASC";
    
    $stmt = $pdo->prepare($sql);
    
    if ($cargoFiltro) {
        $stmt->execute([':cargo' => '%' . $cargoFiltro . '%']);
    } else {
        $stmt->execute();
    }
    
    $funcionarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["status" => "success", "data" => $funcionarios]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Erro ao buscar funcionários.", "error" => $e->getMessage()]);
}
?>
