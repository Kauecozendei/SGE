<?php
session_start();
require_once '../conexao.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    $nome = filter_input(INPUT_POST, 'nome_turma', FILTER_DEFAULT);
    $periodo = filter_input(INPUT_POST, 'periodo', FILTER_DEFAULT);
    $serie = filter_input(INPUT_POST, 'serie', FILTER_DEFAULT);
    $sala = filter_input(INPUT_POST, 'sala', FILTER_DEFAULT);
    $capacidade = filter_input(INPUT_POST, 'capacidade', FILTER_VALIDATE_INT);
    $horario = filter_input(INPUT_POST, 'horario', FILTER_DEFAULT);
    $professor_id = filter_input(INPUT_POST, 'professor_id', FILTER_VALIDATE_INT);
    
    $instituicoes_id = 1; // Default

    if (empty($nome) || empty($periodo)) {
        echo json_encode(["status" => "error", "message" => "Preencha os campos obrigatórios (Nome e Período)."]);
        exit;
    }

    if ($capacidade === false || $capacidade === null) {
        $capacidade = 25; // padrão
    }

    if ($pdo) {
        try {
            $pdo->beginTransaction();

            $sqlTurma = "INSERT INTO turmas (nome, periodo, serie, sala, capacidade, horario, instituicoes_id) 
                         VALUES (:nome, :periodo, :serie, :sala, :capacidade, :horario, :inst)";
            $stmtTurma = $pdo->prepare($sqlTurma);
            $stmtTurma->execute([
                ':nome' => $nome,
                ':periodo' => $periodo,
                ':serie' => $serie,
                ':sala' => $sala,
                ':capacidade' => $capacidade,
                ':horario' => $horario,
                ':inst' => $instituicoes_id
            ]);

            $turma_id = $pdo->lastInsertId();

            // Se um professor foi selecionado, cria a associação
            if (!empty($professor_id)) {
                $sqlProf = "INSERT INTO professor_turma (professores_id, turmas_id) VALUES (:prof_id, :turma_id)";
                $stmtProf = $pdo->prepare($sqlProf);
                $stmtProf->execute([
                    ':prof_id' => $professor_id,
                    ':turma_id' => $turma_id
                ]);
            }

            $pdo->commit();
            echo json_encode(["status" => "success", "message" => "Turma cadastrada com sucesso!"]);
        } catch (PDOException $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            echo json_encode(["status" => "error", "message" => "Erro ao salvar turma.", "error" => $e->getMessage()]);
        }
    } else {
        echo json_encode(["status" => "warning", "message" => "Simulação: Banco desconectado."]);
    }
}
?>
