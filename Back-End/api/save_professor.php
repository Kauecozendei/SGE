<?php
session_start();
require_once __DIR__ . '/../conexao.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "Método inválido."]);
    exit;
}

$id = filter_input(INPUT_POST, 'id', FILTER_SANITIZE_NUMBER_INT);
$nome = filter_input(INPUT_POST, 'nome', FILTER_SANITIZE_STRING);
$cpf = filter_input(INPUT_POST, 'cpf', FILTER_SANITIZE_STRING);
$telefone = filter_input(INPUT_POST, 'telefone', FILTER_SANITIZE_STRING);
$email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
$formacao = filter_input(INPUT_POST, 'formacao', FILTER_SANITIZE_STRING);
$status = filter_input(INPUT_POST, 'status', FILTER_SANITIZE_STRING);
$disciplinas = filter_input(INPUT_POST, 'disciplinas', FILTER_SANITIZE_STRING);
$senha = filter_input(INPUT_POST, 'senha', FILTER_DEFAULT);

if (empty($nome) || empty($cpf) || empty($email) || empty($status)) {
    echo json_encode(["status" => "error", "message" => "Por favor, preencha todos os campos obrigatórios."]);
    exit;
}

if (!$pdo) {
    echo json_encode(["status" => "warning", "message" => "Banco de dados não conectado. Operação simulada com sucesso!"]);
    exit;
}

try {
    $pdo->beginTransaction();

    $cargos_id = 1; // Professor
    $instituicoes_id = 1; // Mundo Encantado
    $data_nascimento = '1980-01-01'; // Data padrão

    if (!empty($id)) {
        // MODO EDIÇÃO
        if (!empty($senha)) {
            $senhaHash = password_hash($senha, PASSWORD_DEFAULT);
            $sql = "UPDATE funcionarios 
                    SET nome = ?, CPF = ?, telefone = ?, email = ?, status = ?, formacao = ?, disciplinas_estatico = ?, senha_hash = ?
                    WHERE id = ? AND cargos_id = 1";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$nome, $cpf, $telefone, $email, $status, $formacao, $disciplinas, $senhaHash, $id]);
        } else {
            $sql = "UPDATE funcionarios 
                    SET nome = ?, CPF = ?, telefone = ?, email = ?, status = ?, formacao = ?, disciplinas_estatico = ?
                    WHERE id = ? AND cargos_id = 1";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$nome, $cpf, $telefone, $email, $status, $formacao, $disciplinas, $id]);
        }

        $professor_id = $id;
        $message = "Professor atualizado com sucesso!";
    } else {
        // MODO CADASTRO NOVO
        if (empty($senha)) {
            echo json_encode(["status" => "error", "message" => "A senha é obrigatória para novos cadastros."]);
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

    // Processar e relacionar disciplinas no banco de dados para consistência relacional
    if ($professor_id) {
        // Limpa relações anteriores do professor se for edição
        $pdo->prepare("DELETE FROM professor_turma_disciplina WHERE professores_id = ?")->execute([$professor_id]);
        $pdo->prepare("DELETE FROM professor_turma WHERE professores_id = ?")->execute([$professor_id]);

        // Vincula a uma turma padrão (ID 1 - Maternal A) para que o professor tenha pelo menos uma turma associada
        $pdo->prepare("INSERT IGNORE INTO professor_turma (professores_id, turmas_id) VALUES (?, 1)")->execute([$professor_id]);

        if (!empty($disciplinas)) {
            $array_disciplinas = array_map('trim', explode(',', $disciplinas));
            foreach ($array_disciplinas as $disc_nome) {
                if (empty($disc_nome)) continue;

                // Tenta encontrar a disciplina no banco
                $stmtCheckDisc = $pdo->prepare("SELECT id FROM disciplinas WHERE nome = ? LIMIT 1");
                $stmtCheckDisc->execute([$disc_nome]);
                $disc_id = $stmtCheckDisc->fetchColumn();

                if (!$disc_id) {
                    // Se não existir, cria a disciplina
                    $stmtInsertDisc = $pdo->prepare("INSERT INTO disciplinas (nome, instituicoes_id) VALUES (?, 1)");
                    $stmtInsertDisc->execute([$disc_nome]);
                    $disc_id = $pdo->lastInsertId();
                }

                // Relaciona o professor, a turma padrão (ID 1) e a disciplina
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
    echo json_encode(["status" => "error", "message" => "Erro ao salvar professor: " . $e->getMessage()]);
}
?>
