<?php
session_start();
require_once 'conexao.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $tabela = filter_input(INPUT_POST, 'tabela', FILTER_SANITIZE_STRING);
    $id = filter_input(INPUT_POST, 'id', FILTER_SANITIZE_NUMBER_INT);

    if (empty($tabela) || empty($id)) {
        echo json_encode(["status" => "error", "message" => "Tabela ou ID não fornecido."]);
        exit;
    }

    if ($pdo) {
        try {
            $pdo->beginTransaction();

            if ($tabela === 'alunos') {
                $nome = filter_input(INPUT_POST, 'nome_aluno', FILTER_SANITIZE_STRING);
                $cpf = filter_input(INPUT_POST, 'cpf_aluno', FILTER_SANITIZE_STRING);
                $data_nascimento = filter_input(INPUT_POST, 'data_nasc_aluno', FILTER_SANITIZE_STRING);
                
                $sql = "UPDATE alunos SET nome=:nome, CPF=:cpf, data_nascimento=:nasc WHERE id=:id";
                $pdo->prepare($sql)->execute([':nome'=>$nome, ':cpf'=>$cpf, ':nasc'=>$data_nascimento, ':id'=>$id]);
                
                // Nota: Relacionamentos (Responsáveis/Turma) poderiam ser atualizados aqui numa implementação avançada
                
            } else if ($tabela === 'funcionarios') {
                $nome = filter_input(INPUT_POST, 'nome', FILTER_SANITIZE_STRING);
                $cpf = filter_input(INPUT_POST, 'cpf', FILTER_SANITIZE_STRING);
                $telefone = filter_input(INPUT_POST, 'telefone', FILTER_SANITIZE_STRING);
                $email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
                
                $sql = "UPDATE funcionarios SET nome=:nome, CPF=:cpf, telefone=:telefone, email=:email WHERE id=:id";
                $pdo->prepare($sql)->execute([':nome'=>$nome, ':cpf'=>$cpf, ':telefone'=>$telefone, ':email'=>$email, ':id'=>$id]);
                
            } else if ($tabela === 'turmas') {
                $nome = filter_input(INPUT_POST, 'nome_turma', FILTER_SANITIZE_STRING);
                $periodo = filter_input(INPUT_POST, 'periodo', FILTER_SANITIZE_STRING);
                
                $sql = "UPDATE turmas SET nome=:nome, periodo=:periodo WHERE id=:id";
                $pdo->prepare($sql)->execute([':nome'=>$nome, ':periodo'=>$periodo, ':id'=>$id]);
            }

            $pdo->commit();
            echo json_encode(["status" => "success", "message" => "Registro atualizado com sucesso!"]);
        } catch (PDOException $e) {
            $pdo->rollBack();
            echo json_encode(["status" => "error", "message" => "Erro ao atualizar registro.", "error" => $e->getMessage()]);
        }
    } else {
        echo json_encode(["status" => "warning", "message" => "Simulação: Banco desconectado."]);
    }
}
?>
