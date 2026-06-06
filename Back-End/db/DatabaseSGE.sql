#CRIAÇÃO DA TABELA DE ENDEREÇOS
CREATE TABLE IF NOT EXISTS enderecos (
	id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
	rua varchar(100) NOT NULL,
	numero varchar(10),
	bairro varchar(20),
	cidade varchar(20) NOT NULL,
	UF varchar(2) NOT NULL,
	CEP varchar(9)
)ENGINE=InnoDB;

#CRIAÇÃO DA TABELA DE INSTITUIÇÕES
CREATE TABLE IF NOT EXISTS instituicoes (
	id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
	nome varchar(100) NOT NULL,
	cnpj varchar(18) NOT NULL UNIQUE,
	enderecos_id int,
		CONSTRAINT fk_enderecos
			FOREIGN KEY (enderecos_id) REFERENCES enderecos(id),
	sobre varchar(1000),
	data_fundacao date
)ENGINE=InnoDB;

#CRIAÇÃO DA TABELA DE ALUNOS
CREATE TABLE IF NOT EXISTS alunos (
	id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
	matricula int NOT NULL UNIQUE,
	nome varchar(100) NOT NULL,
	CPF varchar(14) UNIQUE,
	enderecos_id int,
	data_nascimento date NOT NULL,
	url_foto varchar(100),
	instituicoes_id int NOT NULL,
	integral bool DEFAULT FALSE,
	pacote_alimentacao bool DEFAULT FALSE,
		CONSTRAINT fk_enderecos
			FOREIGN KEY (enderecos_id) REFERENCES enderecos(id),
		CONSTRAINT fk_instituicoes
			FOREIGN KEY (instituicoes_id) REFERENCES instituicoes(id)
)ENGINE=InnoDB;

#CRIAÇÃO DA TABELA DE CARGOS
CREATE TABLE IF NOT EXISTS cargos (
	id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
	nome varchar(20) NOT NULL
)ENGINE=InnoDB;


#CRIAÇÃO DA TABELA DE RESPONSÁVEIS
CREATE TABLE IF NOT EXISTS responsaveis (
	id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
	nome varchar(100) NOT NULL,
	CPF varchar(14) NOT NULL UNIQUE,
	telefone varchar(20) NOT NULL,
	enderecos_id int,
	data_nascimento date NOT NULL,
	email varchar(50),
	url_foto varchar(100),
		CONSTRAINT fk_enderecos
			FOREIGN KEY (enderecos_id) REFERENCES enderecos(id)
)ENGINE=InnoDB;

#CRIAÇÃO DA TABELA DE TURMAS
CREATE TABLE IF NOT EXISTS turmas(
	id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
	nome varchar(20) NOT NULL,
	periodo varchar(20) NOT NULL,
	instituicoes_id int NOT NULL,
	serie varchar(50) DEFAULT NULL,
	sala varchar(50) DEFAULT NULL,
	capacidade int DEFAULT 25,
	horario varchar(100) DEFAULT NULL,
		CONSTRAINT fk_instituicoes
			FOREIGN KEY (instituicoes_id) REFERENCES instituicoes(id)
)ENGINE=InnoDB;

#CRIAÇÃO DA TABELA DE DISCIPLINAS
CREATE TABLE IF NOT EXISTS disciplinas (
	id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
	nome varchar(50) NOT NULL,
	instituicoes_id int NOT NULL,
		CONSTRAINT fk_instituicoes
			FOREIGN KEY (instituicoes_id) REFERENCES instituicoes(id)
)ENGINE=InnoDB;

