<?php
session_start();
require_once __DIR__ . '/../conexao.php';

header('Content-Type: application/json');

if ($pdo) {
    try {
        // Seleciona todos os funcionários que NÃO são professores (cargos_id != 1)
        $sql = "
            SELECT f.id, f.nome, f.CPF as cpf, f.telefone as tel, f.email, f.status, f.formacao, c.nome as cargo
            FROM funcionarios f
            INNER JOIN cargos c ON f.cargos_id = c.id
            WHERE f.cargos_id != 1
            ORDER BY f.id DESC
        ";
        $stmt = $pdo->query($sql);
        $funcionarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Trata campos nulos ou ausentes
        foreach ($funcionarios as &$f) {
            $f['status'] = $f['status'] ? $f['status'] : 'ativo';
            $f['formacao'] = $f['formacao'] ? $f['formacao'] : '';
            $f['tel'] = $f['tel'] ? $f['tel'] : '';
            $f['email'] = $f['email'] ? $f['email'] : '';
        }

        echo json_encode(["status" => "success", "data" => $funcionarios]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Erro ao buscar funcionários: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "warning", "message" => "Banco de dados não conectado.", "data" => []]);
}
?>
