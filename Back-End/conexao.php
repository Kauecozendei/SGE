<?php
// Configuração do Banco de Dados para Docker (somente contêineres)
$configs = [
    // 1. Configuração para quando o PHP roda DENTRO do Docker (comunicação container-container)
    ['host' => 'mariadb', 'port' => '3306', 'user' => 'fatec', 'pass' => 'GKY59jfiyn'],
    // 2. Configuração para quando o PHP roda FORA do Docker (XAMPP/Host) acessando o MariaDB do Docker
    ['host' => '127.0.0.1', 'port' => '3308', 'user' => 'fatec', 'pass' => 'GKY59jfiyn'],
    ['host' => 'localhost', 'port' => '3308', 'user' => 'fatec', 'pass' => 'GKY59jfiyn'],
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
