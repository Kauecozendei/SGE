<?php
    try {
        $pdo = new PDO(
            "mysql:host=mariadb;dbname=BancoSGE", 
            "fatec", 
            "GKY59jfiyn");
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            echo "Conectado com sucesso!";
    } catch (Exception $e) {
    echo "Erro: " . $e->getMessage();
    }
?>