<?php
session_start();
require_once '../conexao.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $id = filter_input(INPUT_POST, 'id', FILTER_SANITIZE_NUMBER_INT);

    if (empty($id)) {
        echo json_encode(["status" => "error", "message" => "ID da turma não fornecido."]);
        exit;
    }

    $updates = [];
    $params = [':id' => $id];

    if (!empty($_POST['nome_turma'])) {
        $updates[] = "nome = :nome";
        $params[':nome'] = filter_input(INPUT_POST, 'nome_turma', FILTER_SANITIZE_STRING);
    } else if (!empty($_POST['nome'])) {
        $updates[] = "nome = :nome";
        $params[':nome'] = filter_input(INPUT_POST, 'nome', FILTER_SANITIZE_STRING);
    }
    
    if (!empty($_POST['periodo'])) {
        $updates[] = "periodo = :periodo";
        $params[':periodo'] = filter_input(INPUT_POST, 'periodo', FILTER_SANITIZE_STRING);
    }

    if ($pdo) {
        try {
            if (!empty($updates)) {
                $sql = "UPDATE turmas SET " . implode(', ', $updates) . " WHERE id = :id";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                echo json_encode(["status" => "success", "message" => "Turma atualizada com sucesso!"]);
            } else {
                echo json_encode(["status" => "success", "message" => "Nenhum dado para atualizar."]);
            }
        } catch (PDOException $e) {
            echo json_encode(["status" => "error", "message" => "Erro ao atualizar turma.", "error" => $e->getMessage()]);
        }
    } else {
        echo json_encode(["status" => "warning", "message" => "Simulação: Banco desconectado."]);
    }
}
?>
