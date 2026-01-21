# Deploy Supabase Edge Function

## Deploy via Supabase Dashboard

1. Vai su https://supabase.com/dashboard/project/smwtkyvnmyetlektphyy/functions
2. Clicca "Create a new function"
3. Nome: `track-event`
4. Copia il contenuto di `track-event/index.ts`
5. Clicca "Deploy"

## Deploy via CLI (alternativo)

```bash
# Installa Supabase CLI
brew install supabase/tap/supabase

# Login
supabase login

# Link al progetto
supabase link --project-ref smwtkyvnmyetlektphyy

# Deploy
supabase functions deploy track-event
```

## Test

```bash
curl -X POST https://smwtkyvnmyetlektphyy.supabase.co/functions/v1/track-event \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"events": [{"type": "pageview", "sessionId": "test", "timestamp": "2024-01-01T00:00:00Z"}]}'
```
