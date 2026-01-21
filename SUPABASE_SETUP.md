# Setup Supabase Storage & Edge Function

## 1. Upload Script to Supabase Storage

1. Vai su https://supabase.com/dashboard/project/dohrkonencbwvvmklzuo/storage/buckets
2. Crea bucket "scripts" (se non esiste):
   - Nome: `scripts`
   - Public: ✅ YES
3. Upload file:
   - Vai nel bucket "scripts"
   - Upload `public/cro-tracker.js`
   - Nome file: `cro-tracker.js`
4. Verifica URL pubblico: `https://dohrkonencbwvvmklzuo.supabase.co/storage/v1/object/public/scripts/cro-tracker.js`

## 2. Deploy Edge Function

1. Vai su https://supabase.com/dashboard/project/dohrkonencbwvvmklzuo/functions
2. Clicca "Create a new function"
3. Nome: `track-event`
4. Copia il contenuto da `supabase/functions/track-event/index.ts`
5. Deploy

## 3. Test

Apri la console browser su digitalsellerschool.it e dovresti vedere:
```
[CRO Tracking] Initialized - Session: sess_xxxxx
[Funnel Tracker] Started - Funnel: xxx
[CRO Tracking] ✅ Sent 2 events
```

## Architettura (Come il competitor)

```
GoHighLevel/Cliente
    ↓
Loader Script (inline)
    ↓
https://dohrkonencbwvvmklzuo.supabase.co/storage/v1/object/public/scripts/cro-tracker.js
    ↓
https://dohrkonencbwvvmklzuo.supabase.co/functions/v1/track-event
    ↓
Supabase Database (tracking_events, tracking_sessions)
```

**TUTTO sullo stesso dominio Supabase = ZERO problemi CORS**
