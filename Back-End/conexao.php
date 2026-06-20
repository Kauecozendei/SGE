<?php
// Configuração do Banco de Dados para Docker e Local (XAMPP/Windows)
$configs = [
    // 1. Configuração para quando o PHP roda DENTRO do Docker (comunicação container-container)
    ['host' => 'mariadb', 'port' => '3306', 'user' => 'fatec', 'pass' => 'GKY59jfiyn'],
    // 2. Configuração para quando o PHP roda no XAMPP/Windows local (acessando a porta mapeada 3308)
    ['host' => '127.0.0.1', 'port' => '3308', 'user' => 'fatec', 'pass' => 'GKY59jfiyn'],
    // 3. Fallback para banco local padrão do XAMPP (porta 3306 com root e sem senha)
    ['host' => '127.0.0.1', 'port' => '3306', 'user' => 'root', 'pass' => ''],
];

$pdo = null;
$connected = false;

foreach ($configs as $config) {
    try {
        $dsn = "mysql:host=" . $config['host'] . ";port=" . $config['port'] . ";dbname=BancoSGE;charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::ATTR_TIMEOUT            => 1 // Timeout rápido de 1 segundo por tentativa
        ];
        $pdo = @new PDO($dsn, $config['user'], $config['pass'], $options);
        $connected = true;
        
        // Define as constantes para manter compatibilidade
        if (!defined("DB_HOST")) define("DB_HOST", $config['host']);
        if (!defined("DB_PORT")) define("DB_PORT", $config['port']);
        if (!defined("DB_NAME")) define("DB_NAME", "BancoSGE");
        if (!defined("DB_USER")) define("DB_USER", $config['user']);
        if (!defined("DB_PASS")) define("DB_PASS", $config['pass']);
        break;
    } catch (PDOException $e) {
        // Ignora e tenta a próxima configuração
    }
}

if (!$connected) {
    $pdo = null; 
}
return $pdo;
?>
