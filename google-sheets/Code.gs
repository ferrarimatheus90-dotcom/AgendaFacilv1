// ============================================================
// AgendaFácil — Google Apps Script Backend
// 
// INSTRUÇÕES DE INSTALAÇÃO:
// 1. Abra o Google Sheets do cliente
// 2. Extensões → Apps Script
// 3. Cole este código, salve (Ctrl+S)
// 4. Implantações → Nova implantação
//    - Tipo: Aplicativo da Web
//    - Executar como: Eu (minha conta)
//    - Quem pode acessar: Qualquer pessoa
// 5. Copie a URL gerada → cole no app (⚙️ Configurações)
// 6. Defina um TOKEN secreto abaixo ↓
// ============================================================

// ──────────────────────────────────────────────────────────
// ✏️  CONFIGURE AQUI
// ──────────────────────────────────────────────────────────
const SECRET_TOKEN = 'TROQUE_POR_UMA_SENHA_SECRETA_AQUI'; // ex: 'clinica@2026!'
// ──────────────────────────────────────────────────────────

// Nomes das abas (não altere após criar)
const SHEETS = {
  config:        'Config',
  profissionais: 'Profissionais',
  pacientes:     'Pacientes',
  agendamentos:  'Agendamentos',
  prontuarios:   'Prontuarios',
};

// ============================================================
// PONTO DE ENTRADA — todas as requisições passam aqui
// ============================================================
function doGet(e) {
  const params = e.parameter || {};
  const callback = params.callback; // JSONP

  try {
    // Verificar token de segurança
    if (params.token !== SECRET_TOKEN) {
      return jsonResponse({ ok: false, error: 'Token inválido.' }, callback);
    }

    const action   = params.action   || 'list';
    const resource = params.resource || '';
    const id       = params.id       ? parseInt(params.id) : null;
    const data     = params.data     ? JSON.parse(decodeURIComponent(params.data)) : null;

    let result;
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    switch (action) {
      // ── DASHBOARD ──────────────────────────────────────
      case 'stats':
        result = getDashboardStats(ss);
        break;

      // ── LISTAR ─────────────────────────────────────────
      case 'list':
        result = listRows(ss, SHEETS[resource]);
        break;

      // ── CRIAR ──────────────────────────────────────────
      case 'create':
        result = createRow(ss, SHEETS[resource], data);
        break;

      // ── ATUALIZAR ──────────────────────────────────────
      case 'update':
        result = updateRow(ss, SHEETS[resource], id, data);
        break;

      // ── EXCLUIR ────────────────────────────────────────
      case 'delete':
        result = deleteRow(ss, SHEETS[resource], id);
        break;

      // ── AGENDAR (portal do cliente — público) ──────────
      case 'agendar':
        result = criarAgendamentoPublico(ss, data);
        break;

      // ── HORÁRIOS DISPONÍVEIS ───────────────────────────
      case 'horarios':
        result = getHorariosDisponiveis(ss, params.profissional_id, params.data);
        break;

      // ── CONFIG DA CLÍNICA ──────────────────────────────
      case 'getConfig':
        result = getConfig(ss);
        break;

      case 'setConfig':
        result = setConfig(ss, data);
        break;

      default:
        return jsonResponse({ ok: false, error: 'Ação desconhecida: ' + action }, callback);
    }

    return jsonResponse({ ok: true, data: result }, callback);

  } catch (err) {
    Logger.log('Erro: ' + err.toString());
    return jsonResponse({ ok: false, error: err.message }, callback);
  }
}

// ============================================================
// HELPERS: JSON / JSONP
// ============================================================
function jsonResponse(obj, callback) {
  const json = JSON.stringify(obj);
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// HELPERS: LEITURA / ESCRITA NAS ABAS
// ============================================================

/**
 * Garante que a aba exista. Se não existir, cria com os headers corretos.
 */
function getOrCreateSheet(ss, sheetName) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    const headers = SHEET_HEADERS[sheetName];
    if (headers) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length)
        .setBackground('#1e40af')
        .setFontColor('#ffffff')
        .setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

