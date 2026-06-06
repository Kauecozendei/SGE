<?php
$hosts = [
    ['127.0.0.1', '3308'],
    ['localhost', '3308']
];

foreach ($hosts as $h) {
    try {
        echo "Testing {$h[0]}:{$h[1]}...\n";
        $pdo = new PDO("mysql:host={$h[0]};port={$h[1]};dbname=BancoSGE;charset=utf8mb4", "fatec", "GKY59jfiyn");
        echo "SUCCESS on {$h[0]}:{$h[1]}!\n";
    } catch (Exception $e) {
        echo "Failed on {$h[0]}:{$h[1]} - " . $e->getMessage() . "\n";
    }
}
?>
