<?php
session_start();
require_once __DIR__ . '/../conexao.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "Método inválido."]);
    exit;
}

$id = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);
$nome = filter_input(INPUT_POST, 'nome', FILTER_SANITIZE_STRING);
$cpf = filter_input(INPUT_POST, 'cpf', FILTER_SANITIZE_STRING);
$telefone = filter_input(INPUT_POST, 'telefone', FILTER_SANITIZE_STRING);
$email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
$cargo_nome = filter_input(INPUT_POST, 'cargo', FILTER_SANITIZE_STRING);
$status = filter_input(INPUT_POST, 'status', FILTER_SANITIZE_STRING);
$senha = filter_input(INPUT_POST, 'senha', FILTER_DEFAULT);

if (empty($nome) || empty($cpf) || empty($email) || empty($cargo_nome) || empty($status)) {
    echo json_encode(["status" => "error", "message" => "Por favor, preencha todos os campos obrigatórios."]);
    exit;
}

if (!$pdo) {
    echo json_encode(["status" => "warning", "message" => "Banco de dados não conectado. Operação simulada com sucesso!"]);
    exit;
}

try {
    $pdo->beginTransaction();

    $instituicoes_id = 1; // Mundo Encantado (Default)
    $data_nascimento = '1980-01-01'; // Data padrão exigida pelo NOT NULL

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
    echo json_encode(["status" => "error", "message" => "Erro ao salvar funcionário: " . $e->getMessage()]);
}
?>
