<?php
session_start();
require_once __DIR__ . '/../conexao.php';
header('Content-Type: application/json');

if (isset($_SESSION['usuario_id']) && $pdo) {
    try {
        $stmt = $pdo->prepare("
            SELECT f.id, f.nome, f.CPF, f.data_nascimento, f.telefone, f.email, c.nome as cargo 
            FROM funcionarios f
            LEFT JOIN cargos c ON f.cargos_id = c.id
            WHERE f.id = :id LIMIT 1
        ");
        $stmt->execute([':id' => $_SESSION['usuario_id']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            echo json_encode([
                "status" => "success",
                "id" => $user['id'],
                "nome" => $user['nome'],
                "cpf" => $user['CPF'],
                "data_nascimento" => $user['data_nascimento'],
                "telefone" => $user['telefone'],
                "email" => $user['email'],
                "cargo" => $user['cargo']
            ]);
        } else {
            echo json_encode([
                "status" => "success",
                "nome" => $_SESSION['usuario_nome'],
                "email" => $_SESSION['usuario_email'],
                "cargo" => "Funcionário"
            ]);
        }
    } catch (PDOException $e) {
        echo json_encode([
            "status" => "success",
            "nome" => $_SESSION['usuario_nome'],
            "email" => $_SESSION['usuario_email'],
            "cargo" => "Funcionário"
        ]);
    }
} else if (isset($_SESSION['usuario_nome'])) {
    echo json_encode([
        "status" => "success",
        "nome" => $_SESSION['usuario_nome'],
        "email" => $_SESSION['usuario_email'],
        "cargo" => "Usuário de Simulação"
    ]);
} else {
    echo json_encode([
        "status" => "error",
        "message" => "Usuário não autenticado."
    ]);
}
exit;
?>
