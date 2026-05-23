<?php
session_start();
require_once '../conexao.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $id = filter_input(INPUT_POST, 'id', FILTER_SANITIZE_NUMBER_INT);

    if (empty($id)) {
        echo json_encode(["status" => "error", "message" => "ID do responsável não fornecido."]);
        exit;
    }

    $updates = [];
    $params = [':id' => $id];

    if (!empty($_POST['nome'])) {
        $updates[] = "nome = :nome";
        $params[':nome'] = filter_input(INPUT_POST, 'nome', FILTER_SANITIZE_STRING);
    }
    if (!empty($_POST['cpf'])) {
        $updates[] = "CPF = :cpf";
        $params[':cpf'] = filter_input(INPUT_POST, 'cpf', FILTER_SANITIZE_STRING);
    }
    if (!empty($_POST['telefone'])) {
        $updates[] = "telefone = :telefone";
        $params[':telefone'] = filter_input(INPUT_POST, 'telefone', FILTER_SANITIZE_STRING);
    }
    if (!empty($_POST['email'])) {
        $updates[] = "email = :email";
        $params[':email'] = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
    }
    if (!empty($_POST['data_nascimento'])) {
        $updates[] = "data_nascimento = :nasc";
        $params[':nasc'] = filter_input(INPUT_POST, 'data_nascimento', FILTER_SANITIZE_STRING);
    }

    if ($pdo) {
        try {
            if (!empty($updates)) {
                $sql = "UPDATE responsaveis SET " . implode(', ', $updates) . " WHERE id = :id";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                echo json_encode(["status" => "success", "message" => "Responsável atualizado com sucesso!"]);
            } else {
                echo json_encode(["status" => "success", "message" => "Nenhum dado para atualizar."]);
            }
        } catch (PDOException $e) {
            echo json_encode(["status" => "error", "message" => "Erro ao atualizar responsável.", "error" => $e->getMessage()]);
        }
    } else {
        echo json_encode(["status" => "warning", "message" => "Simulação: Banco desconectado."]);
    }
}
?>
