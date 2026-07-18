<?php
require_once __DIR__ . '/../auth_guard.php';
require_once __DIR__ . '/../conexao.php';

// Verificar autenticação e CSRF
verificarAutenticacao();
validarCSRF();

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Método inválido."]);
    exit;
}

$id = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);
$nome_aluno = sanitizarEntrada(filter_input(INPUT_POST, 'nome_aluno', FILTER_DEFAULT));
$cpf_aluno = sanitizarEntrada(filter_input(INPUT_POST, 'cpf_aluno', FILTER_DEFAULT));
$cpf_aluno = !empty($cpf_aluno) ? trim($cpf_aluno) : null;
$data_nascimento = sanitizarEntrada(filter_input(INPUT_POST, 'data_nascimento', FILTER_DEFAULT));
$turma_id_str = sanitizarEntrada(filter_input(INPUT_POST, 'turma_id', FILTER_DEFAULT));
$periodo = sanitizarEntrada(filter_input(INPUT_POST, 'periodo', FILTER_DEFAULT));
$endereco = sanitizarEntrada(filter_input(INPUT_POST, 'endereco', FILTER_DEFAULT));
$observacoes = sanitizarEntrada(filter_input(INPUT_POST, 'observacoes', FILTER_DEFAULT));

$nome_responsavel = sanitizarEntrada(filter_input(INPUT_POST, 'nome_responsavel', FILTER_DEFAULT));
$cpf_responsavel = sanitizarEntrada(filter_input(INPUT_POST, 'cpf_responsavel', FILTER_DEFAULT));
$cpf_responsavel = !empty($cpf_responsavel) ? trim($cpf_responsavel) : null;
$telefone_responsavel = sanitizarEntrada(filter_input(INPUT_POST, 'telefone_responsavel', FILTER_DEFAULT));
$email_responsavel = filter_input(INPUT_POST, 'email_responsavel', FILTER_SANITIZE_EMAIL);
$parentesco = sanitizarEntrada(filter_input(INPUT_POST, 'parentesco', FILTER_DEFAULT));

// Validação de campos obrigatórios
if (empty($nome_aluno) || empty($cpf_aluno) || empty($data_nascimento) || empty($nome_responsavel) || empty($cpf_responsavel) || empty($telefone_responsavel)) {
    echo json_encode(["status" => "error", "message" => "Por favor, preencha todos os campos obrigatórios."]);
    exit;
}

// Validar CPF do aluno
if (!validarCPF($cpf_aluno)) {
    echo json_encode(["status" => "error", "message" => "CPF do aluno inválido."]);
    exit;
}

// Validar CPF do responsável
if (!validarCPF($cpf_responsavel)) {
    echo json_encode(["status" => "error", "message" => "CPF do responsável inválido."]);
    exit;
}

// Validar data de nascimento
if (!validarData($data_nascimento)) {
    echo json_encode(["status" => "error", "message" => "Data de nascimento inválida."]);
    exit;
}

// Validar email do responsável (se fornecido)
if (!empty($email_responsavel) && !validarEmail($email_responsavel)) {
    echo json_encode(["status" => "error", "message" => "E-mail do responsável inválido."]);
    exit;
}

if (!$pdo) {
    http_response_code(503);
    echo json_encode(["status" => "error", "message" => "Serviço temporariamente indisponível."]);
    exit;
}

try {
    $pdo->beginTransaction();

    // 1. Resolver Endereço (se fornecido)
    $enderecos_id = null;
    if (!empty($endereco)) {
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
        $stmtRespCheck = $pdo->prepare("SELECT id FROM responsaveis WHERE CPF = ?");
        $stmtRespCheck->execute([$cpf_responsavel]);
        $responsavel_id = $stmtRespCheck->fetchColumn();
    }

    if ($responsavel_id) {
        $stmtRespUpdate = $pdo->prepare("UPDATE responsaveis SET nome = ?, telefone = ?, email = ? WHERE id = ?");
        $stmtRespUpdate->execute([$nome_responsavel, $telefone_responsavel, $email_responsavel, $responsavel_id]);
    } else {
        // Responsável deve ter CPF válido — não gerar CPFs fictícios
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
                $stmtTurmaInsert = $pdo->prepare("INSERT INTO turmas (nome, periodo, instituicoes_id) VALUES (?, ?, 1)");
                $stmtTurmaInsert->execute([$turma_nome, $periodo ? $periodo : 'Manhã']);
                $turma_db_id = $pdo->lastInsertId();
            }
        }
    }

    if (!empty($id)) {
        // MODO EDIÇÃO
        $stmtAlunoUpdate = $pdo->prepare("UPDATE alunos SET nome = ?, CPF = ?, data_nascimento = ? WHERE id = ?");
        $stmtAlunoUpdate->execute([$nome_aluno, $cpf_aluno, $data_nascimento, $id]);

        $pdo->prepare("DELETE FROM aluno_responsavel WHERE alunos_id = ?")->execute([$id]);
        $stmtAR = $pdo->prepare("INSERT INTO aluno_responsavel (alunos_id, responsaveis_id, relacao) VALUES (?, ?, ?)");
        $stmtAR->execute([$id, $responsavel_id, $parentesco ? $parentesco : 'Outro']);

        if ($turma_db_id) {
            $pdo->prepare("DELETE FROM aluno_turma WHERE alunos_id = ?")->execute([$id]);
            $stmtAT = $pdo->prepare("INSERT INTO aluno_turma (alunos_id, turmas_id, data_inicio) VALUES (?, ?, ?)");
            $stmtAT->execute([$id, $turma_db_id, date('Y-m-d')]);
        }

        $message = "Aluno atualizado com sucesso!";
    } else {
        // MODO CADASTRO NOVO — Usar random_int para matrícula segura
        $matricula = random_int(1000000, 9999999);
        $tentativas = 0;
        while ($tentativas < 100) {
            $stmtCheck = $pdo->prepare("SELECT COUNT(*) FROM alunos WHERE matricula = ?");
            $stmtCheck->execute([$matricula]);
            if ($stmtCheck->fetchColumn() == 0) {
                break;
            }
            $matricula = random_int(1000000, 9999999);
            $tentativas++;
        }

        $stmtAlunoInsert = $pdo->prepare("INSERT INTO alunos (matricula, nome, CPF, data_nascimento, instituicoes_id, enderecos_id) VALUES (?, ?, ?, ?, 1, ?)");
        $stmtAlunoInsert->execute([$matricula, $nome_aluno, $cpf_aluno, $data_nascimento, $enderecos_id]);
        $aluno_id = $pdo->lastInsertId();

        $stmtAR = $pdo->prepare("INSERT INTO aluno_responsavel (alunos_id, responsaveis_id, relacao) VALUES (?, ?, ?)");
        $stmtAR->execute([$aluno_id, $responsavel_id, $parentesco ? $parentesco : 'Outro']);

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
    tratarErroBanco($e, 'save_aluno');
}
?>
