<?php
/**
 * Auth Guard — Middleware de Segurança do SGE
 * 
 * Inclua este arquivo no topo de TODOS os endpoints protegidos:
 *   require_once __DIR__ . '/auth_guard.php';
 * 
 * Funcionalidades:
 * - Configuração segura de sessão (HttpOnly, SameSite, Secure)
 * - Verificação de autenticação
 * - Geração e validação de tokens CSRF
 * - Headers de segurança HTTP
 * - Proteção contra fixação de sessão
 */

// ── Configuração segura de sessão ──────────────────────────────
if (session_status() === PHP_SESSION_NONE) {
    $isSecure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');

    session_set_cookie_params([
        'lifetime' => 3600,       // 1 hora
        'path'     => '/',
        'domain'   => '',
        'secure'   => $isSecure,
        'httponly'  => true,
        'samesite'  => 'Strict'
    ]);

    session_start();
}

// ── Headers de segurança HTTP ──────────────────────────────────
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
header('Content-Type: application/json; charset=utf-8');

// ── Função: Verificar se o usuário está autenticado ────────────
function verificarAutenticacao() {
    if (empty($_SESSION['usuario_id'])) {
        http_response_code(401);
        echo json_encode([
            "status"  => "error",
            "message" => "Acesso não autorizado. Faça login para continuar."
        ]);
        exit;
    }

    // Proteção contra fixação de sessão: valida fingerprint
    $fingerprint = hash('sha256', ($_SERVER['HTTP_USER_AGENT'] ?? '') . ($_SERVER['REMOTE_ADDR'] ?? ''));
    if (!empty($_SESSION['_fingerprint']) && $_SESSION['_fingerprint'] !== $fingerprint) {
        // Possível sequestro de sessão
        session_unset();
        session_destroy();
        http_response_code(401);
        echo json_encode([
            "status"  => "error",
            "message" => "Sessão inválida. Faça login novamente."
        ]);
        exit;
    }

    // Verificar expiração de sessão (1 hora de inatividade)
    if (isset($_SESSION['_last_activity']) && (time() - $_SESSION['_last_activity']) > 3600) {
        session_unset();
        session_destroy();
        http_response_code(401);
        echo json_encode([
            "status"  => "error",
            "message" => "Sessão expirada. Faça login novamente."
        ]);
        exit;
    }

    // Atualizar timestamp de atividade
    $_SESSION['_last_activity'] = time();
}

// ── Funções CSRF ───────────────────────────────────────────────

/**
 * Gera um token CSRF e armazena na sessão.
 * Retorna o token para ser incluído nos formulários.
 */
function gerarTokenCSRF(): string {
    if (empty($_SESSION['_csrf_token'])) {
        $_SESSION['_csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['_csrf_token'];
}

/**
 * Valida o token CSRF recebido na requisição.
 * Verifica tanto em POST quanto no header X-CSRF-Token.
 */
function validarCSRF() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        return; // CSRF só é necessário para operações que modificam dados
    }

    $tokenRecebido = $_POST['_csrf_token'] 
        ?? $_SERVER['HTTP_X_CSRF_TOKEN'] 
        ?? '';

    if (empty($tokenRecebido) || empty($_SESSION['_csrf_token'])) {
        http_response_code(403);
        echo json_encode([
            "status"  => "error",
            "message" => "Token de segurança inválido. Recarregue a página."
        ]);
        exit;
    }

    if (!hash_equals($_SESSION['_csrf_token'], $tokenRecebido)) {
        http_response_code(403);
        echo json_encode([
            "status"  => "error",
            "message" => "Token de segurança expirado. Recarregue a página."
        ]);
        exit;
    }
}

// ── Função: Sanitizar entrada ──────────────────────────────────

/**
 * Sanitiza uma string de entrada removendo tags e caracteres perigosos.
 * Substitui o deprecado FILTER_SANITIZE_STRING.
 */
function sanitizarEntrada(?string $valor): string {
    if ($valor === null || $valor === '') {
        return '';
    }
    return htmlspecialchars(strip_tags(trim($valor)), ENT_QUOTES, 'UTF-8');
}

/**
 * Valida um CPF brasileiro (formato e dígitos verificadores).
 */
function validarCPF(?string $cpf): bool {
    if (empty($cpf)) return false;

    $cpf = preg_replace('/\D/', '', $cpf);
    if (strlen($cpf) !== 11) return false;

    // CPFs com todos os dígitos iguais são inválidos
    if (preg_match('/^(\d)\1{10}$/', $cpf)) return false;

    // Validação dos dígitos verificadores
    for ($t = 9; $t < 11; $t++) {
        $d = 0;
        for ($c = 0; $c < $t; $c++) {
            $d += $cpf[$c] * (($t + 1) - $c);
        }
        $d = ((10 * $d) % 11) % 10;
        if ($cpf[$t] != $d) return false;
    }

    return true;
}

/**
 * Valida um e-mail.
 */
function validarEmail(?string $email): bool {
    if (empty($email)) return false;
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Valida se uma data está no formato YYYY-MM-DD e é válida.
 */
function validarData(?string $data): bool {
    if (empty($data)) return false;
    $d = DateTime::createFromFormat('Y-m-d', $data);
    return $d && $d->format('Y-m-d') === $data;
}

/**
 * Valida força da senha (mínimo 8 caracteres, letras e números).
 */
function validarSenha(?string $senha): bool {
    if (empty($senha) || strlen($senha) < 8) return false;
    // Pelo menos uma letra e um número
    return preg_match('/[A-Za-z]/', $senha) && preg_match('/[0-9]/', $senha);
}

/**
 * Retorna mensagem de erro genérica e loga o erro internamente.
 * NUNCA expõe detalhes da exceção ao cliente.
 */
function tratarErroBanco(PDOException $e, string $contexto = 'operação'): void {
    // Log interno (em produção, usar arquivo de log adequado)
    error_log("[SGE] Erro de banco em '$contexto': " . $e->getMessage());

    echo json_encode([
        "status"  => "error",
        "message" => "Erro interno do servidor. Tente novamente mais tarde."
    ]);
    exit;
}

// ── Rate Limiting simples baseado em sessão ────────────────────

/**
 * Verifica rate limiting para uma ação específica.
 * @param string $acao Nome da ação (ex: 'login')
 * @param int $maxTentativas Máximo de tentativas permitidas
 * @param int $periodoSegundos Período de tempo em segundos
 */
function verificarRateLimit(string $acao, int $maxTentativas = 5, int $periodoSegundos = 300): bool {
    $chave = "_rate_{$acao}";
    $agora = time();

    if (!isset($_SESSION[$chave])) {
        $_SESSION[$chave] = [];
    }

    // Remove tentativas antigas (fora do período)
    $_SESSION[$chave] = array_filter(
        $_SESSION[$chave],
        fn($ts) => ($agora - $ts) < $periodoSegundos
    );

    if (count($_SESSION[$chave]) >= $maxTentativas) {
        return false; // Rate limit excedido
    }

    $_SESSION[$chave][] = $agora;
    return true;
}
?>