const SHEET_HEADERS = {
  'Config': ['chave', 'valor'],
  'Profissionais': ['id', 'nome', 'especialidade', 'cor', 'inicio', 'fim', 'duracao', 'ativo'],
  'Pacientes':     ['id', 'nome', 'telefone', 'email', 'criado_em'],
  'Agendamentos':  ['id', 'profissional_id', 'profissional_nome', 'paciente_id', 'paciente_nome',
                    'telefone', 'email', 'data', 'horario', 'tipo', 'status', 'obs', 'criado_em'],
  'Prontuarios':   ['id', 'paciente_nome', 'data', 'queixa', 'dados_json', 'criado_em'],
};

/**
 * Lê todas as linhas de uma aba e retorna array de objetos.
 */
function listRows(ss, sheetName) {
  const sheet = getOrCreateSheet(ss, sheetName);
  const data  = sheet.getDataRange().getValues();
  if (data.length <= 1) return []; // só header

  const headers = data[0];
  return data.slice(1)
    .filter(row => row[0] !== '') // ignora linhas vazias
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = row[i] instanceof Date ? Utilities.formatDate(row[i], 'America/Sao_Paulo', 'yyyy-MM-dd') : row[i];
      });
      return obj;
    });
}

/**
 * Cria uma nova linha. Gera ID automático.
 */
function createRow(ss, sheetName, data) {
  const sheet   = getOrCreateSheet(ss, sheetName);
  const headers = SHEET_HEADERS[sheetName];
  const allRows = sheet.getDataRange().getValues();

  // Gerar próximo ID
  const ids = allRows.slice(1).map(r => parseInt(r[0]) || 0).filter(Boolean);
  data.id = ids.length > 0 ? Math.max(...ids) + 1 : 1;

  // Adicionar campos automáticos
  if (headers.includes('criado_em') && !data.criado_em) {
    data.criado_em = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm');
  }
  if (headers.includes('ativo') && data.ativo === undefined) {
    data.ativo = true;
  }

  // Montar linha na ordem correta dos headers
  const newRow = headers.map(h => data[h] !== undefined ? data[h] : '');
  sheet.appendRow(newRow);

  return data;
}

/**
 * Atualiza uma linha pelo ID.
 */
function updateRow(ss, sheetName, id, data) {
  const sheet   = getOrCreateSheet(ss, sheetName);
  const headers = SHEET_HEADERS[sheetName];
  const allRows = sheet.getDataRange().getValues();

  for (let i = 1; i < allRows.length; i++) {
    if (parseInt(allRows[i][0]) === id) {
      const rowNum = i + 1;
      headers.forEach((h, colIdx) => {
        if (data[h] !== undefined) {
          sheet.getRange(rowNum, colIdx + 1).setValue(data[h]);
        }
      });
      return { id, ...data, updated: true };
    }
  }
  throw new Error('Registro com ID ' + id + ' não encontrado em ' + sheetName);
}

/**
 * Exclui uma linha pelo ID.
 */
function deleteRow(ss, sheetName, id) {
  const sheet   = getOrCreateSheet(ss, sheetName);
  const allRows = sheet.getDataRange().getValues();

  for (let i = allRows.length - 1; i >= 1; i--) {
    if (parseInt(allRows[i][0]) === id) {
      sheet.deleteRow(i + 1);
      return { deleted: true, id };
    }
  }
  throw new Error('Registro com ID ' + id + ' não encontrado.');
}

