<?php
require_once __DIR__ . '/../auth_guard.php';

// Limpa todas as variáveis de sessão
$_SESSION = array();

// Apaga o cookie de sessão
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// Destrói a sessão
session_destroy();

echo json_encode(["status" => "success", "message" => "Sessão encerrada com sucesso."]);
exit;
?>
