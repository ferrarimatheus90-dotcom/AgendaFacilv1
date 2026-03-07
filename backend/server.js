// ============================================================
// AgendaFácil — Backend API (Express.js + PostgreSQL 17)
// ============================================================
'use strict';

const express    = require('express');
const { Pool }   = require('pg');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const path       = require('path');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// BANCO DE DADOS
// ============================================================
const pool = new Pool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME     || 'agendafacil',
    user:     process.env.DB_USER     || 'postgres',
    password: process.env.DB_PASS,
    ssl:      process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => console.error('Erro no pool PostgreSQL:', err));

// ============================================================
// MIDDLEWARE
// ============================================================
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
    origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        cb(new Error(`CORS bloqueado para origem: ${origin}`));
    },
    credentials: true,
}));
app.use(express.json({ limit: '5mb' }));

// Arquivos estáticos (HTML, CSS, JS do frontend)
app.use(express.static(path.join(__dirname, '../')));

// Rate limiting: 100 requisições por 15 min por IP
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true });
app.use('/api/', limiter);

// Rate limiting mais restrito para auth (5 tentativas por 15 min)
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, standardHeaders: true });
app.use('/api/auth/login', authLimiter);

// ============================================================
// MIDDLEWARE DE AUTENTICAÇÃO JWT
// ============================================================
function auth(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token não fornecido.' });
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ error: 'Token inválido ou expirado.' });
    }
}

// Helper para queries
const query = (text, params) => pool.query(text, params);

// ============================================================
// ROTAS: AUTH
// ============================================================

