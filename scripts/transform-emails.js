/**
 * Script per trasformare temp_hystoric_data.json → SQL per Supabase
 * Esegui con: node scripts/transform-emails.js
 */

const fs = require('fs');
const path = require('path');

// ============= FUNZIONI DI UTILITY =============

// Funzione per estrarre in sicurezza valori nested
function safeGet(obj, pathStr, defaultValue = null) {
  try {
    const keys = pathStr.split('.');
    let result = obj;
    for (const key of keys) {
      if (key.includes('[')) {
        const match = key.match(/(\w+)\[(\d+)\]/);
        if (match) {
          result = result[match[1]][parseInt(match[2])];
        }
      } else {
        result = result[key];
      }
      if (result === undefined || result === null) return defaultValue;
    }
    return result;
  } catch (e) {
    return defaultValue;
  }
}

// Funzione per estrarre status da authentication-results
function extractAuthStatus(authResults, type) {
  if (!authResults) return null;
  const regex = new RegExp(`${type}=(\\w+)`, 'i');
  const match = authResults.match(regex);
  return match ? match[1] : null;
}

// Funzione per pulire header value (rimuove prefisso tipo "Delivered-To: ")
function cleanHeaderValue(value) {
  if (!value) return null;
  const colonIndex = value.indexOf(':');
  if (colonIndex > 0 && colonIndex < 30) {
    return value.substring(colonIndex + 1).trim();
  }
  return value.trim();
}

// Escape per stringhe SQL
function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  if (typeof str !== 'string') str = String(str);
  // Escape single quotes raddoppiandole
  return "'" + str.replace(/'/g, "''") + "'";
}

