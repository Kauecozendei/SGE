<?php
error_reporting(E_ALL & ~E_DEPRECATED & ~E_NOTICE);

// Configuração do Banco de Dados via variáveis de ambiente
// As credenciais NÃO devem ser hardcoded no código-fonte.
// Defina as variáveis de ambiente no servidor ou no arquivo .env (fora do Git).

$db_host = getenv('DB_HOST') ?: 'mariadb';
$db_port = getenv('DB_PORT') ?: '3306';
$db_user = getenv('DB_USER') ?: 'fatec';
$db_pass = getenv('DB_PASS') ?: '';
$db_name = getenv('DB_NAME') ?: 'BancoSGE';

$pdo = null;

try {
    $dsn = "mysql:host={$db_host};port={$db_port};dbname={$db_name};charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
        PDO::ATTR_TIMEOUT            => 3
    ];
    $pdo = new PDO($dsn, $db_user, $db_pass, $options);

    // Define as constantes para manter compatibilidade
    if (!defined("DB_HOST")) define("DB_HOST", $db_host);
    if (!defined("DB_PORT")) define("DB_PORT", $db_port);
    if (!defined("DB_NAME")) define("DB_NAME", $db_name);
    if (!defined("DB_USER")) define("DB_USER", $db_user);

} catch (PDOException $e) {
    // Log interno — NUNCA expor detalhes ao cliente
    error_log("[SGE] Falha na conexão com o banco: " . $e->getMessage());
    $pdo = null;
}

return $pdo;
?>