// ============================================================
// DASHBOARD: Estatísticas
// ============================================================
function getDashboardStats(ss) {
  const hoje      = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'yyyy-MM-dd');
  const semanaIni = new Date();
  semanaIni.setDate(semanaIni.getDate() - semanaIni.getDay());
  const semanaStr = Utilities.formatDate(semanaIni, 'America/Sao_Paulo', 'yyyy-MM-dd');

  const agendamentos  = listRows(ss, SHEETS.agendamentos);
  const agHoje        = agendamentos.filter(a => a.data === hoje);
  const agSemana      = agendamentos.filter(a => a.data >= semanaStr);
  const pacientes     = listRows(ss, SHEETS.pacientes);
  const profissionais = listRows(ss, SHEETS.profissionais).filter(p => p.ativo);

  return {
    hoje:             agHoje.length,
    semana:           agSemana.length,
    pacientes:        pacientes.length,
    profissionais:    profissionais.length,
    agendamentosHoje: agHoje.sort((a, b) => a.horario.localeCompare(b.horario)),
  };
}

// ============================================================
// HORÁRIOS DISPONÍVEIS (portal do cliente)
// ============================================================
function getHorariosDisponiveis(ss, profissionalId, data) {
  const profs = listRows(ss, SHEETS.profissionais);
  const prof  = profs.find(p => String(p.id) === String(profissionalId));
  if (!prof) throw new Error('Profissional não encontrado.');

  const agendamentos = listRows(ss, SHEETS.agendamentos);
  const ocupados = new Set(
    agendamentos
      .filter(a => String(a.profissional_id) === String(profissionalId) && a.data === data && a.status !== 'cancelado')
      .map(a => a.horario)
  );

  const slots   = [];
  const duracao = parseInt(prof.duracao) || 60;
  const [sh, sm] = prof.inicio.split(':').map(Number);
  const [eh, em] = prof.fim.split(':').map(Number);

  for (let min = sh * 60 + sm; min < eh * 60 + em; min += duracao) {
    const h  = String(Math.floor(min / 60)).padStart(2, '0');
    const m2 = String(min % 60).padStart(2, '0');
    const t  = `${h}:${m2}`;
    slots.push({ time: t, disponivel: !ocupados.has(t) });
  }

  return { slots, profissional: prof };
}

// ============================================================
// AGENDAMENTO PÚBLICO (portal do cliente)
// ============================================================
function criarAgendamentoPublico(ss, data) {
  // Verificar conflito
  const agendamentos = listRows(ss, SHEETS.agendamentos);
  const conflito = agendamentos.find(a =>
    String(a.profissional_id) === String(data.profissional_id) &&
    a.data === data.data &&
    a.horario === data.horario &&
    a.status !== 'cancelado'
  );
  if (conflito) throw new Error('Horário não está mais disponível. Por favor escolha outro.');

  // Upsert paciente
  const pacientes = listRows(ss, SHEETS.pacientes);
  let paciente = pacientes.find(p => p.telefone === data.telefone);
  if (!paciente) {
    paciente = createRow(ss, SHEETS.pacientes, {
      nome: data.paciente_nome, telefone: data.telefone, email: data.email || ''
    });
  }

  // Criar agendamento
  const profs = listRows(ss, SHEETS.profissionais);
  const prof  = profs.find(p => String(p.id) === String(data.profissional_id));

  const novoAg = createRow(ss, SHEETS.agendamentos, {
    profissional_id:   data.profissional_id,
    profissional_nome: prof ? prof.nome : '',
    paciente_id:       paciente.id,
    paciente_nome:     data.paciente_nome,
    telefone:          data.telefone,
    email:             data.email || '',
    data:              data.data,
    horario:           data.horario,
    tipo:              data.tipo || 'Consulta',
    status:            'pendente',
    obs:               data.obs || '',
  });

  // Enviar e-mail de confirmação (se o cliente configurar)
  try {
    const config = getConfig(ss);
    if (config.email_clinica) {
      notificarNovoAgendamento(config, novoAg, prof);
    }
  } catch(e) { /* Silencioso se e-mail falhar */ }

  return novoAg;
}

// ============================================================
// CONFIGURAÇÕES DA CLÍNICA
// ============================================================
function getConfig(ss) {
  const sheet = getOrCreateSheet(ss, SHEETS.config);
  const rows  = sheet.getDataRange().getValues();
  const config = {};
  rows.forEach(row => { if (row[0]) config[row[0]] = row[1]; });
  return config;
}

