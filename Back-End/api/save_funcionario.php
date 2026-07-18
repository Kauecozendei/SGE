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
$cargo_nome = sanitizarEntrada(filter_input(INPUT_POST, 'cargo', FILTER_DEFAULT));
$status = sanitizarEntrada(filter_input(INPUT_POST, 'status', FILTER_DEFAULT));
$senha = filter_input(INPUT_POST, 'senha', FILTER_DEFAULT);

if (empty($nome) || empty($cpf) || empty($email) || empty($cargo_nome) || empty($status)) {
    echo json_encode(["status" => "error", "message" => "Por favor, preencha todos os campos obrigatórios."]);
    exit;
}

// Validações
if (!validarCPF($cpf)) {
    echo json_encode(["status" => "error", "message" => "CPF inválido."]);
    exit;
}

if (!validarEmail($email)) {
    echo json_encode(["status" => "error", "message" => "E-mail inválido."]);
    exit;
}

// Validar senha para novos cadastros
if (empty($id) && !empty($senha) && !validarSenha($senha)) {
    echo json_encode(["status" => "error", "message" => "A senha deve ter no mínimo 8 caracteres, com letras e números."]);
    exit;
}

if (!$pdo) {
    http_response_code(503);
    echo json_encode(["status" => "error", "message" => "Serviço temporariamente indisponível."]);
    exit;
}

try {
    $pdo->beginTransaction();

    $instituicoes_id = 1;
    $data_nascimento = '1980-01-01';

    // Encontrar ou criar o cargo
    $cargo_nome_clean = trim($cargo_nome);
    $stmtCargo = $pdo->prepare("SELECT id FROM cargos WHERE LOWER(nome) = LOWER(?) LIMIT 1");
    $stmtCargo->execute([$cargo_nome_clean]);
    $cargoData = $stmtCargo->fetch(PDO::FETCH_ASSOC);

    if ($cargoData) {
        $cargos_id = $cargoData['id'];
    } else {
        $stmtNewCargo = $pdo->prepare("INSERT INTO cargos (nome) VALUES (?)");
        $stmtNewCargo->execute([$cargo_nome_clean]);
        $cargos_id = $pdo->lastInsertId();
    }

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
                    SET nome = ?, CPF = ?, telefone = ?, email = ?, status = ?, cargos_id = ?, senha_hash = ?
                    WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$nome, $cpf, $telefone, $email, $status, $cargos_id, $senhaHash, $id]);
        } else {
            $sql = "UPDATE funcionarios 
                    SET nome = ?, CPF = ?, telefone = ?, email = ?, status = ?, cargos_id = ?
                    WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$nome, $cpf, $telefone, $email, $status, $cargos_id, $id]);
        }

        $message = "Funcionário atualizado com sucesso!";
    } else {
        // MODO CADASTRO NOVO
        if (empty($senha)) {
            $pdo->rollBack();
            echo json_encode(["status" => "error", "message" => "A senha é obrigatória para novos cadastros."]);
            exit;
        }

        $senhaHash = password_hash($senha, PASSWORD_DEFAULT);
        $sql = "INSERT INTO funcionarios (nome, CPF, data_nascimento, cargos_id, instituicoes_id, telefone, email, senha_hash, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$nome, $cpf, $data_nascimento, $cargos_id, $instituicoes_id, $telefone, $email, $senhaHash, $status]);

        $message = "Funcionário cadastrado com sucesso!";
    }

    $pdo->commit();
    echo json_encode(["status" => "success", "message" => $message]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    tratarErroBanco($e, 'save_funcionario');
}
?>
