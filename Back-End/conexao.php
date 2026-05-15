<?php
// Configurações do Banco de Dados
// Baseado nas configurações do docker-compose.yml na pasta db:
// Se estiver rodando o PHP de dentro do container Docker 'php-SGE', use o host 'mariadb-SGE' e a porta '3306'.
define("DB_HOST", "mariadb"); 
define("DB_NAME", "BancoSGE");
define("DB_PORT", "3306");
define("DB_USER", "fatec");
define("DB_PASS", "");

try {
    // Criação da conexão com o banco de dados usando PDO
    $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    return $pdo;
} catch (PDOException $e) {
    // Como o banco ainda não está vinculado, vamos apenas ignorar a falha por enquanto
    // para não quebrar a página ao testar o front-end. Deixamos $pdo como null.
    // Descomente a linha abaixo para debugar erros de conexão futuramente:
    // die("Erro de conexão: " . $e->getMessage()); 
    $pdo = null; 
}
?>
