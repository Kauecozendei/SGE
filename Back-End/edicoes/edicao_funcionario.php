<?php
session_start();
require_once '../conexao.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $id = filter_input(INPUT_POST, 'id', FILTER_SANITIZE_NUMBER_INT);

    if (empty($id)) {
        echo json_encode(["status" => "error", "message" => "ID do funcionário não fornecido."]);
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
            $pdo->beginTransaction();

            if (!empty($_POST['cargo'])) {
                $cargo_nome = filter_input(INPUT_POST, 'cargo', FILTER_SANITIZE_STRING);
                $stmtCargo = $pdo->prepare("SELECT id FROM cargos WHERE nome = :nome LIMIT 1");
                $stmtCargo->execute([':nome' => $cargo_nome]);
                $cargoData = $stmtCargo->fetch(PDO::FETCH_ASSOC);
                
                if ($cargoData) {
                    $cargos_id = $cargoData['id'];
                } else {
                    $stmtNewCargo = $pdo->prepare("INSERT INTO cargos (nome) VALUES (:nome)");
                    $stmtNewCargo->execute([':nome' => $cargo_nome]);
                    $cargos_id = $pdo->lastInsertId();
                }
                $updates[] = "cargos_id = :cargos_id";
                $params[':cargos_id'] = $cargos_id;
            }

            if (!empty($updates)) {
                $sql = "UPDATE funcionarios SET " . implode(', ', $updates) . " WHERE id = :id";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
            }

            $pdo->commit();
            echo json_encode(["status" => "success", "message" => "Funcionário atualizado com sucesso!"]);
        } catch (PDOException $e) {
            $pdo->rollBack();
            echo json_encode(["status" => "error", "message" => "Erro ao atualizar funcionário.", "error" => $e->getMessage()]);
        }
    } else {
        echo json_encode(["status" => "warning", "message" => "Simulação: Banco desconectado."]);
    }
}
?>
