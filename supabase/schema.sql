-- ============================================================
-- AgendaFácil — Schema Supabase (PostgreSQL)
-- Execute este SQL no SQL Editor do Supabase
-- ============================================================

-- ── 1. TABELA: CLÍNICAS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS clinicas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    telefone TEXT,
    email TEXT,
    endereco TEXT,
    logo_url TEXT,
    cor_primaria TEXT DEFAULT '3b82f6',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── 2. TABELA: PROFISSIONAIS ───────────────────────────────
CREATE TABLE IF NOT EXISTS profissionais (
    id BIGSERIAL PRIMARY KEY,
    clinica_id UUID REFERENCES clinicas(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    especialidade TEXT NOT NULL,
    cor TEXT DEFAULT '3b82f6',
    foto_url TEXT,
    horario_inicio TIME DEFAULT '08:00',
    horario_fim TIME DEFAULT '18:00',
    duracao_consulta INTEGER DEFAULT 60,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── 3. TABELA: PACIENTES ──────────────────────────────────
CREATE TABLE IF NOT EXISTS pacientes (
    id BIGSERIAL PRIMARY KEY,
    clinica_id UUID REFERENCES clinicas(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    telefone TEXT,
    email TEXT,
    data_nascimento DATE,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── 4. TABELA: AGENDAMENTOS ──────────────────────────────
CREATE TABLE IF NOT EXISTS agendamentos (
    id BIGSERIAL PRIMARY KEY,
    clinica_id UUID REFERENCES clinicas(id) ON DELETE CASCADE,
    profissional_id BIGINT REFERENCES profissionais(id) ON DELETE SET NULL,
    paciente_id BIGINT REFERENCES pacientes(id) ON DELETE SET NULL,
    paciente_nome TEXT NOT NULL,
    telefone TEXT,
    email TEXT,
    data DATE NOT NULL,
    horario TIME NOT NULL,
    tipo TEXT DEFAULT 'Consulta',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── 5. TABELA: PRONTUÁRIOS ───────────────────────────────
CREATE TABLE IF NOT EXISTS prontuarios (
    id BIGSERIAL PRIMARY KEY,
    clinica_id UUID REFERENCES clinicas(id) ON DELETE CASCADE,
    paciente_id BIGINT REFERENCES pacientes(id) ON DELETE SET NULL,
    profissional_id BIGINT REFERENCES profissionais(id) ON DELETE SET NULL,
    paciente_nome TEXT,
    profissional_nome TEXT,
    medico_nome TEXT,
    crm TEXT,
    data_consulta DATE,
    queixa_principal TEXT,
    anamnese TEXT,
    pressao_arterial TEXT,
    freq_cardiaca TEXT,
    temperatura TEXT,
    peso_altura TEXT,
    exame_fisico TEXT,
    diagnostico TEXT,
    medicamentos TEXT,
    conduta TEXT,
    retorno TEXT,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 6. ÍNDICES ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profissionais_clinica ON profissionais(clinica_id);
CREATE INDEX IF NOT EXISTS idx_profissionais_ativo ON profissionais(clinica_id, ativo);
CREATE INDEX IF NOT EXISTS idx_pacientes_clinica ON pacientes(clinica_id);
CREATE INDEX IF NOT EXISTS idx_pacientes_telefone ON pacientes(clinica_id, telefone);
CREATE INDEX IF NOT EXISTS idx_agendamentos_clinica ON agendamentos(clinica_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON agendamentos(clinica_id, data);
CREATE INDEX IF NOT EXISTS idx_agendamentos_prof_data ON agendamentos(profissional_id, data);
CREATE INDEX IF NOT EXISTS idx_prontuarios_clinica ON prontuarios(clinica_id);
CREATE INDEX IF NOT EXISTS idx_prontuarios_paciente ON prontuarios(paciente_id);

-- ── 7. ROW LEVEL SECURITY (RLS) ────────────────────────
-- Habilitar RLS em todas as tabelas
ALTER TABLE clinicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE prontuarios ENABLE ROW LEVEL SECURITY;

-- POLÍTICA: Profissionais podem ser lidos publicamente (para agendamento online)
CREATE POLICY "profissionais_leitura_publica" ON profissionais
    FOR SELECT USING (ativo = true);

-- POLÍTICA: Agendamentos podem ser lidos para verificar horários
CREATE POLICY "agendamentos_leitura_publica" ON agendamentos
    FOR SELECT USING (true);

-- POLÍTICA: Qualquer pessoa pode criar agendamento (formulário público)
CREATE POLICY "agendamentos_insert_publico" ON agendamentos
    FOR INSERT WITH CHECK (true);

-- POLÍTICA: Qualquer pessoa pode criar paciente (via agendamento)
CREATE POLICY "pacientes_insert_publico" ON pacientes
    FOR INSERT WITH CHECK (true);

-- POLÍTICA: Pacientes podem ser lidos
CREATE POLICY "pacientes_leitura" ON pacientes
    FOR SELECT USING (true);

-- POLÍTICA: Clínicas podem ser lidas
CREATE POLICY "clinicas_leitura" ON clinicas
    FOR SELECT USING (true);

-- POLÍTICA: Prontuários podem ser lidos e criados
CREATE POLICY "prontuarios_leitura" ON prontuarios
    FOR SELECT USING (true);

CREATE POLICY "prontuarios_insert" ON prontuarios
    FOR INSERT WITH CHECK (true);

-- POLÍTICA: Permitir atualizações e exclusões (admin)
CREATE POLICY "profissionais_admin" ON profissionais
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "agendamentos_admin" ON agendamentos
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "pacientes_admin" ON pacientes
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "clinicas_admin" ON clinicas
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "prontuarios_admin" ON prontuarios
    FOR ALL USING (true) WITH CHECK (true);

-- ── 8. FUNÇÃO: ATUALIZAR updated_at AUTOMATICAMENTE ────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clinicas_updated_at BEFORE UPDATE ON clinicas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profissionais_updated_at BEFORE UPDATE ON profissionais
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pacientes_updated_at BEFORE UPDATE ON pacientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agendamentos_updated_at BEFORE UPDATE ON agendamentos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── 9. DADOS DE DEMONSTRAÇÃO ────────────────────────────
-- Insere uma clínica padrão
INSERT INTO clinicas (id, nome, telefone, email) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Clínica Saúde & Bem-Estar',
    '(11) 3333-4444',
    'contato@clinicasaude.com.br'
) ON CONFLICT (id) DO NOTHING;

-- Insere profissionais de demonstração
INSERT INTO profissionais (clinica_id, nome, especialidade, cor, horario_inicio, horario_fim, duracao_consulta) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Dr. João Silva', 'Clínico Geral', '3b82f6', '08:00', '18:00', 60),
    ('00000000-0000-0000-0000-000000000001', 'Dra. Ana Costa', 'Pediatra', 'ec4899', '09:00', '17:00', 45),
    ('00000000-0000-0000-0000-000000000001', 'Dr. Carlos Mendes', 'Ortopedista', '8b5cf6', '10:00', '19:00', 60)
ON CONFLICT DO NOTHING;
