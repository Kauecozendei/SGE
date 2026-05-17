<?php
session_start();
require_once '../conexao.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $id = filter_input(INPUT_POST, 'id', FILTER_SANITIZE_NUMBER_INT);

    if (empty($id)) {
        echo json_encode(["status" => "error", "message" => "ID do horário não fornecido."]);
        exit;
    }

    $updates = [];
    $params = [':id' => $id];

    if (!empty($_POST['aluno_id'])) {
        $updates[] = "alunos_id = :aluno_id";
        $params[':aluno_id'] = filter_input(INPUT_POST, 'aluno_id', FILTER_SANITIZE_NUMBER_INT);
    }
    if (!empty($_POST['data'])) {
        $updates[] = "data = :data";
        $params[':data'] = filter_input(INPUT_POST, 'data', FILTER_SANITIZE_STRING);
    }
    if (!empty($_POST['horario'])) {
        $updates[] = "horario = :horario";
        $params[':horario'] = filter_input(INPUT_POST, 'horario', FILTER_SANITIZE_STRING);
    }
    if (!empty($_POST['tipo'])) {
        $updates[] = "tipo = :tipo";
        $params[':tipo'] = filter_input(INPUT_POST, 'tipo', FILTER_SANITIZE_STRING);
    }
    if (isset($_POST['observacao'])) {
        $updates[] = "observacao = :observacao";
        $params[':observacao'] = filter_input(INPUT_POST, 'observacao', FILTER_SANITIZE_STRING);
    }
    if (!empty($_POST['funcionarios_id'])) {
        $updates[] = "funcionarios_id = :funcionarios_id";
        $params[':funcionarios_id'] = filter_input(INPUT_POST, 'funcionarios_id', FILTER_SANITIZE_NUMBER_INT);
    }

    if ($pdo) {
        try {
            if (!empty($updates)) {
                $sql = "UPDATE horarios SET " . implode(', ', $updates) . " WHERE id = :id";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                echo json_encode(["status" => "success", "message" => "Horário atualizado com sucesso!"]);
            } else {
                echo json_encode(["status" => "success", "message" => "Nenhum dado para atualizar."]);
            }
        } catch (PDOException $e) {
            echo json_encode(["status" => "error", "message" => "Erro ao atualizar horário.", "error" => $e->getMessage()]);
        }
    } else {
        echo json_encode(["status" => "warning", "message" => "Simulação: Banco desconectado."]);
    }
}
?>
