<?php
// Inclui o auth_guard para sessão segura e utilitários
// Mas NÃO verificamos autenticação aqui (é a página de login!)
require_once __DIR__ . '/auth_guard.php';
require_once __DIR__ . '/conexao.php';

header('Content-Type: application/json');

// Verifica se a requisição é do tipo POST
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Método não permitido."]);
    exit;
}

// Rate limiting: máximo 5 tentativas de login a cada 5 minutos
if (!verificarRateLimit('login', 5, 300)) {
    http_response_code(429);
    echo json_encode([
        "status"  => "error",
        "message" => "Muitas tentativas de login. Aguarde 5 minutos e tente novamente."
    ]);
    exit;
}

// Recebe o email e a senha
$email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
$senha = filter_input(INPUT_POST, 'senha', FILTER_DEFAULT);

if (empty($email) || empty($senha)) {
    echo json_encode(["status" => "error", "message" => "E-mail ou senha inválidos. Tente novamente."]);
    exit;
}

// Validação de formato do email
if (!validarEmail($email)) {
    echo json_encode(["status" => "error", "message" => "E-mail ou senha inválidos. Tente novamente."]);
    exit;
}

if (!$pdo) {
    // Sem conexão com o banco, NÃO permitir login
    // (Removido: fallback de login simulado — era uma brecha de segurança)
    http_response_code(503);
    echo json_encode([
        "status"  => "error",
        "message" => "Serviço temporariamente indisponível. Tente novamente mais tarde."
    ]);
    exit;
}

try {
    // Busca o funcionário pelo email
    $sql = "SELECT id, nome, email, senha_hash, status FROM funcionarios WHERE email = :email LIMIT 1";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':email' => $email]);

    $funcionario = $stmt->fetch(PDO::FETCH_ASSOC);

    // Verifica se o funcionário existe, está ativo, e se a senha está correta
    if (
        $funcionario
        && ($funcionario['status'] ?? 'ativo') === 'ativo'
        && password_verify($senha, $funcionario['senha_hash'])
    ) {
        // Regenerar ID de sessão para prevenir fixação de sessão
        session_regenerate_id(true);

        // Salva os dados na sessão
        $_SESSION['usuario_id']    = $funcionario['id'];
        $_SESSION['usuario_nome']  = $funcionario['nome'];
        $_SESSION['usuario_email'] = $funcionario['email'];
        $_SESSION['tipo_usuario']  = 'funcionario';
        $_SESSION['_last_activity'] = time();

        // Fingerprint para proteção contra sequestro de sessão
        $_SESSION['_fingerprint'] = hash('sha256',
            ($_SERVER['HTTP_USER_AGENT'] ?? '') . ($_SERVER['REMOTE_ADDR'] ?? '')
        );

        // Gerar token CSRF para uso nas próximas requisições
        gerarTokenCSRF();

        $response = [
            "status"     => "success",
            "message"    => "Login realizado com sucesso!",
            "csrf_token" => $_SESSION['_csrf_token']
        ];
    } else {
        // Mensagem genérica para não revelar se o email existe ou não
        $response = ["status" => "error", "message" => "E-mail ou senha inválidos. Tente novamente."];
    }
} catch (PDOException $e) {
    // Log interno — NUNCA expor detalhes ao cliente
    error_log("[SGE] Erro no login: " . $e->getMessage());
    $response = ["status" => "error", "message" => "Erro de servidor. Tente novamente mais tarde."];
}

echo json_encode($response);
exit;
?>
