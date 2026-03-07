-- ============================================================
-- AgendaFácil — Schema PostgreSQL 17
-- Execute com: psql -U postgres -f schema.sql
-- ============================================================

-- Criar banco se não existir (execute separado se necessário):
-- CREATE DATABASE agendafacil;

\c agendafacil;

-- ============================================================
-- EXTENSÕES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABELA: clinicas (multi-tenant — cada cliente é uma clínica)
-- ============================================================
CREATE TABLE IF NOT EXISTS clinicas (
    id            SERIAL PRIMARY KEY,
    nome          VARCHAR(200) NOT NULL,
    slug          VARCHAR(100) UNIQUE, -- usado na URL pública: /agendar/minha-clinica
    email         VARCHAR(200) NOT NULL UNIQUE,
    senha_hash    TEXT NOT NULL,
    cnpj          VARCHAR(20),
    telefone      VARCHAR(20),
    endereco      TEXT,
    logo_url      TEXT,
    cor_primaria  VARCHAR(7) DEFAULT '#3b82f6',
    plano         VARCHAR(30) DEFAULT 'basico' CHECK (plano IN ('basico', 'profissional', 'clinica')),
    ativo         BOOLEAN DEFAULT TRUE,
    criado_em     TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: profissionais
-- ============================================================
CREATE TABLE IF NOT EXISTS profissionais (
    id               SERIAL PRIMARY KEY,
    clinica_id       INTEGER NOT NULL REFERENCES clinicas(id) ON DELETE CASCADE,
    nome             VARCHAR(200) NOT NULL,
    especialidade    VARCHAR(200),
    cor              VARCHAR(10) DEFAULT '3b82f6',
    horario_inicio   TIME DEFAULT '08:00',
    horario_fim      TIME DEFAULT '18:00',
    duracao_consulta INTEGER DEFAULT 60, -- em minutos
    ativo            BOOLEAN DEFAULT TRUE,
    criado_em        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profissionais_clinica ON profissionais(clinica_id);

-- ============================================================
-- TABELA: pacientes
-- ============================================================
CREATE TABLE IF NOT EXISTS pacientes (
    id         SERIAL PRIMARY KEY,
    clinica_id INTEGER NOT NULL REFERENCES clinicas(id) ON DELETE CASCADE,
    nome       VARCHAR(200) NOT NULL,
    telefone   VARCHAR(20),
    email      VARCHAR(200),
    cpf        VARCHAR(14),
    nascimento DATE,
    endereco   TEXT,
    observacoes TEXT,
    criado_em  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pacientes_clinica  ON pacientes(clinica_id);
CREATE INDEX IF NOT EXISTS idx_pacientes_telefone ON pacientes(clinica_id, telefone);

-- ============================================================
-- TABELA: agendamentos
-- ============================================================
CREATE TABLE IF NOT EXISTS agendamentos (
    id              SERIAL PRIMARY KEY,
    clinica_id      INTEGER NOT NULL REFERENCES clinicas(id) ON DELETE CASCADE,
    profissional_id INTEGER REFERENCES profissionais(id) ON DELETE SET NULL,
    paciente_id     INTEGER REFERENCES pacientes(id) ON DELETE SET NULL,
    data            DATE NOT NULL,
    horario         TIME NOT NULL,
    tipo            VARCHAR(60) DEFAULT 'Consulta',
    status          VARCHAR(30) DEFAULT 'pendente'
                        CHECK (status IN ('pendente', 'confirmado', 'cancelado', 'concluido')),
    observacoes     TEXT,
    criado_em       TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agendamentos_clinica  ON agendamentos(clinica_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data     ON agendamentos(clinica_id, data);
CREATE INDEX IF NOT EXISTS idx_agendamentos_prof     ON agendamentos(profissional_id, data);

-- ============================================================
-- TABELA: prontuarios
-- ============================================================
CREATE TABLE IF NOT EXISTS prontuarios (
    id              SERIAL PRIMARY KEY,
    clinica_id      INTEGER NOT NULL REFERENCES clinicas(id) ON DELETE CASCADE,
    paciente_id     INTEGER REFERENCES pacientes(id) ON DELETE SET NULL,
    agendamento_id  INTEGER REFERENCES agendamentos(id) ON DELETE SET NULL,
    queixa          TEXT,
    dados_json      JSONB DEFAULT '{}',  -- todos os campos do prontuário
    criado_em       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prontuarios_clinica  ON prontuarios(clinica_id);
CREATE INDEX IF NOT EXISTS idx_prontuarios_paciente ON prontuarios(paciente_id);

-- ============================================================
-- TABELA: financeiro
-- ============================================================
CREATE TABLE IF NOT EXISTS financeiro (
    id               SERIAL PRIMARY KEY,
    clinica_id       INTEGER NOT NULL REFERENCES clinicas(id) ON DELETE CASCADE,
    agendamento_id   INTEGER REFERENCES agendamentos(id) ON DELETE SET NULL,
    paciente_id      INTEGER REFERENCES pacientes(id) ON DELETE SET NULL,
    descricao        VARCHAR(200),
    valor            NUMERIC(10, 2) DEFAULT 0,
    forma_pagamento  VARCHAR(30) DEFAULT 'dinheiro'
                        CHECK (forma_pagamento IN ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'convenio')),
    status_pagamento VARCHAR(20) DEFAULT 'pendente'
                        CHECK (status_pagamento IN ('pendente', 'pago', 'cancelado')),
    data_pagamento   DATE,
    criado_em        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financeiro_clinica ON financeiro(clinica_id);
CREATE INDEX IF NOT EXISTS idx_financeiro_data    ON financeiro(clinica_id, criado_em);

-- ============================================================
-- FUNÇÃO: atualizar timestamp automaticamente
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_clinicas_updated
    BEFORE UPDATE ON clinicas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_agendamentos_updated
    BEFORE UPDATE ON agendamentos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- DADOS INICIAIS DE EXEMPLO (opcional — comente se não quiser)
-- ============================================================
-- Senha: Admin@123 (bcrypt hash, altere no primeiro login!)
-- Para gerar um hash real: node -e "const b=require('bcryptjs');console.log(b.hashSync('Admin@123',10))"
-- INSERT INTO clinicas (nome, slug, email, senha_hash, telefone)
-- VALUES ('Clínica Demo', 'clinica-demo', 'admin@demo.com.br',
--         '$2a$10$HASH_GERADO_AQUI', '(11) 99999-0000');

-- ============================================================
-- VERIFICAÇÃO FINAL
-- ============================================================
SELECT
    table_name,
    pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) AS tamanho
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

\echo '✅ Schema do AgendaFácil criado com sucesso!'
