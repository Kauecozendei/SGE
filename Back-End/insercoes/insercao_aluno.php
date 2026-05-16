<?php
require_once '../conexao.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    $nome_aluno = filter_input(INPUT_POST, 'nome_aluno', FILTER_SANITIZE_STRING);
    $cpf_aluno = filter_input(INPUT_POST, 'cpf_aluno', FILTER_SANITIZE_STRING);
    $data_nascimento = filter_input(INPUT_POST, 'data_nascimento', FILTER_SANITIZE_STRING);
    $turma = filter_input(INPUT_POST, 'turma_id', FILTER_SANITIZE_STRING);
    $periodo = filter_input(INPUT_POST, 'periodo', FILTER_SANITIZE_STRING);
    
    $nome_responsavel = filter_input(INPUT_POST, 'nome_responsavel', FILTER_SANITIZE_STRING);
    $cpf_responsavel = filter_input(INPUT_POST, 'cpf_responsavel', FILTER_SANITIZE_STRING);
    $telefone_responsavel = filter_input(INPUT_POST, 'telefone_responsavel', FILTER_SANITIZE_STRING);
    $email_responsavel = filter_input(INPUT_POST, 'email_responsavel', FILTER_SANITIZE_EMAIL);
    $parentesco = filter_input(INPUT_POST, 'parentesco', FILTER_SANITIZE_STRING);
    
    $instituicoes_id = 1; // Default
    $matricula = rand(100000, 999999); // Generate random matricula

    if (empty($nome_aluno) || empty($data_nascimento) || empty($nome_responsavel)) {
        echo json_encode(["status" => "error", "message" => "Preencha os campos obrigatórios."]);
        exit;
    }

    if ($pdo) {
        try {
            $pdo->beginTransaction();

            // Insert Responsável
            $sqlResp = "INSERT INTO responsaveis (nome, CPF, telefone, data_nascimento, email) 
                        VALUES (:nome, :cpf, :telefone, '1990-01-01', :email)
                        ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id), telefone=:telefone";
            $stmtResp = $pdo->prepare($sqlResp);
            $stmtResp->execute([
                ':nome' => $nome_responsavel,
                ':cpf' => $cpf_responsavel,
                ':telefone' => $telefone_responsavel,
                ':email' => $email_responsavel
            ]);
            $resp_id = $pdo->lastInsertId();

            // Insert Aluno
            $sqlAluno = "INSERT INTO alunos (matricula, nome, CPF, data_nascimento, instituicoes_id) 
                         VALUES (:matricula, :nome, :cpf, :nasc, :inst)";
            $stmtAluno = $pdo->prepare($sqlAluno);
            $stmtAluno->execute([
                ':matricula' => $matricula,
                ':nome' => $nome_aluno,
                ':cpf' => $cpf_aluno,
                ':nasc' => $data_nascimento,
                ':inst' => $instituicoes_id
            ]);
            $aluno_id = $pdo->lastInsertId();

            // Link Aluno-Responsavel
            $sqlLink = "INSERT INTO aluno_responsavel (alunos_id, responsaveis_id, relacao) VALUES (:aluno, :resp, :rel)";
            $stmtLink = $pdo->prepare($sqlLink);
            $stmtLink->execute([
                ':aluno' => $aluno_id,
                ':resp' => $resp_id,
                ':rel' => $parentesco
            ]);
            
            // Find Turma ID (mocking it if it doesn't exist by name)
            // since the frontend passes the name like "Turma A - Manhã"
            $sqlTurma = "SELECT id FROM turmas WHERE nome = :nome LIMIT 1";
            $stmtTurma = $pdo->prepare($sqlTurma);
            $stmtTurma->execute([':nome' => $turma]);
            $turmaData = $stmtTurma->fetch(PDO::FETCH_ASSOC);
            $turma_id = $turmaData ? $turmaData['id'] : null;

            if ($turma_id) {
                $sqlAluTurma = "INSERT INTO aluno_turma (alunos_id, turmas_id, data_inicio) VALUES (:aluno, :turma, NOW())";
                $stmtAluTurma = $pdo->prepare($sqlAluTurma);
                $stmtAluTurma->execute([':aluno' => $aluno_id, ':turma' => $turma_id]);
            }

            $pdo->commit();
            echo json_encode(["status" => "success", "message" => "Aluno cadastrado com sucesso! Matrícula: " . $matricula]);
        } catch (PDOException $e) {
            $pdo->rollBack();
            echo json_encode(["status" => "error", "message" => "Erro ao salvar aluno: " . $e->getMessage()]);
        }
    } else {
        echo json_encode(["status" => "warning", "message" => "Simulação: Banco desconectado."]);
    }
}
?>