// POST /api/auth/login — Login da clínica
app.post('/api/auth/login', async (req, res) => {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ error: 'Email e senha são obrigatórios.' });

    try {
        const result = await query(
            'SELECT id, nome, email, senha_hash, cnpj, telefone, plano, logo_url, cor_primaria FROM clinicas WHERE email = $1 AND ativo = TRUE',
            [email.toLowerCase().trim()]
        );
        const clinica = result.rows[0];

        if (!clinica || !await bcrypt.compare(senha, clinica.senha_hash)) {
            return res.status(401).json({ error: 'Email ou senha incorretos.' });
        }

        const token = jwt.sign(
            { clinicaId: clinica.id, nome: clinica.nome, email: clinica.email, plano: clinica.plano },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            clinica: {
                id: clinica.id, nome: clinica.nome, email: clinica.email,
                plano: clinica.plano, telefone: clinica.telefone,
                logo_url: clinica.logo_url, cor_primaria: clinica.cor_primaria,
            }
        });
    } catch (e) {
        console.error('Erro no login:', e);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// POST /api/auth/register — Registrar nova clínica (adicione proteção ou use só internamente)
app.post('/api/auth/register', async (req, res) => {
    const { nome, email, senha, cnpj, telefone } = req.body;
    if (!nome || !email || !senha) return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
    if (senha.length < 8) return res.status(400).json({ error: 'Senha deve ter ao menos 8 caracteres.' });

    try {
        const senhaHash = await bcrypt.hash(senha, 12);
        const slug = email.split('@')[0].replace(/[^a-z0-9]/gi, '-').toLowerCase();

        const result = await query(
            `INSERT INTO clinicas (nome, slug, email, senha_hash, cnpj, telefone)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, nome, email, plano`,
            [nome.trim(), slug, email.toLowerCase().trim(), senhaHash, cnpj || null, telefone || null]
        );

        // Criar profissionais de exemplo para a nova clínica
        const cId = result.rows[0].id;
        await query(
            `INSERT INTO profissionais (clinica_id, nome, especialidade, cor, horario_inicio, horario_fim, duracao_consulta)
             VALUES ($1, 'Dr. João Silva', 'Clínico Geral', '3b82f6', '08:00', '18:00', 60)`,
            [cId]
        );

        res.status(201).json({ message: 'Clínica cadastrada com sucesso!', clinica: result.rows[0] });
    } catch (e) {
        if (e.code === '23505') return res.status(409).json({ error: 'Email já cadastrado.' });
        console.error('Erro no registro:', e);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// GET /api/auth/me — Dados da clínica logada
app.get('/api/auth/me', auth, async (req, res) => {
    try {
        const result = await query(
            'SELECT id, nome, email, cnpj, telefone, plano, logo_url, cor_primaria, criado_em FROM clinicas WHERE id = $1',
            [req.user.clinicaId]
        );
        res.json(result.rows[0]);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// PUT /api/auth/senha — Alterar senha
app.put('/api/auth/senha', auth, async (req, res) => {
    const { senhaAtual, novaSenha } = req.body;
    if (!senhaAtual || !novaSenha) return res.status(400).json({ error: 'Campos obrigatórios faltando.' });
    if (novaSenha.length < 8) return res.status(400).json({ error: 'Nova senha deve ter ao menos 8 caracteres.' });

    try {
        const result = await query('SELECT senha_hash FROM clinicas WHERE id = $1', [req.user.clinicaId]);
        if (!await bcrypt.compare(senhaAtual, result.rows[0].senha_hash)) {
            return res.status(401).json({ error: 'Senha atual incorreta.' });
        }
        const novoHash = await bcrypt.hash(novaSenha, 12);
        await query('UPDATE clinicas SET senha_hash = $1 WHERE id = $2', [novoHash, req.user.clinicaId]);
        res.json({ message: 'Senha alterada com sucesso!' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ============================================================
// ROTAS: DASHBOARD
// ============================================================
app.get('/api/dashboard/stats', auth, async (req, res) => {
    const cId  = req.user.clinicaId;
    const hoje = new Date().toISOString().split('T')[0];
    const semanaStart = new Date();
    semanaStart.setDate(semanaStart.getDate() - semanaStart.getDay());
    const semanaStartStr = semanaStart.toISOString().split('T')[0];

    try {
        const [statHoje, statSemana, statPacientes, statProfs, agHoje] = await Promise.all([
            query('SELECT COUNT(*)::int FROM agendamentos WHERE clinica_id=$1 AND data=$2', [cId, hoje]),
            query('SELECT COUNT(*)::int FROM agendamentos WHERE clinica_id=$1 AND data>=$2', [cId, semanaStartStr]),
            query('SELECT COUNT(*)::int FROM pacientes WHERE clinica_id=$1', [cId]),
            query('SELECT COUNT(*)::int FROM profissionais WHERE clinica_id=$1 AND ativo=TRUE', [cId]),
            query(`
                SELECT a.id, a.horario, a.tipo, a.status,
                       p.nome AS profissional_nome, p.cor,
                       pac.nome AS paciente_nome
                FROM agendamentos a
                LEFT JOIN profissionais p   ON p.id = a.profissional_id
                LEFT JOIN pacientes pac     ON pac.id = a.paciente_id
                WHERE a.clinica_id=$1 AND a.data=$2
                ORDER BY a.horario
            `, [cId, hoje]),
        ]);

        res.json({
            hoje:              statHoje.rows[0].count,
            semana:            statSemana.rows[0].count,
            pacientes:         statPacientes.rows[0].count,
            profissionais:     statProfs.rows[0].count,
            agendamentosHoje:  agHoje.rows,
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// ============================================================
// ROTAS: PROFISSIONAIS
// ============================================================
app.get('/api/profissionais', auth, async (req, res) => {
    try {
        const result = await query(
            `SELECT p.*, COUNT(a.id)::int AS total_agendamentos
             FROM profissionais p
             LEFT JOIN agendamentos a ON a.profissional_id = p.id
             WHERE p.clinica_id = $1
             GROUP BY p.id
             ORDER BY p.nome`,
            [req.user.clinicaId]
        );
        res.json(result.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/profissionais', auth, async (req, res) => {
    const { nome, especialidade, cor, horario_inicio, horario_fim, duracao_consulta } = req.body;
    if (!nome || !especialidade) return res.status(400).json({ error: 'Nome e especialidade são obrigatórios.' });
    try {
        const result = await query(
            `INSERT INTO profissionais (clinica_id, nome, especialidade, cor, horario_inicio, horario_fim, duracao_consulta)
             VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
            [req.user.clinicaId, nome, especialidade, cor || '3b82f6',
             horario_inicio || '08:00', horario_fim || '18:00', duracao_consulta || 60]
        );
        res.status(201).json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/profissionais/:id', auth, async (req, res) => {
    const { nome, especialidade, cor, horario_inicio, horario_fim, duracao_consulta } = req.body;
    try {
        const result = await query(
            `UPDATE profissionais
             SET nome=$1, especialidade=$2, cor=$3, horario_inicio=$4, horario_fim=$5, duracao_consulta=$6
             WHERE id=$7 AND clinica_id=$8 RETURNING *`,
            [nome, especialidade, cor, horario_inicio, horario_fim, duracao_consulta,
             req.params.id, req.user.clinicaId]
        );
        if (!result.rows.length) return res.status(404).json({ error: 'Profissional não encontrado.' });
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/profissionais/:id', auth, async (req, res) => {
    try {
        await query('DELETE FROM profissionais WHERE id=$1 AND clinica_id=$2', [req.params.id, req.user.clinicaId]);
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// ROTAS: AGENDAMENTOS
// ============================================================
app.get('/api/agendamentos', auth, async (req, res) => {
    const { data_inicio, data_fim, profissional_id } = req.query;
    let sql    = `
        SELECT a.*, TO_CHAR(a.horario, 'HH24:MI') AS horario_fmt,
               p.nome AS profissional_nome, p.especialidade, p.cor,
               pac.nome AS paciente_nome, pac.telefone, pac.email
        FROM agendamentos a
        LEFT JOIN profissionais p ON p.id = a.profissional_id
        LEFT JOIN pacientes pac   ON pac.id = a.paciente_id
        WHERE a.clinica_id = $1
    `;
    const params = [req.user.clinicaId];

    if (data_inicio)      { sql += ` AND a.data >= $${params.length + 1}`;          params.push(data_inicio); }
    if (data_fim)         { sql += ` AND a.data <= $${params.length + 1}`;          params.push(data_fim); }
    if (profissional_id)  { sql += ` AND a.profissional_id = $${params.length + 1}`; params.push(profissional_id); }

    sql += ' ORDER BY a.data, a.horario';

    try {
        const result = await query(sql, params);
        res.json(result.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/agendamentos', auth, async (req, res) => {
    const { profissional_id, paciente_nome, paciente_telefone, paciente_email, data, horario, tipo, observacoes } = req.body;
    if (!profissional_id || !data || !horario || !paciente_nome)
        return res.status(400).json({ error: 'Campos obrigatórios: profissional, data, horário e paciente.' });

    try {
        // Verifica se horário já está ocupado
        const conflito = await query(
            'SELECT id FROM agendamentos WHERE profissional_id=$1 AND data=$2 AND horario=$3 AND status != $4',
            [profissional_id, data, horario, 'cancelado']
        );
        if (conflito.rows.length) return res.status(409).json({ error: 'Horário já está ocupado para este profissional.' });

        // Upsert paciente
        let pacienteId;
        const pacExist = await query(
            'SELECT id FROM pacientes WHERE clinica_id=$1 AND telefone=$2',
            [req.user.clinicaId, paciente_telefone]
        );
        if (pacExist.rows.length) {
            pacienteId = pacExist.rows[0].id;
        } else {
            const novoPac = await query(
                'INSERT INTO pacientes (clinica_id, nome, telefone, email) VALUES ($1,$2,$3,$4) RETURNING id',
                [req.user.clinicaId, paciente_nome, paciente_telefone || null, paciente_email || null]
            );
            pacienteId = novoPac.rows[0].id;
        }

        const result = await query(
            `INSERT INTO agendamentos (clinica_id, profissional_id, paciente_id, data, horario, tipo, status, observacoes)
             VALUES ($1,$2,$3,$4,$5,$6,'pendente',$7) RETURNING *, TO_CHAR(horario, 'HH24:MI') AS horario_fmt`,
            [req.user.clinicaId, profissional_id, pacienteId, data, horario,
             tipo || 'Consulta', observacoes || '']
        );
        res.status(201).json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/agendamentos/:id', auth, async (req, res) => {
    const campos   = [];
    const params   = [];
    const allowed  = ['status', 'tipo', 'observacoes', 'data', 'horario'];
    allowed.forEach(f => {
        if (req.body[f] !== undefined) {
            campos.push(`${f}=$${params.length + 1}`);
            params.push(req.body[f]);
        }
    });
    if (!campos.length) return res.status(400).json({ error: 'Nenhum campo para atualizar.' });
    params.push(req.params.id, req.user.clinicaId);

    try {
        const result = await query(
            `UPDATE agendamentos SET ${campos.join(',')} WHERE id=$${params.length - 1} AND clinica_id=$${params.length} RETURNING *, TO_CHAR(horario, 'HH24:MI') AS horario_fmt`,
            params
        );
        if (!result.rows.length) return res.status(404).json({ error: 'Agendamento não encontrado.' });
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/agendamentos/:id', auth, async (req, res) => {
    try {
        await query('DELETE FROM agendamentos WHERE id=$1 AND clinica_id=$2', [req.params.id, req.user.clinicaId]);
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// ROTAS: PACIENTES
// ============================================================
app.get('/api/pacientes', auth, async (req, res) => {
    const { q } = req.query;
    let sql    = `
        SELECT p.*,
               COUNT(a.id)::int AS total_agendamentos,
               MAX(a.data)::text AS ultima_consulta
        FROM pacientes p
        LEFT JOIN agendamentos a ON a.paciente_id = p.id
        WHERE p.clinica_id = $1
    `;
    const params = [req.user.clinicaId];
    if (q) {
        sql += ` AND (p.nome ILIKE $2 OR p.telefone LIKE $2 OR p.email ILIKE $2)`;
        params.push(`%${q}%`);
    }
    sql += ' GROUP BY p.id ORDER BY p.nome';

    try {
        const result = await query(sql, params);
        res.json(result.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/pacientes/:id/agendamentos', auth, async (req, res) => {
    try {
        const result = await query(`
            SELECT a.*, TO_CHAR(a.horario, 'HH24:MI') AS horario_fmt,
                   p.nome AS profissional_nome, p.especialidade
            FROM agendamentos a
            LEFT JOIN profissionais p ON p.id = a.profissional_id
            WHERE a.paciente_id=$1 AND a.clinica_id=$2
            ORDER BY a.data DESC, a.horario DESC
        `, [req.params.id, req.user.clinicaId]);
        res.json(result.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// ROTAS: PRONTUÁRIOS
// ============================================================
app.get('/api/prontuarios', auth, async (req, res) => {
    try {
        const result = await query(`
            SELECT pr.*, pac.nome AS paciente_nome, pac.telefone
            FROM prontuarios pr
            LEFT JOIN pacientes pac ON pac.id = pr.paciente_id
            WHERE pr.clinica_id = $1
            ORDER BY pr.criado_em DESC
        `, [req.user.clinicaId]);
        res.json(result.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/prontuarios', auth, async (req, res) => {
    const { paciente_id, agendamento_id, queixa, dados_json } = req.body;
    if (!queixa) return res.status(400).json({ error: 'Queixa principal é obrigatória.' });
    try {
        const result = await query(
            `INSERT INTO prontuarios (clinica_id, paciente_id, agendamento_id, queixa, dados_json)
             VALUES ($1,$2,$3,$4,$5) RETURNING *`,
            [req.user.clinicaId, paciente_id || null, agendamento_id || null, queixa, JSON.stringify(dados_json || {})]
        );
        res.status(201).json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/prontuarios/:id', auth, async (req, res) => {
    try {
        await query('DELETE FROM prontuarios WHERE id=$1 AND clinica_id=$2', [req.params.id, req.user.clinicaId]);
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// ROTAS: FINANCEIRO
// ============================================================
app.get('/api/financeiro', auth, async (req, res) => {
    const { mes, ano } = req.query;
    let sql    = `
        SELECT f.*, pac.nome AS paciente_nome
        FROM financeiro f
        LEFT JOIN pacientes pac ON pac.id = f.paciente_id
        WHERE f.clinica_id = $1
    `;
    const params = [req.user.clinicaId];
    if (mes && ano) {
        sql += ` AND EXTRACT(MONTH FROM f.criado_em)=$${params.length+1} AND EXTRACT(YEAR FROM f.criado_em)=$${params.length+2}`;
        params.push(mes, ano);
    }
    sql += ' ORDER BY f.criado_em DESC';
    try {
        const result = await query(sql, params);
        res.json(result.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/financeiro', auth, async (req, res) => {
    const { agendamento_id, paciente_id, descricao, valor, forma_pagamento, status_pagamento, data_pagamento } = req.body;
    try {
        const result = await query(
            `INSERT INTO financeiro (clinica_id, agendamento_id, paciente_id, descricao, valor, forma_pagamento, status_pagamento, data_pagamento)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
            [req.user.clinicaId, agendamento_id || null, paciente_id || null,
             descricao || 'Consulta', valor || 0, forma_pagamento || 'dinheiro',
             status_pagamento || 'pendente', data_pagamento || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// ROTAS PÚBLICAS — Portal do cliente (agendamento.html)
// ============================================================

// Profissionais disponíveis para agendamento público
app.get('/api/public/:clinicaSlug/profissionais', async (req, res) => {
    try {
        const clinica = await query('SELECT id FROM clinicas WHERE slug=$1 AND ativo=TRUE', [req.params.clinicaSlug]);
        if (!clinica.rows.length) return res.status(404).json({ error: 'Clínica não encontrada.' });
        const result = await query(
            `SELECT id, nome, especialidade, cor,
                    TO_CHAR(horario_inicio, 'HH24:MI') AS horario_inicio,
                    TO_CHAR(horario_fim, 'HH24:MI') AS horario_fim,
                    duracao_consulta
             FROM profissionais WHERE clinica_id=$1 AND ativo=TRUE ORDER BY nome`,
            [clinica.rows[0].id]
        );
        res.json(result.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Horários disponíveis para agendamento público
app.get('/api/public/horarios', async (req, res) => {
    const { profissional_id, data } = req.query;
    if (!profissional_id || !data) return res.status(400).json({ error: 'profissional_id e data são obrigatórios.' });
    try {
        const profResult = await query('SELECT * FROM profissionais WHERE id=$1', [profissional_id]);
        if (!profResult.rows.length) return res.status(404).json({ error: 'Profissional não encontrado.' });
        const p = profResult.rows[0];

        const [sh, sm] = p.horario_inicio.split(':').map(Number);
        const [eh, em] = p.horario_fim.split(':').map(Number);

        const agendados = await query(
            "SELECT TO_CHAR(horario, 'HH24:MI') AS hfmt FROM agendamentos WHERE profissional_id=$1 AND data=$2 AND status != 'cancelado'",
            [profissional_id, data]
        );
        const ocupados = new Set(agendados.rows.map(r => r.hfmt));

        const slots = [];
        for (let min = sh * 60 + sm; min < eh * 60 + em; min += p.duracao_consulta) {
            const h  = String(Math.floor(min / 60)).padStart(2, '0');
            const m2 = String(min % 60).padStart(2, '0');
            slots.push({ time: `${h}:${m2}`, disponivel: !ocupados.has(`${h}:${m2}`) });
        }
        res.json(slots);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Agendar consulta (rota pública — portal do cliente)
app.post('/api/public/agendar', async (req, res) => {
    const { profissional_id, data, horario, paciente_nome, paciente_telefone, paciente_email, tipo, observacoes } = req.body;
    if (!profissional_id || !data || !horario || !paciente_nome)
        return res.status(400).json({ error: 'Campos obrigatórios faltando.' });

    try {
        const profResult = await query('SELECT clinica_id FROM profissionais WHERE id=$1', [profissional_id]);
        if (!profResult.rows.length) return res.status(404).json({ error: 'Profissional não encontrado.' });
        const clinicaId = profResult.rows[0].clinica_id;

        // Verifica conflito
        const conflito = await query(
            "SELECT id FROM agendamentos WHERE profissional_id=$1 AND data=$2 AND horario=$3 AND status != 'cancelado'",
            [profissional_id, data, horario]
        );
        if (conflito.rows.length) return res.status(409).json({ error: 'Horário não está mais disponível.' });

        // Upsert paciente
        let pacienteId;
        const pacExist = await query('SELECT id FROM pacientes WHERE clinica_id=$1 AND telefone=$2', [clinicaId, paciente_telefone]);
        if (pacExist.rows.length) {
            pacienteId = pacExist.rows[0].id;
        } else {
            const np = await query(
                'INSERT INTO pacientes (clinica_id, nome, telefone, email) VALUES ($1,$2,$3,$4) RETURNING id',
                [clinicaId, paciente_nome, paciente_telefone || null, paciente_email || null]
            );
            pacienteId = np.rows[0].id;
        }

        const result = await query(
            `INSERT INTO agendamentos (clinica_id, profissional_id, paciente_id, data, horario, tipo, status, observacoes)
             VALUES ($1,$2,$3,$4,$5,$6,'pendente',$7) RETURNING id`,
            [clinicaId, profissional_id, pacienteId, data, horario, tipo || 'Consulta', observacoes || '']
        );
        res.status(201).json({ id: result.rows[0].id, message: 'Agendamento realizado com sucesso!' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'ok', db: 'conectado', versao: '1.0.0' });
    } catch {
        res.status(503).json({ status: 'erro', db: 'desconectado' });
    }
});

// SPA fallback — serve index.html para qualquer rota não encontrada
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'Rota não encontrada.' });
    }
    res.sendFile(path.join(__dirname, '../index.html'));
});

// ============================================================
// INICIAR SERVIDOR
// ============================================================
app.listen(PORT, () => {
    console.log(`\n🚀 AgendaFácil API rodando na porta ${PORT}`);
    console.log(`📊 Painel Admin: http://localhost:${PORT}/`);
    console.log(`🔑 Login:        http://localhost:${PORT}/login.html`);
    console.log(`📅 Agendamento:  http://localhost:${PORT}/agendamento.html`);
    console.log(`❤️  Health:       http://localhost:${PORT}/api/health\n`);
});
