<?php
require_once '../conexao.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    $nome = filter_input(INPUT_POST, 'nome', FILTER_SANITIZE_STRING);
    $cpf = filter_input(INPUT_POST, 'cpf', FILTER_SANITIZE_STRING);
    $data_nascimento = filter_input(INPUT_POST, 'data_nascimento', FILTER_SANITIZE_STRING);
    $cargo_nome = filter_input(INPUT_POST, 'cargo', FILTER_SANITIZE_STRING); // Nome do cargo vindo do front
    $telefone = filter_input(INPUT_POST, 'telefone', FILTER_SANITIZE_STRING);
    $email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
    
    $instituicoes_id = 1; // Default
    
    // Default password to be hashed
    $senha_default = password_hash('123456', PASSWORD_DEFAULT);

    if (empty($nome) || empty($cpf) || empty($cargo_nome)) {
        echo json_encode(["status" => "error", "message" => "Preencha os campos obrigatórios."]);
        exit;
    }

    if ($pdo) {
        try {
            $pdo->beginTransaction();

            // Encontrar ou criar o cargo
            $stmtCargo = $pdo->prepare("SELECT id FROM cargos WHERE nome = :nome LIMIT 1");
            $stmtCargo->execute([':nome' => $cargo_nome]);
            $cargoData = $stmtCargo->fetch(PDO::FETCH_ASSOC);
            
            if ($cargoData) {
                $cargos_id = $cargoData['id'];
            } else {
                $stmtNewCargo = $pdo->prepare("INSERT INTO cargos (nome) VALUES (:nome)");
                $stmtNewCargo->execute([':nome' => $cargo_nome]);
                $cargos_id = $pdo->lastInsertId();
            }

            // Insert Funcionario
            $sqlFunc = "INSERT INTO funcionarios (nome, CPF, data_nascimento, cargos_id, instituicoes_id, telefone, email, senha_hash) 
                         VALUES (:nome, :cpf, :nasc, :cargos_id, :inst, :telefone, :email, :senha)";
            $stmtFunc = $pdo->prepare($sqlFunc);
            $stmtFunc->execute([
                ':nome' => $nome,
                ':cpf' => $cpf,
                ':nasc' => $data_nascimento,
                ':cargos_id' => $cargos_id,
                ':inst' => $instituicoes_id,
                ':telefone' => $telefone,
                ':email' => $email,
                ':senha' => $senha_default
            ]);

            $pdo->commit();
            echo json_encode(["status" => "success", "message" => "Funcionário cadastrado com sucesso!"]);
        } catch (PDOException $e) {
            $pdo->rollBack();
            echo json_encode(["status" => "error", "message" => "Erro ao salvar funcionário.", "error" => $e->getMessage()]);
        }
    } else {
        echo json_encode(["status" => "warning", "message" => "Simulação: Banco desconectado."]);
    }
}
?>