// Escape per JSONB
function escapeJsonb(obj) {
  if (obj === null || obj === undefined) return 'NULL';
  try {
    const jsonStr = JSON.stringify(obj);
    return "'" + jsonStr.replace(/'/g, "''") + "'::jsonb";
  } catch (e) {
    return 'NULL';
  }
}

// ============= MAPPER PRINCIPALE =============

function mapEmail(email) {
  // Headers - gestisci sia formato oggetto che array
  let headers = {};
  if (email.headers) {
    if (Array.isArray(email.headers)) {
      // Gmail API restituisce array di {name, value}
      email.headers.forEach(h => {
        headers[h.name.toLowerCase()] = h.value;
      });
    } else {
      // Headers come oggetto - normalizza le chiavi
      for (const [key, value] of Object.entries(email.headers)) {
        headers[key.toLowerCase()] = value;
      }
    }
  }

  // Estrai body
  let textBody = email.text || null;
  let htmlBody = email.html || null;
  let textAsHtml = email.textAsHtml || null;

  // Se il body è nella struttura Gmail API
  if (email.payload) {
    const payload = email.payload;

    // Cerca il body nelle parts
    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          textBody = Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
        if (part.mimeType === 'text/html' && part.body?.data) {
          htmlBody = Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
      }
    } else if (payload.body?.data) {
      // Body diretto
      const decoded = Buffer.from(payload.body.data, 'base64').toString('utf-8');
      if (payload.mimeType === 'text/html') {
        htmlBody = decoded;
      } else {
        textBody = decoded;
      }
    }

    // Headers da payload
    if (payload.headers && Array.isArray(payload.headers)) {
      payload.headers.forEach(h => {
        headers[h.name.toLowerCase()] = h.value;
      });
    }
  }

  // Labels processing
  const labelIds = email.labelIds || [];
  const labelsString = Array.isArray(labelIds) ? labelIds.join(",") : String(labelIds);

  // Estrai from/to dai campi strutturati
  let fromName = safeGet(email, 'from.value[0].name', null);
  let fromEmail = safeGet(email, 'from.value[0].address', null);
  let toName = safeGet(email, 'to.value[0].name', null);
  let toEmail = safeGet(email, 'to.value[0].address', null);
  let replyTo = safeGet(email, 'replyTo.value[0].address', null);

  // Fallback: estrai da headers
  if (!fromEmail && headers['from']) {
    const fromHeader = cleanHeaderValue(headers['from']);
    const fromMatch = fromHeader?.match(/<([^>]+)>/) || fromHeader?.match(/([^\s<]+@[^\s>]+)/);
    if (fromMatch) fromEmail = fromMatch[1];
    const nameMatch = fromHeader?.match(/^"?([^"<]+)"?\s*</);
    if (nameMatch) fromName = nameMatch[1].trim();
  }

  if (!toEmail && headers['to']) {
    const toHeader = cleanHeaderValue(headers['to']);
    const toMatch = toHeader?.match(/<([^>]+)>/) || toHeader?.match(/([^\s<]+@[^\s>]+)/);
    if (toMatch) toEmail = toMatch[1];
  }

  if (!replyTo && headers['reply-to']) {
    const replyHeader = cleanHeaderValue(headers['reply-to']);
    const replyMatch = replyHeader?.match(/<([^>]+)>/) || replyHeader?.match(/([^\s<]+@[^\s>]+)/);
    if (replyMatch) replyTo = replyMatch[1];
  }

  // Authentication results
  const authResults = headers["authentication-results"] || "";

  // Mailgun variables parsing
  let mailgunVars = null;
  if (headers["x-mailgun-variables"]) {
    try {
      let varString = cleanHeaderValue(headers["x-mailgun-variables"]);
      // Rimuovi newline e spazi extra
      varString = varString.replace(/\r?\n/g, '').replace(/\s+/g, ' ');
      mailgunVars = JSON.parse(varString);
    } catch (e) {
      mailgunVars = null;
    }
  }

  // MAPPING COMPLETO
  return {
    id: email.id || null,
    thread_id: email.threadId || null,
    message_id: email.messageId || cleanHeaderValue(headers['message-id']) || null,
    subject: email.subject || cleanHeaderValue(headers['subject']) || null,
    date: email.date || cleanHeaderValue(headers['date']) || null,
    text_body: textBody,
    html_body: htmlBody,
    text_as_html: textAsHtml,
    from_name: fromName,
    from_email: fromEmail,
    to_name: toName,
    to_email: toEmail,
    reply_to: replyTo,
    labels: labelsString,
    is_read: !labelIds.includes('UNREAD'),
    is_inbox: labelIds.includes('INBOX'),
    is_promotional: labelIds.includes('CATEGORY_PROMOTIONS'),
    is_spam: labelIds.includes('SPAM'),
    delivered_to: cleanHeaderValue(headers["delivered-to"]) || null,
    return_path: cleanHeaderValue(headers["return-path"]) || null,
    sender: cleanHeaderValue(headers["sender"]) || null,
    mime_version: cleanHeaderValue(headers["mime-version"]) || null,
    content_type: cleanHeaderValue(headers["content-type"]) || null,
    dkim_status: extractAuthStatus(authResults, 'dkim'),
    spf_status: extractAuthStatus(authResults, 'spf'),
    arc_status: headers["arc-seal"] ? 'present' : null,
    mailgun_sending_ip: cleanHeaderValue(headers["x-mailgun-sending-ip"]) || null,
    mailgun_tag: cleanHeaderValue(headers["x-mailgun-tag"]) || null,
    mailgun_sid: cleanHeaderValue(headers["x-mailgun-sid"]) || null,
    mailgun_variables: mailgunVars,
    list_unsubscribe_url: headers["list-unsubscribe"]
      ? cleanHeaderValue(headers["list-unsubscribe"]).replace(/[<>]/g, '')
      : null
  };
}

// ============= GENERAZIONE SQL =============

function generateInsertSql(mappedEmail) {
  const columns = [
    'id', 'thread_id', 'message_id', 'subject', 'date',
    'text_body', 'html_body', 'text_as_html',
    'from_name', 'from_email', 'to_name', 'to_email', 'reply_to',
    'labels', 'is_read', 'is_inbox', 'is_promotional', 'is_spam',
    'delivered_to', 'return_path', 'sender', 'mime_version', 'content_type',
    'dkim_status', 'spf_status', 'arc_status',
    'mailgun_sending_ip', 'mailgun_tag', 'mailgun_sid', 'mailgun_variables',
    'list_unsubscribe_url'
  ];

  const values = columns.map(col => {
    const val = mappedEmail[col];
    
    // Gestione booleani
    if (typeof val === 'boolean') {
      return val ? 'TRUE' : 'FALSE';
    }
    
    // Gestione JSONB
    if (col === 'mailgun_variables') {
      return escapeJsonb(val);
    }
    
    // Gestione NULL
    if (val === null || val === undefined) {
      return 'NULL';
    }
    
    // Gestione stringhe
    return escapeSql(val);
  });

  return `(${values.join(', ')})`;
}

// ============= MAIN =============

