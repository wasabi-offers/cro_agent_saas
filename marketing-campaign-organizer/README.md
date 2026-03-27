# Marketing Campaign Organizer 🚀

Un tool completo per organizzare campagne marketing: dalla scrittura del copy, editing, review, lancio fino all'analisi delle performance.

## 🎯 Funzionalità Principali

### 1. Dashboard Campagne
- **Panoramica completa** di tutte le campagne
- **Filtri per stato**: Draft, In Editing, In Review, Approved, Launched, Analyzing, Completed
- **Quick stats** con metriche aggregate
- **Quick actions** per creare nuove campagne o vedere analytics

### 2. Gestione Copy con Workflow Stati
- ✍️ **Draft** - Scrittura iniziale del copy
- ✏️ **In Editing** - Revisione e miglioramento
- 👁️ **In Review** - Approvazione team/stakeholder
- ✅ **Approved** - Pronto per il lancio
- 🚀 **Launched** - Campagna attiva
- 📊 **Analyzing** - Analisi performance post-lancio
- ✔️ **Completed** - Campagna conclusa

### 3. AI Assistant per Copywriting (Claude)
- **Generazione automatica** di copy persuasivi
- **Miglioramento copy esistente** (CTR, engagement, clarity, persuasion)
- **Supporto multi-canale**: Email, Social, Ads, SMS
- **Tone of Voice personalizzabile**
- **Ottimizzazione per conversioni**

### 4. Sistema di Review & Approvazioni
- **Feedback strutturato** con rating e commenti
- **Inline comments** sul copy
- **Approvazioni multi-livello**
- **History completa** delle modifiche

### 5. Analytics Post-Lancio
- **Metriche chiave**: Impressions, CTR, Conversion Rate, ROI
- **Performance per campagna**
- **Revenue tracking** e cost analysis
- **Trend analysis** e confronti

### 6. Multi-Channel Support
- 📧 **Email** - Subject lines, body, CTA
- 📱 **Social** - Post copy, headlines, descriptions
- 📢 **Ads** - Google Ads, Facebook Ads copy
- 💬 **SMS** - Short copy optimized
- 🔄 **Other** - Flexible per altri canali

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **AI**: Anthropic Claude API (Sonnet 4)
- **Icons**: Lucide React
- **Date handling**: date-fns

## 📦 Installazione

1. **Clona il repository**
```bash
cd marketing-campaign-organizer
```

2. **Installa le dipendenze**
```bash
npm install
```

3. **Configura le variabili d'ambiente**
Copia `.env.example` in `.env` e aggiungi le tue chiavi:
```bash
cp .env.example .env
```

Poi modifica `.env`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

4. **Crea il database Supabase**
Esegui lo schema SQL su Supabase:
```bash
# Vai su Supabase Dashboard > SQL Editor
# Copia e incolla il contenuto di supabase-schema.sql
```

5. **Avvia il server di sviluppo**
```bash
npm run dev
```

L'applicazione sarà disponibile su `http://localhost:3001`

## 📊 Database Schema

### Tabelle Principali

1. **campaigns** - Anagrafica campagne
   - Informazioni base (titolo, descrizione, canale)
   - Stati workflow
   - KPI target
   - Date lancio

2. **campaign_copy** - Versioni del copy
   - Content versioning
   - AI generation tracking
   - Tone of voice
   - Tipo di copy (headline, body, CTA, etc.)

3. **campaign_reviews** - Feedback e approvazioni
   - Review status
   - Commenti e rating
   - Inline annotations

4. **campaign_analytics** - Metriche performance
   - Daily metrics
   - CTR, conversion rate, ROI
   - Custom metrics

5. **campaign_assets** - File allegati
6. **campaign_comments** - Discussioni

## 🚀 Come Usare

### 1. Creare una Nuova Campagna
1. Click su "Nuova Campagna" dalla dashboard
2. Compila informazioni base (titolo, canale, target audience)
3. Definisci obiettivi e KPI target
4. Salva come Draft

### 2. Scrivere il Copy
1. Apri la campagna
2. Usa "Genera con AI" per copy automatico, oppure
3. Scrivi manualmente il copy
4. Salva e passa a "In Editing"

### 3. Review Process
1. Invita reviewer
2. Ricevi feedback e rating
3. Applica modifiche suggerite
4. Ottieni approvazione finale

### 4. Lancio e Analytics
1. Approva la campagna
2. Lancia su canale selezionato
3. Monitora analytics in tempo reale
4. Ottimizza basato sui dati

## 🤖 API Endpoints

### POST `/api/generate-copy`
Genera copy con AI Claude

**Request:**
```json
{
  "copyType": "subject_line",
  "channel": "email",
  "toneOfVoice": "friendly",
  "targetAudience": "Millennials interessati a tech",
  "objectives": "Aumentare open rate"
}
```

**Response:**
```json
{
  "success": true,
  "copy": "🚀 Scopri le novità tech che cambieranno la tua giornata",
  "metadata": {
    "model": "claude-sonnet-4",
    "tokens": {...}
  }
}
```

### POST `/api/improve-copy`
Migliora copy esistente

**Request:**
```json
{
  "currentCopy": "Compra ora i nostri prodotti",
  "improvementType": "persuasion",
  "context": "E-commerce moda"
}
```

## 📈 Roadmap

- [ ] Integrazione calendario per scheduling
- [ ] A/B testing variants automatici
- [ ] Export report PDF
- [ ] Integrazione con piattaforme email (Mailchimp, SendGrid)
- [ ] Social media scheduling
- [ ] Team collaboration features
- [ ] Analytics avanzati con ML predictions
- [ ] Mobile app

## 🎨 Screenshots

*(Aggiungi screenshots quando l'app è in produzione)*

## 📝 License

Proprietario - Marketing Campaign Organizer v1.0.0

## 🤝 Contributi

Questo è un progetto privato. Per feature requests o bug reports, apri una issue.

## 📧 Supporto

Per supporto, contatta il team di sviluppo.

---

**Built with ❤️ using Next.js, Claude AI, and Supabase**
