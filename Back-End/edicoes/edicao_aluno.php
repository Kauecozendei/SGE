<?php
session_start();
require_once '../conexao.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $id = filter_input(INPUT_POST, 'id', FILTER_SANITIZE_NUMBER_INT);

    if (empty($id)) {
        echo json_encode(["status" => "error", "message" => "ID do aluno não fornecido."]);
        exit;
    }

    $updates = [];
    $params = [':id' => $id];

    // Verificar quais campos vieram no POST para montar a query dinamicamente
    if (!empty($_POST['nome_aluno'])) {
        $updates[] = "nome = :nome";
        $params[':nome'] = filter_input(INPUT_POST, 'nome_aluno', FILTER_SANITIZE_STRING);
    } else if (!empty($_POST['nome'])) { // Fallback
        $updates[] = "nome = :nome";
        $params[':nome'] = filter_input(INPUT_POST, 'nome', FILTER_SANITIZE_STRING);
    }

    if (!empty($_POST['cpf_aluno'])) {
        $updates[] = "CPF = :cpf";
        $params[':cpf'] = filter_input(INPUT_POST, 'cpf_aluno', FILTER_SANITIZE_STRING);
    } else if (!empty($_POST['cpf'])) { // Fallback
        $updates[] = "CPF = :cpf";
        $params[':cpf'] = filter_input(INPUT_POST, 'cpf', FILTER_SANITIZE_STRING);
    }

    if (!empty($_POST['data_nascimento'])) {
        $updates[] = "data_nascimento = :nasc";
        $params[':nasc'] = filter_input(INPUT_POST, 'data_nascimento', FILTER_SANITIZE_STRING);
    } else if (!empty($_POST['data_nasc_aluno'])) { // Fallback antigo
        $updates[] = "data_nascimento = :nasc";
        $params[':nasc'] = filter_input(INPUT_POST, 'data_nasc_aluno', FILTER_SANITIZE_STRING);
    }

    if ($pdo) {
        try {
            $pdo->beginTransaction();

            // Atualiza os dados principais do Aluno
            if (!empty($updates)) {
                $sql = "UPDATE alunos SET " . implode(', ', $updates) . " WHERE id = :id";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
            }

            // Atualização do Relacionamento de Turma (se fornecido)
            if (!empty($_POST['turma_id']) || !empty($_POST['turma'])) {
                $turma_input = !empty($_POST['turma_id']) ? $_POST['turma_id'] : $_POST['turma'];
                
                // Pega o ID da turma pelo nome ou assume que é ID
                $sqlTurma = "SELECT id FROM turmas WHERE nome = :nome OR id = :id_turma LIMIT 1";
                $stmtTurma = $pdo->prepare($sqlTurma);
                $stmtTurma->execute([':nome' => $turma_input, ':id_turma' => $turma_input]);
                $turmaData = $stmtTurma->fetch(PDO::FETCH_ASSOC);
                
                if ($turmaData) {
                    $turma_id = $turmaData['id'];
                    
                    $sqlCheckTurma = "SELECT * FROM aluno_turma WHERE alunos_id = :aluno_id";
                    $stmtCheckTurma = $pdo->prepare($sqlCheckTurma);
                    $stmtCheckTurma->execute([':aluno_id' => $id]);
                    
                    if ($stmtCheckTurma->rowCount() > 0) {
                        $sqlUpdateTurma = "UPDATE aluno_turma SET turmas_id = :turma_id WHERE alunos_id = :aluno_id";
                        $stmtUpdate = $pdo->prepare($sqlUpdateTurma);
                        $stmtUpdate->execute([':turma_id' => $turma_id, ':aluno_id' => $id]);
                    } else {
                        $sqlInsertTurma = "INSERT INTO aluno_turma (alunos_id, turmas_id, data_inicio) VALUES (:aluno_id, :turma_id, NOW())";
                        $stmtInsert = $pdo->prepare($sqlInsertTurma);
                        $stmtInsert->execute([':aluno_id' => $id, ':turma_id' => $turma_id]);
                    }
                }
            }

            // Atualização do Relacionamento com Responsável (se fornecido)
            if (!empty($_POST['nome_responsavel']) || !empty($_POST['cpf_responsavel'])) {
                $nome_resp = filter_input(INPUT_POST, 'nome_responsavel', FILTER_SANITIZE_STRING);
                $cpf_resp = filter_input(INPUT_POST, 'cpf_responsavel', FILTER_SANITIZE_STRING);
                $tel_resp = filter_input(INPUT_POST, 'telefone_responsavel', FILTER_SANITIZE_STRING);
                $email_resp = filter_input(INPUT_POST, 'email_responsavel', FILTER_SANITIZE_EMAIL);
                $parentesco = filter_input(INPUT_POST, 'parentesco', FILTER_SANITIZE_STRING) ?? 'Responsável';

                if (!empty($cpf_resp)) {
                    $sqlResp = "INSERT INTO responsaveis (nome, CPF, telefone, data_nascimento, email) 
                                VALUES (:nome, :cpf, :telefone, '1990-01-01', :email)
                                ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id), telefone=:telefone, nome=:nome";
                    $stmtResp = $pdo->prepare($sqlResp);
                    $stmtResp->execute([
                        ':nome' => $nome_resp,
                        ':cpf' => $cpf_resp,
                        ':telefone' => $tel_resp,
                        ':email' => $email_resp
                    ]);
                    $resp_id = $pdo->lastInsertId();

                    if ($resp_id > 0) {
                        $sqlCheckRel = "SELECT * FROM aluno_responsavel WHERE alunos_id = :aluno_id AND responsaveis_id = :resp_id";
                        $stmtCheckRel = $pdo->prepare($sqlCheckRel);
                        $stmtCheckRel->execute([':aluno_id' => $id, ':resp_id' => $resp_id]);

                        if ($stmtCheckRel->rowCount() == 0) {
                            $sqlLink = "INSERT INTO aluno_responsavel (alunos_id, responsaveis_id, relacao) VALUES (:aluno, :resp, :rel)";
                            $stmtLink = $pdo->prepare($sqlLink);
                            $stmtLink->execute([
                                ':aluno' => $id,
                                ':resp' => $resp_id,
                                ':rel' => $parentesco
                            ]);
                        } else {
                            $sqlUpdateRel = "UPDATE aluno_responsavel SET relacao = :rel WHERE alunos_id = :aluno AND responsaveis_id = :resp";
                            $stmtUpdateRel = $pdo->prepare($sqlUpdateRel);
                            $stmtUpdateRel->execute([
                                ':aluno' => $id,
                                ':resp' => $resp_id,
                                ':rel' => $parentesco
                            ]);
                        }
                    }
                }
            }

            $pdo->commit();
            echo json_encode(["status" => "success", "message" => "Aluno atualizado com sucesso!"]);
        } catch (PDOException $e) {
            $pdo->rollBack();
            echo json_encode(["status" => "error", "message" => "Erro ao atualizar aluno.", "error" => $e->getMessage()]);
        }
    } else {
        echo json_encode(["status" => "warning", "message" => "Simulação: Banco desconectado."]);
    }
}
?>