#CRIAÇÃO DA TABELA DE FUNCIONÁRIOS
CREATE TABLE IF NOT EXISTS funcionarios (
	id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
	nome varchar(100) NOT NULL,
	CPF varchar(14) NOT NULL UNIQUE,
	data_nascimento date NOT NULL,
	cargos_id int NOT NULL,
	instituicoes_id int NOT NULL,
	telefone varchar(20) NOT NULL,
	enderecos_id int,
	url_foto varchar(100),
	email varchar(50) NOT NULL,
	senha_hash varchar(255) NOT NULL,
	status varchar(20) DEFAULT 'ativo',
	formacao varchar(255) DEFAULT NULL,
	disciplinas_estatico varchar(255) DEFAULT NULL,
		CONSTRAINT fk_enderecos
				FOREIGN KEY (enderecos_id) REFERENCES enderecos(id),
		CONSTRAINT fk_instituicoes
			FOREIGN KEY (instituicoes_id) REFERENCES instituicoes(id),
		CONSTRAINT fk_cargos
			FOREIGN KEY (cargos_id) REFERENCES cargos(id)
)ENGINE=InnoDB;

#CRIAÇÃO DA TABELA DE RESTRIÇÕES ALIMENTARES
CREATE TABLE IF NOT EXISTS restricoes_alimentares(
	id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
	alunos_id int NOT NULL,
	descricao varchar(1000),
		CONSTRAINT fk_alunos
			FOREIGN KEY (alunos_id) REFERENCES alunos(id)
			ON DELETE CASCADE
)ENGINE=InnoDB;

#CRIAÇÃO DA TABELA DE HORÁRIOS
CREATE TABLE IF NOT EXISTS horarios(
	id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
	alunos_id int NOT NULL,
	data date NOT NULL,
	horario time NOT NULL,
	tipo varchar(20) NOT NULL,
		CONSTRAINT chk_tipo
        	CHECK (tipo IN ('entrada', 'saida')),
	observacao varchar(500),
	funcionarios_id int NOT NULL,
		CONSTRAINT fk_alunos
			FOREIGN KEY (alunos_id) REFERENCES alunos(id)
			ON DELETE CASCADE,
		CONSTRAINT fk_funcionarios
			FOREIGN KEY (funcionarios_id) REFERENCES funcionarios(id)
)ENGINE=InnoDB;

#CRIAÇÃO DA TABELA DE ALIMENTACAO
CREATE TABLE IF NOT EXISTS alimentacao(
	id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
	alunos_id int NOT NULL,
	data date NOT NULL,
	alimentou bool DEFAULT FALSE,
	tipo_refeicao varchar(50) NOT NULL,
	observacao varchar(500),
	funcionarios_id int NOT NULL,
		CONSTRAINT fk_alunos
			FOREIGN KEY (alunos_id) REFERENCES alunos(id)
			ON DELETE CASCADE,
		CONSTRAINT fk_funcionarios
			FOREIGN KEY (funcionarios_id) REFERENCES funcionarios(id)
)ENGINE=InnoDB;


#CRIAÇÃO DA TABELA DE BANHOS
CREATE TABLE IF NOT EXISTS banhos(
	id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
	alunos_id int NOT NULL,
	data date NOT NULL,
	realizou bool DEFAULT FALSE,
	observacao varchar(500),
	funcionarios_id int NOT NULL,
		CONSTRAINT fk_alunos
			FOREIGN KEY (alunos_id) REFERENCES alunos(id)
			ON DELETE CASCADE,
		CONSTRAINT fk_funcionarios
			FOREIGN KEY (funcionarios_id) REFERENCES funcionarios(id)
)ENGINE=InnoDB;

#CRIAÇÃO DA TABELA RELACIONAL ENTRE O ALUNO E A TURMA
CREATE TABLE IF NOT EXISTS aluno_turma(
	id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
	alunos_id int NOT NULL,
	turmas_id int NOT NULL,
	data_inicio date NOT NULL,
	data_fim date,
		CONSTRAINT fk_alunos
			FOREIGN KEY (alunos_id) REFERENCES alunos(id)
			ON DELETE CASCADE,
		CONSTRAINT fk_turmas
			FOREIGN KEY (turmas_id) REFERENCES turmas(id)
			ON DELETE CASCADE,
		CONSTRAINT uk_alunos_inicio
			UNIQUE(alunos_id, data_inicio)
)ENGINE=InnoDB;