async function main() {
  console.log('📧 Email Transformer - JSON → SQL per Supabase\n');

  // Leggi il file JSON
  const inputPath = path.join(__dirname, '..', 'temp_hystoric_data.json');
  const outputSqlPath = path.join(__dirname, '..', 'import_emails.sql');

  console.log(`📂 Lettura: ${inputPath}`);

  let rawData;
  try {
    rawData = fs.readFileSync(inputPath, 'utf-8');
  } catch (e) {
    console.error('❌ Errore lettura file:', e.message);
    process.exit(1);
  }

  let emails;
  try {
    emails = JSON.parse(rawData);
  } catch (e) {
    console.error('❌ Errore parsing JSON:', e.message);
    process.exit(1);
  }

  if (!Array.isArray(emails)) {
    emails = [emails];
  }

  console.log(`📬 Trovate ${emails.length} email da processare\n`);

  // Trasforma le email
  const mappedEmails = [];
  const errors = [];

  for (let i = 0; i < emails.length; i++) {
    try {
      const mapped = mapEmail(emails[i]);
      mappedEmails.push(mapped);
      
      if ((i + 1) % 100 === 0) {
        console.log(`   Processate ${i + 1}/${emails.length} email...`);
      }
    } catch (e) {
      errors.push({ index: i, id: emails[i]?.id, error: e.message });
    }
  }

  console.log(`\n✅ Trasformate: ${mappedEmails.length} email`);
  if (errors.length > 0) {
    console.log(`⚠️  Errori: ${errors.length}`);
  }

  // Genera SQL
  console.log('\n📝 Generazione SQL...');

  const columns = [
    'id', 'thread_id', 'message_id', 'subject', 'date',
    'text_body', 'html_body', 'text_as_html',
    'from_name', 'from_email', 'to_name', 'to_email', 'reply_to',
    'labels', 'is_read', 'is_inbox', 'is_promotional', 'is_spam',
    'delivered_to', 'return_path', 'sender', 'mime_version', 'content_type',
    'dkim_status', 'spf_status', 'arc_status',
    'mailgun_sending_ip', 'mailgun_tag', 'mailgun_sid', 'mailgun_variables',
    'list_unsubscribe_url'
  ];

  // Suddividi in batch da 10 per evitare query troppo grandi per Supabase Cloud
  const BATCH_SIZE = 10;
  const totalBatches = Math.ceil(mappedEmails.length / BATCH_SIZE);
  
  // Crea cartella per i batch
  const batchDir = path.join(__dirname, '..', 'sql_batches');
  if (!fs.existsSync(batchDir)) {
    fs.mkdirSync(batchDir, { recursive: true });
  }

  // Genera file separati per ogni batch
  for (let i = 0; i < mappedEmails.length; i += BATCH_SIZE) {
    const batch = mappedEmails.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const batchFileName = `batch_${String(batchNum).padStart(3, '0')}.sql`;
    const batchPath = path.join(batchDir, batchFileName);

    let sqlContent = `-- Batch ${batchNum}/${totalBatches} (${batch.length} records)\n`;
    sqlContent += `INSERT INTO emails (${columns.join(', ')})\nVALUES\n`;

    const valuesList = batch.map(email => generateInsertSql(email));
    sqlContent += valuesList.join(',\n');
    sqlContent += `\nON CONFLICT (id) DO UPDATE SET\n`;
    
    // Genera UPDATE per tutti i campi tranne id
    const updateClauses = columns
      .filter(col => col !== 'id')
      .map(col => `  ${col} = EXCLUDED.${col}`);
    sqlContent += updateClauses.join(',\n');
    sqlContent += `,\n  updated_at = NOW();\n`;

    fs.writeFileSync(batchPath, sqlContent, 'utf-8');
  }

  console.log(`\n💾 File SQL salvati in: ${batchDir}`);
  console.log(`   Totale batch: ${totalBatches} file`);
  console.log(`   (10 email per file)`);

  // Report errori se presenti
  if (errors.length > 0) {
    console.log('\n⚠️  Errori durante la trasformazione:');
    errors.slice(0, 10).forEach(e => {
      console.log(`   - Email #${e.index} (id: ${e.id}): ${e.error}`);
    });
    if (errors.length > 10) {
      console.log(`   ... e altri ${errors.length - 10} errori`);
    }
  }

  console.log('\n✨ Completato!');
  console.log('\n📋 Prossimi step:');
  console.log('   1. Crea la tabella su Supabase eseguendo: supabase_create_table.sql');
  console.log('   2. Importa i dati eseguendo: import_emails.sql');
}

main().catch(console.error);

