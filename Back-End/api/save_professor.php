<?php
require_once __DIR__ . '/../auth_guard.php';
require_once __DIR__ . '/../conexao.php';

verificarAutenticacao();
validarCSRF();

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Método inválido."]);
    exit;
}

$id = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);
$nome = sanitizarEntrada(filter_input(INPUT_POST, 'nome', FILTER_DEFAULT));
$cpf = sanitizarEntrada(filter_input(INPUT_POST, 'cpf', FILTER_DEFAULT));
$telefone = sanitizarEntrada(filter_input(INPUT_POST, 'telefone', FILTER_DEFAULT));
$email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
$formacao = sanitizarEntrada(filter_input(INPUT_POST, 'formacao', FILTER_DEFAULT));
$status = sanitizarEntrada(filter_input(INPUT_POST, 'status', FILTER_DEFAULT));
$disciplinas = sanitizarEntrada(filter_input(INPUT_POST, 'disciplinas', FILTER_DEFAULT));
$senha = filter_input(INPUT_POST, 'senha', FILTER_DEFAULT);

if (empty($nome) || empty($cpf) || empty($email) || empty($status)) {
    echo json_encode(["status" => "error", "message" => "Por favor, preencha todos os campos obrigatórios."]);
    exit;
}

if (!validarCPF($cpf)) {
    echo json_encode(["status" => "error", "message" => "CPF inválido."]);
    exit;
}

if (!validarEmail($email)) {
    echo json_encode(["status" => "error", "message" => "E-mail inválido."]);
    exit;
}

if (!$pdo) {
    http_response_code(503);
    echo json_encode(["status" => "error", "message" => "Serviço temporariamente indisponível."]);
    exit;
}

try {
    $pdo->beginTransaction();

    // Encontrar ou criar o cargo 'Professor'
    $stmtCargo = $pdo->prepare("SELECT id FROM cargos WHERE LOWER(nome) = 'professor' LIMIT 1");
    $stmtCargo->execute();
    $cargoData = $stmtCargo->fetch(PDO::FETCH_ASSOC);

    if ($cargoData) {
        $cargos_id = $cargoData['id'];
    } else {
        $stmtNewCargo = $pdo->prepare("INSERT INTO cargos (nome) VALUES ('Professor')");
        $stmtNewCargo->execute();
        $cargos_id = $pdo->lastInsertId();
    }

    $instituicoes_id = 1;
    $data_nascimento = '1980-01-01';

    if (!empty($id)) {
        // MODO EDIÇÃO
        if (!empty($senha)) {
            if (!validarSenha($senha)) {
                $pdo->rollBack();
                echo json_encode(["status" => "error", "message" => "A senha deve ter no mínimo 8 caracteres, com letras e números."]);
                exit;
            }
            $senhaHash = password_hash($senha, PASSWORD_DEFAULT);
            $sql = "UPDATE funcionarios 
                    SET nome = ?, CPF = ?, telefone = ?, email = ?, status = ?, formacao = ?, disciplinas_estatico = ?, senha_hash = ?
                    WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$nome, $cpf, $telefone, $email, $status, $formacao, $disciplinas, $senhaHash, $id]);
        } else {
            $sql = "UPDATE funcionarios 
                    SET nome = ?, CPF = ?, telefone = ?, email = ?, status = ?, formacao = ?, disciplinas_estatico = ?
                    WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$nome, $cpf, $telefone, $email, $status, $formacao, $disciplinas, $id]);
        }

        $professor_id = $id;
        $message = "Professor atualizado com sucesso!";
    } else {
        // MODO CADASTRO NOVO
        if (empty($senha)) {
            $pdo->rollBack();
            echo json_encode(["status" => "error", "message" => "A senha é obrigatória para novos cadastros."]);
            exit;
        }

        if (!validarSenha($senha)) {
            $pdo->rollBack();
            echo json_encode(["status" => "error", "message" => "A senha deve ter no mínimo 8 caracteres, com letras e números."]);
            exit;
        }

        $senhaHash = password_hash($senha, PASSWORD_DEFAULT);
        $sql = "INSERT INTO funcionarios (nome, CPF, data_nascimento, cargos_id, instituicoes_id, telefone, email, senha_hash, status, formacao, disciplinas_estatico) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$nome, $cpf, $data_nascimento, $cargos_id, $instituicoes_id, $telefone, $email, $senhaHash, $status, $formacao, $disciplinas]);
        $professor_id = $pdo->lastInsertId();

        $message = "Professor cadastrado com sucesso!";
    }

    // Processar disciplinas
    if ($professor_id) {
        $pdo->prepare("DELETE FROM professor_turma_disciplina WHERE professores_id = ?")->execute([$professor_id]);
        $pdo->prepare("DELETE FROM professor_turma WHERE professores_id = ?")->execute([$professor_id]);
        $pdo->prepare("INSERT IGNORE INTO professor_turma (professores_id, turmas_id) VALUES (?, 1)")->execute([$professor_id]);

        if (!empty($disciplinas)) {
            $array_disciplinas = array_map('trim', explode(',', $disciplinas));
            foreach ($array_disciplinas as $disc_nome) {
                if (empty($disc_nome)) continue;

                $stmtCheckDisc = $pdo->prepare("SELECT id FROM disciplinas WHERE nome = ? LIMIT 1");
                $stmtCheckDisc->execute([$disc_nome]);
                $disc_id = $stmtCheckDisc->fetchColumn();

                if (!$disc_id) {
                    $stmtInsertDisc = $pdo->prepare("INSERT INTO disciplinas (nome, instituicoes_id) VALUES (?, 1)");
                    $stmtInsertDisc->execute([$disc_nome]);
                    $disc_id = $pdo->lastInsertId();
                }

                $pdo->prepare("INSERT IGNORE INTO professor_turma_disciplina (professores_id, turmas_id, disciplinas_id) VALUES (?, 1, ?)")
                    ->execute([$professor_id, $disc_id]);
            }
        }
    }

    $pdo->commit();
    echo json_encode(["status" => "success", "message" => $message]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    tratarErroBanco($e, 'save_professor');
}
?>
