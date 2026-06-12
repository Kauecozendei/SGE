<?php
session_start();
require_once __DIR__ . '/../conexao.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "Método inválido."]);
    exit;
}

$id = filter_input(INPUT_POST, 'id', FILTER_SANITIZE_NUMBER_INT);
$nome_aluno = filter_input(INPUT_POST, 'nome_aluno', FILTER_SANITIZE_STRING);
$cpf_aluno = filter_input(INPUT_POST, 'cpf_aluno', FILTER_SANITIZE_STRING);
$cpf_aluno = !empty($cpf_aluno) ? trim($cpf_aluno) : null;
$data_nascimento = filter_input(INPUT_POST, 'data_nascimento', FILTER_SANITIZE_STRING);
$turma_id_str = filter_input(INPUT_POST, 'turma_id', FILTER_SANITIZE_STRING);
$periodo = filter_input(INPUT_POST, 'periodo', FILTER_SANITIZE_STRING);
$endereco = filter_input(INPUT_POST, 'endereco', FILTER_SANITIZE_STRING);
$observacoes = filter_input(INPUT_POST, 'observacoes', FILTER_SANITIZE_STRING);

$nome_responsavel = filter_input(INPUT_POST, 'nome_responsavel', FILTER_SANITIZE_STRING);
$cpf_responsavel = filter_input(INPUT_POST, 'cpf_responsavel', FILTER_SANITIZE_STRING);
$cpf_responsavel = !empty($cpf_responsavel) ? trim($cpf_responsavel) : null;
$telefone_responsavel = filter_input(INPUT_POST, 'telefone_responsavel', FILTER_SANITIZE_STRING);
$email_responsavel = filter_input(INPUT_POST, 'email_responsavel', FILTER_SANITIZE_EMAIL);
$parentesco = filter_input(INPUT_POST, 'parentesco', FILTER_SANITIZE_STRING);

if (empty($nome_aluno) || empty($cpf_aluno) || empty($data_nascimento) || empty($nome_responsavel) || empty($cpf_responsavel) || empty($telefone_responsavel)) {
    echo json_encode(["status" => "error", "message" => "Por favor, preencha todos os campos obrigatórios."]);
    exit;
}

if (!$pdo) {
    echo json_encode(["status" => "warning", "message" => "Banco de dados não conectado. Operação simulada com sucesso!"]);
    exit;
}

