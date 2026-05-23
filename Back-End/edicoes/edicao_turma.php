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

    if (isset($_POST['nome_turma'])) {
        $updates[] = "nome = :nome";
        $params[':nome'] = filter_input(INPUT_POST, 'nome_turma', FILTER_SANITIZE_STRING);
    } else if (isset($_POST['nome'])) {
        $updates[] = "nome = :nome";
        $params[':nome'] = filter_input(INPUT_POST, 'nome', FILTER_SANITIZE_STRING);
    }
    
    if (isset($_POST['periodo'])) {
        $updates[] = "periodo = :periodo";
        $params[':periodo'] = filter_input(INPUT_POST, 'periodo', FILTER_SANITIZE_STRING);
    }

    if (isset($_POST['serie'])) {
        $updates[] = "serie = :serie";
        $params[':serie'] = filter_input(INPUT_POST, 'serie', FILTER_SANITIZE_STRING);
    }

    if (isset($_POST['sala'])) {
        $updates[] = "sala = :sala";
        $params[':sala'] = filter_input(INPUT_POST, 'sala', FILTER_SANITIZE_STRING);
    }

    if (isset($_POST['capacidade'])) {
        $updates[] = "capacidade = :capacidade";
        $params[':capacidade'] = filter_input(INPUT_POST, 'capacidade', FILTER_VALIDATE_INT);
    }

    if (isset($_POST['horario'])) {
        $updates[] = "horario = :horario";
        $params[':horario'] = filter_input(INPUT_POST, 'horario', FILTER_SANITIZE_STRING);
    }

    if ($pdo) {
        try {
            $pdo->beginTransaction();

            if (!empty($updates)) {
                $sql = "UPDATE turmas SET " . implode(', ', $updates) . " WHERE id = :id";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
            }

            // Atualiza professor responsável se foi enviado no POST
            if (isset($_POST['professor_id'])) {
                $professor_id = filter_input(INPUT_POST, 'professor_id', FILTER_VALIDATE_INT);
                
                // Remove qualquer professor associado anteriormente
                $stmtDel = $pdo->prepare("DELETE FROM professor_turma WHERE turmas_id = :turma_id");
                $stmtDel->execute([':turma_id' => $id]);

                // Insere nova associação se houver ID selecionado
                if (!empty($professor_id)) {
                    $stmtIns = $pdo->prepare("INSERT INTO professor_turma (professores_id, turmas_id) VALUES (:prof_id, :turma_id)");
                    $stmtIns->execute([
                        ':prof_id' => $professor_id,
                        ':turma_id' => $id
                    ]);
                }
            }

            $pdo->commit();
            echo json_encode(["status" => "success", "message" => "Turma atualizada com sucesso!"]);
        } catch (PDOException $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            echo json_encode(["status" => "error", "message" => "Erro ao atualizar turma.", "error" => $e->getMessage()]);
        }
    } else {
        echo json_encode(["status" => "warning", "message" => "Simulação: Banco desconectado."]);
    }
}
?>
