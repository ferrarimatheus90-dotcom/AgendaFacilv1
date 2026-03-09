// ============================================================
// AgendaFácil — Cliente Supabase
// Substitui localStorage e Google Sheets por Supabase
// ============================================================

const SUPABASE_URL = 'https://rlzisapzzohpdxcvsqyp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_lChC8L_2OkrDvG_fStpOzA_mPI884FN';

const SupabaseDB = (() => {

    // ──────────────────────────────────────────────────────
    // CONFIGURAÇÃO
    // ──────────────────────────────────────────────────────

    // ID da clínica não é mais fixo! Agora o Supabase extrai direto do JWT seguro (auth.uid())
    let CLINICA_ID = localStorage.getItem('sb-user-id');

    // ──────────────────────────────────────────────────────
    // CLIENTE HTTP SIMPLES (sem dependência do SDK)
    // ──────────────────────────────────────────────────────
    function getHeaders() {
        const token = localStorage.getItem('sb-access-token') || sessionStorage.getItem('sb-access-token');
        return {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': token ? `Bearer ${token}` : `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'return=representation'
        };
    }

    async function query(table, params = '') {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${params}`, { headers: getHeaders() });
        if (!res.ok) throw new Error(`Erro ao buscar ${table}: ${res.status}`);
        return res.json();
    }

    async function insert(table, data) {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(`Erro ao inserir em ${table}: ${err.message || res.status}`);
        }
        return res.json();
    }

    async function update(table, id, data) {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error(`Erro ao atualizar ${table}: ${res.status}`);
        return res.json();
    }

    async function remove(table, id) {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!res.ok) throw new Error(`Erro ao excluir de ${table}: ${res.status}`);
        return true;
    }

    // ──────────────────────────────────────────────────────
    // PROFISSIONAIS
    // ──────────────────────────────────────────────────────
    async function listarProfissionais(apenasAtivos = false) {
        let params = `?clinica_id=eq.${CLINICA_ID}&order=nome.asc`;
        if (apenasAtivos) params += '&ativo=eq.true';
        return query('profissionais', params);
    }

    async function obterProfissional(id) {
        const result = await query('profissionais', `?id=eq.${id}`);
        return result[0] || null;
    }

    async function criarProfissional(dados) {
        return insert('profissionais', {
            clinica_id: CLINICA_ID,
            nome: dados.nome,
            especialidade: dados.especialidade,
            cor: dados.cor || '3b82f6',
            foto_url: dados.foto_url || null,
            horario_inicio: dados.horario_inicio || '08:00',
            horario_fim: dados.horario_fim || '18:00',
            duracao_consulta: dados.duracao_consulta || 60,
            ativo: true
        });
    }

    async function atualizarProfissional(id, dados) {
        return update('profissionais', id, {
            nome: dados.nome,
            especialidade: dados.especialidade,
            cor: dados.cor,
            foto_url: dados.foto_url || null,
            horario_inicio: dados.horario_inicio,
            horario_fim: dados.horario_fim,
            duracao_consulta: dados.duracao_consulta
        });
    }

    async function excluirProfissional(id) {
        // Também remove agendamentos associados
        await remove('agendamentos', null, `profissional_id=eq.${id}`);
        return remove('profissionais', id);
    }

    // ──────────────────────────────────────────────────────
    // PACIENTES
    // ──────────────────────────────────────────────────────
    async function listarPacientes(busca = '') {
        let params = `?clinica_id=eq.${CLINICA_ID}&order=nome.asc`;
        if (busca) params += `&or=(nome.ilike.*${busca}*,telefone.ilike.*${busca}*)`;
        return query('pacientes', params);
    }

    async function obterPacientePorTelefone(telefone) {
        const result = await query('pacientes', `?clinica_id=eq.${CLINICA_ID}&telefone=eq.${encodeURIComponent(telefone)}`);
        return result[0] || null;
    }

    async function criarOuAtualizarPaciente(nome, telefone, email = '') {
        if (!telefone) return null;
        const existente = await obterPacientePorTelefone(telefone);
        if (existente) {
            // Atualiza nome se mudou
            if (existente.nome !== nome) {
                await update('pacientes', existente.id, { nome });
            }
            return existente;
        }
        const result = await insert('pacientes', {
            clinica_id: CLINICA_ID,
            nome,
            telefone,
            email: email || null
        });
        return result[0];
    }

    // ──────────────────────────────────────────────────────
    // AGENDAMENTOS
    // ──────────────────────────────────────────────────────
    async function listarAgendamentos(filtros = {}) {
        let params = `?clinica_id=eq.${CLINICA_ID}&order=data.asc,horario.asc`;
        if (filtros.data) params += `&data=eq.${filtros.data}`;
        if (filtros.dataInicio && filtros.dataFim) {
            params += `&data=gte.${filtros.dataInicio}&data=lte.${filtros.dataFim}`;
        }
        if (filtros.profissional_id) params += `&profissional_id=eq.${filtros.profissional_id}`;
        if (filtros.status) params += `&status=eq.${filtros.status}`;
        return query('agendamentos', params);
    }

    async function obterAgendamento(id) {
        const result = await query('agendamentos', `?id=eq.${id}`);
        return result[0] || null;
    }

    async function criarAgendamento(dados) {
        // Upsert do paciente
        const paciente = await criarOuAtualizarPaciente(
            dados.paciente_nome,
            dados.telefone,
            dados.email
        );

        return insert('agendamentos', {
            clinica_id: CLINICA_ID,
            profissional_id: dados.profissional_id,
            paciente_id: paciente?.id || null,
            paciente_nome: dados.paciente_nome,
            telefone: dados.telefone || null,
            email: dados.email || null,
            data: dados.data,
            horario: dados.horario,
            tipo: dados.tipo || 'Consulta',
            status: dados.status || 'pending',
            observacoes: dados.observacoes || null
        });
    }

    async function atualizarStatusAgendamento(id, status) {
        return update('agendamentos', id, { status });
    }

    async function excluirAgendamento(id) {
        return remove('agendamentos', id);
    }

    // Horários disponíveis para um profissional em uma data
    async function horariosDisponiveis(profissionalId, data) {
        const prof = await obterProfissional(profissionalId);
        if (!prof) return { slots: [] };

        // Buscar agendamentos existentes nessa data
        const agendamentos = await query('agendamentos',
            `?profissional_id=eq.${profissionalId}&data=eq.${data}&status=neq.cancelled`
        );
        const ocupados = agendamentos.map(a => a.horario.substring(0, 5)); // "HH:MM"

        // Gerar slots
        const [hIni, mIni] = prof.horario_inicio.split(':').map(Number);
        const [hFim, mFim] = prof.horario_fim.split(':').map(Number);
        const duracao = prof.duracao_consulta;
        const slots = [];

        let current = hIni * 60 + mIni;
        const end = hFim * 60 + mFim;

        while (current + duracao <= end) {
            const h = String(Math.floor(current / 60)).padStart(2, '0');
            const m = String(current % 60).padStart(2, '0');
            const time = `${h}:${m}`;
            slots.push({
                time,
                disponivel: !ocupados.includes(time)
            });
            current += duracao;
        }

        return { slots, profissional: prof };
    }

    // ──────────────────────────────────────────────────────
    // PRONTUÁRIOS
    // ──────────────────────────────────────────────────────
    async function listarProntuarios() {
        return query('prontuarios', `?clinica_id=eq.${CLINICA_ID}&order=created_at.desc`);
    }

    async function criarProntuario(dados) {
        return insert('prontuarios', {
            clinica_id: CLINICA_ID,
            paciente_nome: dados.paciente_nome,
            profissional_nome: dados.profissional_nome,
            medico_nome: dados.medico_nome,
            crm: dados.crm,
            data_consulta: dados.data_consulta,
            queixa_principal: dados.queixa_principal,
            anamnese: dados.anamnese,
            pressao_arterial: dados.pressao_arterial,
            freq_cardiaca: dados.freq_cardiaca,
            temperatura: dados.temperatura,
            peso_altura: dados.peso_altura,
            exame_fisico: dados.exame_fisico,
            diagnostico: dados.diagnostico,
            medicamentos: dados.medicamentos,
            conduta: dados.conduta,
            retorno: dados.retorno,
            observacoes: dados.observacoes
        });
    }

    async function excluirProntuario(id) {
        return remove('prontuarios', id);
    }

    // ──────────────────────────────────────────────────────
    // CLÍNICA
    // ──────────────────────────────────────────────────────
    async function obterClinica() {
        const result = await query('clinicas', `?id=eq.${CLINICA_ID}`);
        return result[0] || null;
    }

    // ──────────────────────────────────────────────────────
    // ESTATÍSTICAS (DASHBOARD)
    // ──────────────────────────────────────────────────────
    async function estatisticas() {
        const hoje = new Date().toISOString().split('T')[0];
        const inicioSemana = new Date();
        inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
        const semanaStr = inicioSemana.toISOString().split('T')[0];

        const [todayApts, weekApts, pacientes, profissionais] = await Promise.all([
            query('agendamentos', `?clinica_id=eq.${CLINICA_ID}&data=eq.${hoje}&select=id`),
            query('agendamentos', `?clinica_id=eq.${CLINICA_ID}&data=gte.${semanaStr}&select=id`),
            query('pacientes', `?clinica_id=eq.${CLINICA_ID}&select=id`),
            query('profissionais', `?clinica_id=eq.${CLINICA_ID}&ativo=eq.true&select=id`)
        ]);

        return {
            hoje: todayApts.length,
            semana: weekApts.length,
            pacientes: pacientes.length,
            profissionais: profissionais.length
        };
    }

    // ──────────────────────────────────────────────────────
    // UTILIDADES
    // ──────────────────────────────────────────────────────
    function setClinicaId(id) {
        CLINICA_ID = id;
        localStorage.setItem('agendafacil_clinica_id', id);
    }

    function getClinicaId() {
        return CLINICA_ID;
    }

    function isConfigured() {
        return SUPABASE_URL !== 'SUA_URL_AQUI' && SUPABASE_ANON_KEY !== 'SUA_CHAVE_ANON_AQUI';
    }

    async function testarConexao() {
        try {
            const resultado = await query('clinicas', `?id=eq.${CLINICA_ID}&select=id,nome`);
            return { ok: true, clinica: resultado[0] || null };
        } catch (e) {
            return { ok: false, error: e.message };
        }
    }

    // ──────────────────────────────────────────────────────
    // API PÚBLICA
    // ──────────────────────────────────────────────────────
    return {
        // Config
        isConfigured,
        testarConexao,
        setClinicaId,
        getClinicaId,

        // Clínica
        obterClinica,

        // Profissionais
        listarProfissionais,
        obterProfissional,
        criarProfissional,
        atualizarProfissional,
        excluirProfissional,

        // Pacientes
        listarPacientes,
        obterPacientePorTelefone,
        criarOuAtualizarPaciente,

        // Agendamentos
        listarAgendamentos,
        obterAgendamento,
        criarAgendamento,
        atualizarStatusAgendamento,
        excluirAgendamento,
        horariosDisponiveis,

        // Prontuários
        listarProntuarios,
        criarProntuario,
        excluirProntuario,

        // Dashboard
        estatisticas
    };

})();
