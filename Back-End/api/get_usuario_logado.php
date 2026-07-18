<?php
require_once __DIR__ . '/../auth_guard.php';
require_once __DIR__ . '/../conexao.php';

// Este endpoint é especial: verifica a sessão MAS não redireciona se não logado
// Retorna os dados do usuário logado ou erro de autenticação.

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
                "status"          => "success",
                "id"              => $user['id'],
                "nome"            => $user['nome'],
                "cpf"             => $user['CPF'],
                "data_nascimento" => $user['data_nascimento'],
                "telefone"        => $user['telefone'],
                "email"           => $user['email'],
                "cargo"           => $user['cargo'],
                "csrf_token"      => gerarTokenCSRF()
            ]);
        } else {
            echo json_encode([
                "status"     => "success",
                "nome"       => $_SESSION['usuario_nome'] ?? 'Usuário',
                "email"      => $_SESSION['usuario_email'] ?? '',
                "cargo"      => "Funcionário",
                "csrf_token" => gerarTokenCSRF()
            ]);
        }
    } catch (PDOException $e) {
        error_log("[SGE] Erro em get_usuario_logado: " . $e->getMessage());
        echo json_encode([
            "status"     => "success",
            "nome"       => $_SESSION['usuario_nome'] ?? 'Usuário',
            "email"      => $_SESSION['usuario_email'] ?? '',
            "cargo"      => "Funcionário",
            "csrf_token" => gerarTokenCSRF()
        ]);
    }
} else if (isset($_SESSION['usuario_nome'])) {
    echo json_encode([
        "status"     => "success",
        "nome"       => $_SESSION['usuario_nome'],
        "email"      => $_SESSION['usuario_email'] ?? '',
        "cargo"      => "Funcionário",
        "csrf_token" => gerarTokenCSRF()
    ]);
} else {
    http_response_code(401);
    echo json_encode([
        "status"  => "error",
        "message" => "Usuário não autenticado."
    ]);
}
exit;
?>
