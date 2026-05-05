<?php
// Inicia a sessão
session_start();

// Inclui a conexão com o banco de dados
require_once 'conexao.php';

// Verifica se a requisição é do tipo POST
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    // Recebe o email. A senha não deve ser sanitizada para não quebrar caracteres especiais permitidos
    $email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
    $senha = filter_input(INPUT_POST, 'senha', FILTER_DEFAULT);

    if (empty($email) || empty($senha)) {
        $response = ["status" => "error", "message" => "E-mail ou senha inválidos. Tente novamente."];
    } else {
        if ($pdo) {
            try {
                // Busca o funcionário pelo email
                $sql = "SELECT id, nome, email, senha_hash FROM funcionarios WHERE email = :email LIMIT 1";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([':email' => $email]);
                
                $funcionario = $stmt->fetch(PDO::FETCH_ASSOC);

                // Verifica se o funcionário existe e se a senha está correta
                if ($funcionario && password_verify($senha, $funcionario['senha_hash'])) {
                    
                    // Sucesso no login, salva os dados na sessão
                    $_SESSION['usuario_id'] = $funcionario['id'];
                    $_SESSION['usuario_nome'] = $funcionario['nome'];
                    $_SESSION['usuario_email'] = $funcionario['email'];
                    $_SESSION['tipo_usuario'] = 'funcionario';

                    $response = ["status" => "success", "message" => "Login realizado com sucesso!"];
                } else {
                    // Falha no login (senha incorreta ou usuário não encontrado)
                    $response = ["status" => "error", "message" => "E-mail ou senha inválidos. Tente novamente."];
                }
            } catch (PDOException $e) {
                // Erro no banco de dados
                $response = ["status" => "error", "message" => "Erro de servidor. Tente novamente mais tarde."];
            }
        } else {
            // Caso o banco não esteja conectado, simula um login para testes (HARDCODED)
            if ($email === 'teste@gmail.com' && $senha === '123456') {
                $_SESSION['usuario_nome'] = 'Usuário Teste';
                $response = ["status" => "success", "message" => "Login simulado com sucesso (Sem Banco)!"];
            } else {
                $response = ["status" => "error", "message" => "E-mail ou senha inválidos. Tente novamente. (Simulação)"];
            }
        }
    }

    // Retorna a resposta em JSON para o Front-End
    header('Content-Type: application/json');
    echo json_encode($response);
    exit;
}
?>
