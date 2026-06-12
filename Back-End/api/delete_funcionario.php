<?php
session_start();
require_once __DIR__ . '/../conexao.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $id = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);

    if (empty($id)) {
        echo json_encode(["status" => "error", "message" => "ID do funcionário não fornecido."]);
        exit;
    }

    if ($pdo) {
        try {
            $pdo->beginTransaction();

            // Remove as dependências nas tabelas filhas antes de remover o funcionário
            $pdo->prepare("DELETE FROM professor_turma_disciplina WHERE professores_id = ?")->execute([$id]);
            $pdo->prepare("DELETE FROM professor_turma WHERE professores_id = ?")->execute([$id]);
            $pdo->prepare("DELETE FROM horarios WHERE funcionarios_id = ?")->execute([$id]);
            $pdo->prepare("DELETE FROM alimentacao WHERE funcionarios_id = ?")->execute([$id]);
            $pdo->prepare("DELETE FROM banhos WHERE funcionarios_id = ?")->execute([$id]);
            $pdo->prepare("DELETE FROM log_registros WHERE funcionarios_id = ?")->execute([$id]);

            // Remove da tabela funcionarios (cargos_id != 2, garantindo que não estamos removendo um professor acidentalmente por este endpoint)
            $stmt = $pdo->prepare("DELETE FROM funcionarios WHERE id = ? AND cargos_id != 2");
            $stmt->execute([$id]);

            if ($stmt->rowCount() > 0) {
                $pdo->commit();
                echo json_encode(["status" => "success", "message" => "Funcionário removido com sucesso."]);
            } else {
                $pdo->rollBack();
                echo json_encode(["status" => "error", "message" => "Funcionário não encontrado ou é um Professor."]);
            }
        } catch (PDOException $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            echo json_encode(["status" => "error", "message" => "Erro ao remover funcionário: " . $e->getMessage()]);
        }
    } else {
        echo json_encode(["status" => "warning", "message" => "Banco de dados não conectado. Operação simulada com sucesso!"]);
    }
    exit;
} else {
    echo json_encode(["status" => "error", "message" => "Método inválido."]);
    exit;
}
?>