function setConfig(ss, data) {
  const sheet = getOrCreateSheet(ss, SHEETS.config);
  const rows  = sheet.getDataRange().getValues();

  Object.entries(data).forEach(([chave, valor]) => {
    let found = false;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === chave) {
        sheet.getRange(i + 1, 2).setValue(valor);
        found = true;
        break;
      }
    }
    if (!found) sheet.appendRow([chave, valor]);
  });
  return { saved: true };
}

// ============================================================
// E-MAIL: Notificação de novo agendamento (opcional)
// ============================================================
function notificarNovoAgendamento(config, agendamento, profissional) {
  const emailClinica = config.email_clinica;
  if (!emailClinica) return;

  const assunto = `📅 Novo agendamento — ${agendamento.paciente_nome}`;
  const corpo   = `
    Novo agendamento recebido no AgendaFácil!
    
    Paciente:       ${agendamento.paciente_nome}
    Telefone:       ${agendamento.telefone}
    Profissional:   ${agendamento.profissional_nome}
    Data:           ${agendamento.data}
    Horário:        ${agendamento.horario}
    Tipo:           ${agendamento.tipo}
  `;

  MailApp.sendEmail({ to: emailClinica, subject: assunto, body: corpo });
}

// ============================================================
// SETUP INICIAL: Cria as abas com formatação (execute 1x)
// ============================================================
function setupPlanilha() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setName('AgendaFácil — ' + new Date().getFullYear());

  Object.values(SHEETS).forEach(name => getOrCreateSheet(ss, name));

  // Config padrão
  setConfig(ss, {
    clinica_nome:    'Minha Clínica',
    clinica_telefone: '(11) 99999-0000',
    clinica_email:   '',
    email_clinica:   '',
    token:           SECRET_TOKEN,
    versao:          '1.0',
    criado_em:       new Date().toLocaleString('pt-BR'),
  });

  // Profissionais de exemplo
  createRow(ss, SHEETS.profissionais, {
    nome: 'Dr. João Silva', especialidade: 'Clínico Geral',
    cor: '3b82f6', inicio: '08:00', fim: '18:00', duracao: 60, ativo: true
  });

  SpreadsheetApp.getUi().alert('✅ AgendaFácil configurado!\n\nAgora faça a implantação como Aplicativo da Web e cole a URL no app.');
}

// ============================================================
// MENU PERSONALIZADO NO GOOGLE SHEETS
// ============================================================
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🗓️ AgendaFácil')
    .addItem('⚙️ Configurar Planilha', 'setupPlanilha')
    .addItem('📊 Ver Estatísticas', 'mostrarEstatisticas')
    .addItem('🗑️ Limpar Dados de Teste', 'limparDadosTeste')
    .addToUi();
}

function mostrarEstatisticas() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const stats = getDashboardStats(ss);
  SpreadsheetApp.getUi().alert(
    `📊 Estatísticas de Hoje\n\n` +
    `Agendamentos hoje: ${stats.hoje}\n` +
    `Esta semana: ${stats.semana}\n` +
    `Pacientes: ${stats.pacientes}\n` +
    `Profissionais: ${stats.profissionais}`
  );
}

function limparDadosTeste() {
  const ui = SpreadsheetApp.getUi();
  const resp = ui.alert('⚠️ Atenção!', 'Isso apagará TODOS os dados de teste. Continuar?', ui.ButtonSet.YES_NO);
  if (resp !== ui.Button.YES) return;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  [SHEETS.agendamentos, SHEETS.pacientes, SHEETS.prontuarios].forEach(name => {
    const sheet = ss.getSheetByName(name);
    if (sheet && sheet.getLastRow() > 1) {
      sheet.deleteRows(2, sheet.getLastRow() - 1);
    }
  });
  ui.alert('✅ Dados de teste removidos!');
}
