// ============================================================
// AgendaFácil — Script para criar o primeiro admin
// Execute: node create-admin.js
// ============================================================
'use strict';

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// ──────────────────────────────────────────────────────────
// ✏️  CONFIGURE AQUI ANTES DE EXECUTAR
// ──────────────────────────────────────────────────────────
const ADMIN = {
    nome: 'Clínica Demo',          // Nome da clínica
    email: 'admin@suaclinica.com',  // E-mail de login
    senha: 'Admin@2026',            // Senha (mínimo 8 chars)
    telefone: '(11) 99999-0000',
    slug: 'clinica-demo',          // URL pública: /agendar/clinica-demo
};
// ──────────────────────────────────────────────────────────

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'agendafacil',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS,
});

async function criar() {
    console.log('\n🚀 Criando admin do AgendaFácil...\n');

    try {
        // 1. Verificar conexão
        await pool.query('SELECT 1');
        console.log('✅ Banco de dados conectado.');

        // 2. Verificar se e-mail já existe
        const existe = await pool.query('SELECT id FROM clinicas WHERE email = $1', [ADMIN.email]);
        if (existe.rows.length) {
            console.log(`⚠️  E-mail ${ADMIN.email} já cadastrado. Pulando criação.`);
            await pool.end();
            return;
        }

        // 3. Gerar hash da senha
        console.log('🔐 Gerando hash da senha...');
        const senhaHash = await bcrypt.hash(ADMIN.senha, 12);

        // 4. Inserir clínica
        const result = await pool.query(
            `INSERT INTO clinicas (nome, slug, email, senha_hash, telefone, plano)
             VALUES ($1, $2, $3, $4, $5, 'profissional')
             RETURNING id, nome, email`,
            [ADMIN.nome, ADMIN.slug, ADMIN.email, senhaHash, ADMIN.telefone]
        );
        const clinica = result.rows[0];
        console.log(`✅ Clínica criada: ${clinica.nome} (ID: ${clinica.id})`);

        // 5. Criar profissionais de exemplo
        await pool.query(
            `INSERT INTO profissionais (clinica_id, nome, especialidade, cor, horario_inicio, horario_fim, duracao_consulta)
             VALUES
             ($1, 'Dr. João Silva',    'Clínico Geral', '3b82f6', '08:00', '18:00', 60),
             ($1, 'Dra. Ana Costa',   'Pediatra',       'ec4899', '09:00', '17:00', 45),
             ($1, 'Dr. Carlos Mendes','Ortopedista',    '8b5cf6', '10:00', '19:00', 60)`,
            [clinica.id]
        );
        console.log('✅ 3 profissionais de exemplo criados.');

        // 6. Resumo
        console.log('\n' + '─'.repeat(50));
        console.log('🎉 Admin criado com sucesso!\n');
        console.log(`   🌐  URL:   http://localhost:3000/login.html`);
        console.log(`   📧  Email: ${ADMIN.email}`);
        console.log(`   🔑  Senha: ${ADMIN.senha}`);
        console.log('\n   ⚠️  TROQUE A SENHA após o primeiro login!');
        console.log('─'.repeat(50) + '\n');

    } catch (err) {
        console.error('\n❌ Erro:', err.message);

        if (err.code === '42P01') {
            console.error('   As tabelas não existem. Execute primeiro:');
            console.error('   psql -U postgres -d agendafacil -f schema.sql\n');
        }
    } finally {
        await pool.end();
    }
}

criar();