try {
    $pdo->beginTransaction();

    // 1. Resolver Endereço (se fornecido)
    $enderecos_id = null;
    if (!empty($endereco)) {
        // Tenta extrair dados básicos do endereço
        $rua = $endereco;
        $cidade = "São Paulo";
        $uf = "SP";
        
        $stmtAddr = $pdo->prepare("INSERT INTO enderecos (rua, cidade, UF) VALUES (?, ?, ?)");
        $stmtAddr->execute([$rua, $cidade, $uf]);
        $enderecos_id = $pdo->lastInsertId();
    }

    // 2. Salvar ou Atualizar Responsável
    $responsavel_id = null;
    if (!empty($cpf_responsavel)) {
        // Verifica se já existe um responsável com esse CPF
        $stmtRespCheck = $pdo->prepare("SELECT id FROM responsaveis WHERE CPF = ?");
        $stmtRespCheck->execute([$cpf_responsavel]);
        $responsavel_id = $stmtRespCheck->fetchColumn();
    }

    if ($responsavel_id) {
        // Atualiza responsável existente
        $stmtRespUpdate = $pdo->prepare("UPDATE responsaveis SET nome = ?, telefone = ?, email = ? WHERE id = ?");
        $stmtRespUpdate->execute([$nome_responsavel, $telefone_responsavel, $email_responsavel, $responsavel_id]);
    } else {
        // Se CPF do responsável for nulo/vazio, geramos um CPF fictício único para satisfazer a constraint UNIQUE e NOT NULL
        if (empty($cpf_responsavel)) {
            $cpf_responsavel = '999.' . rand(100, 999) . '.' . rand(100, 999) . '-' . rand(10, 99);
            while (true) {
                $stmtCheck = $pdo->prepare("SELECT COUNT(*) FROM responsaveis WHERE CPF = ?");
                $stmtCheck->execute([$cpf_responsavel]);
                if ($stmtCheck->fetchColumn() == 0) {
                    break;
                }
                $cpf_responsavel = '999.' . rand(100, 999) . '.' . rand(100, 999) . '-' . rand(10, 99);
            }
        }

        // Insere novo responsável
        $stmtRespInsert = $pdo->prepare("INSERT INTO responsaveis (nome, CPF, telefone, email, data_nascimento) VALUES (?, ?, ?, ?, ?)");
        $stmtRespInsert->execute([$nome_responsavel, $cpf_responsavel, $telefone_responsavel, $email_responsavel, '1980-01-01']);
        $responsavel_id = $pdo->lastInsertId();
    }

    // 3. Resolver Turma
    $turma_db_id = null;
    if (!empty($turma_id_str)) {
        if (is_numeric($turma_id_str)) {
            $turma_db_id = (int)$turma_id_str;
        } else {
            $turma_nome = trim(explode('-', $turma_id_str)[0]);
            $stmtTurma = $pdo->prepare("SELECT id FROM turmas WHERE nome = ? OR nome = ? LIMIT 1");
            $stmtTurma->execute([$turma_nome, $turma_id_str]);
            $turma_db_id = $stmtTurma->fetchColumn();

            if (!$turma_db_id) {
                // Insere turma se não existir
                $stmtTurmaInsert = $pdo->prepare("INSERT INTO turmas (nome, periodo, instituicoes_id) VALUES (?, ?, 1)");
                $stmtTurmaInsert->execute([$turma_nome, $periodo ? $periodo : 'Manhã', 1]);
                $turma_db_id = $pdo->lastInsertId();
            }
        }
    }

    if (!empty($id)) {
        // MODO EDIÇÃO
        // Atualiza aluno
        $stmtAlunoUpdate = $pdo->prepare("UPDATE alunos SET nome = ?, CPF = ?, data_nascimento = ? WHERE id = ?");
        $stmtAlunoUpdate->execute([$nome_aluno, $cpf_aluno, $data_nascimento, $id]);

        // Atualiza relação com responsável
        $pdo->prepare("DELETE FROM aluno_responsavel WHERE alunos_id = ?")->execute([$id]);
        $stmtAR = $pdo->prepare("INSERT INTO aluno_responsavel (alunos_id, responsaveis_id, relacao) VALUES (?, ?, ?)");
        $stmtAR->execute([$id, $responsavel_id, $parentesco ? $parentesco : 'Outro']);

        // Atualiza turma
        if ($turma_db_id) {
            $pdo->prepare("DELETE FROM aluno_turma WHERE alunos_id = ?")->execute([$id]);
            $stmtAT = $pdo->prepare("INSERT INTO aluno_turma (alunos_id, turmas_id, data_inicio) VALUES (?, ?, ?)");
            $stmtAT->execute([$id, $turma_db_id, date('Y-m-d')]);
        }

        $message = "Aluno atualizado com sucesso!";
    } else {
        // MODO CADASTRO NOVO
        // Gerar matrícula única
        $matricula = rand(1000000, 9999999);
        while (true) {
            $stmtCheck = $pdo->prepare("SELECT COUNT(*) FROM alunos WHERE matricula = ?");
            $stmtCheck->execute([$matricula]);
            if ($stmtCheck->fetchColumn() == 0) {
                break;
            }
            $matricula = rand(1000000, 9999999);
        }

        // Insere aluno
        $stmtAlunoInsert = $pdo->prepare("INSERT INTO alunos (matricula, nome, CPF, data_nascimento, instituicoes_id, enderecos_id) VALUES (?, ?, ?, ?, 1, ?)");
        $stmtAlunoInsert->execute([$matricula, $nome_aluno, $cpf_aluno, $data_nascimento, $enderecos_id]);
        $aluno_id = $pdo->lastInsertId();

        // Insere relação de responsabilidade
        $stmtAR = $pdo->prepare("INSERT INTO aluno_responsavel (alunos_id, responsaveis_id, relacao) VALUES (?, ?, ?)");
        $stmtAR->execute([$aluno_id, $responsavel_id, $parentesco ? $parentesco : 'Outro']);

        // Insere relação com turma
        if ($turma_db_id) {
            $stmtAT = $pdo->prepare("INSERT INTO aluno_turma (alunos_id, turmas_id, data_inicio) VALUES (?, ?, ?)");
            $stmtAT->execute([$aluno_id, $turma_db_id, date('Y-m-d')]);
        }

        $message = "Aluno cadastrado com sucesso!";
    }

    $pdo->commit();
    echo json_encode(["status" => "success", "message" => $message]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(["status" => "error", "message" => "Erro de banco de dados: " . $e->getMessage()]);
}
?>