#CRIAÇÃO DA TABELA RELACIONAL ENTRE O ALUNO E O RESPONSÁVEL
CREATE TABLE IF NOT EXISTS aluno_responsavel(
	id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
	alunos_id int NOT NULL,
	responsaveis_id int NOT NULL,
	relacao varchar(50) NOT NULL,
		CONSTRAINT fk_alunos
			FOREIGN KEY (alunos_id) REFERENCES alunos(id)
			ON DELETE CASCADE,
		CONSTRAINT fk_responsaveis
			FOREIGN KEY (responsaveis_id) REFERENCES responsaveis(id)
			ON DELETE CASCADE,
		CONSTRAINT uk_alunos_responsaveis
			UNIQUE(alunos_id, responsaveis_id)
)ENGINE=InnoDB;

#CRIAÇÃO DA TABELA RELACIONAL ENTRE O PROFESSOR E A TURMA
CREATE TABLE IF NOT EXISTS professor_turma(
	id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
	professores_id int NOT NULL,
	turmas_id int NOT NULL,
		CONSTRAINT fk_professor
			FOREIGN KEY (professores_id) REFERENCES funcionarios(id)
			ON DELETE CASCADE,
		CONSTRAINT fk_turmas
			FOREIGN KEY (turmas_id) REFERENCES turmas(id)
			ON DELETE CASCADE,
		CONSTRAINT uk_professor_turma
			UNIQUE (professores_id, turmas_id)
)ENGINE=InnoDB;

#CRIAÇÃO DA TABELA RELACIONAL ENTRE O PROFESSOR, A TURMA E A DISCIPLINA
CREATE TABLE IF NOT EXISTS professor_turma_disciplina(
	id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
	professores_id int NOT NULL,
	turmas_id int NOT NULL,
	disciplinas_id int NOT NULL,
		CONSTRAINT fk_professor
			FOREIGN KEY (professores_id) REFERENCES funcionarios(id)
			ON DELETE CASCADE,
		CONSTRAINT fk_turmas
			FOREIGN KEY (turmas_id) REFERENCES turmas(id)
			ON DELETE CASCADE,
		CONSTRAINT fk_disciplinas
			FOREIGN KEY (disciplinas_id) REFERENCES disciplinas(id)
			ON DELETE CASCADE,
		CONSTRAINT uk_professor_turma_disciplina
			UNIQUE (professores_id, turmas_id, disciplinas_id)
)ENGINE=InnoDB;

#CRIAÇÃO DA TABELA DE ALTERAÇÃO DE REGISTROS
CREATE TABLE IF NOT EXISTS log_registros(
	id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
	tabela_nome varchar(50) NOT NULL,
	registros_id int NOT NULL, 
	funcionarios_id int NOT NULL,
	data_alteracao date NOT NULL,
	tipo_alteracao varchar(20) NOT NULL,
		CONSTRAINT chk_tipo_alteracao
        	CHECK (tipo_alteracao IN ('insercao', 'remocao', 'atualizacao')),
	valor_antigo varchar(1000),
	valor_novo varchar(1000),
	descricao varchar(1000),
		CONSTRAINT fk_funcionarios
			FOREIGN KEY (funcionarios_id) REFERENCES funcionarios(id)
)ENGINE=InnoDB;


#CRIAÇÃO TABELA ADMIN
CREATE TABLE IF NOT EXISTS admin(
	id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
	nome varchar(100) NOT NULL,
	email varchar(50) NOT NULL,
	senha_hash varchar(255) NOT NULL
)ENGINE=InnoDB;

#CRIAÇÃO DA TABELA FINANCEIRO
CREATE TABLE IF NOT EXISTS financeiro (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    alunos_id INT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    data_vencimento DATE NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pendente',
    observacao VARCHAR(500),
    data_pagamento DATE DEFAULT NULL,
    CONSTRAINT fk_financeiro_alunos FOREIGN KEY (alunos_id) REFERENCES alunos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

#CRIAÇÃO DA TABELA AGENDA
CREATE TABLE IF NOT EXISTS agenda (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(100) NOT NULL,
    data DATE NOT NULL,
    hora TIME DEFAULT NULL,
    tipo VARCHAR(50) NOT NULL,
    descricao VARCHAR(500)
) ENGINE=InnoDB;