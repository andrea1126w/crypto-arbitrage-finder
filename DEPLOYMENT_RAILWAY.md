# 🚀 Guida Deployment Railway.app (Server Europa)

## ✅ Vantaggi Railway
- 🌍 **Server Europa** (Belgio/Londra) - No geo-blocking
- 💰 **$5/mese** ($5 gratis primo mese)
- ⚡ **5 minuti** setup totale
- 🔒 **PostgreSQL** incluso gratis
- ✅ **KuCoin & Bybit** funzioneranno!

---

## 📋 PASSO 1: Crea Account Railway

1. Vai su **https://railway.app**
2. Clicca **"Login with GitHub"**
3. Autorizza Railway ad accedere ai tuoi repository

---

## 📋 PASSO 2: Esporta Progetto da Replit a GitHub

### A) Crea Repository GitHub:
1. Vai su **https://github.com/new**
2. Nome repository: `crypto-arbitrage-finder`
3. Privacy: **Public** o **Private** (a tua scelta)
4. **NON** aggiungere README, .gitignore, o license
5. Clicca **"Create repository"**

### B) Collega Replit a GitHub:
1. **In Replit**, apri la **Shell** (tab in basso)
2. Esegui questi comandi (sostituisci `TUO-USERNAME` con il tuo username GitHub):

```bash
# Configura git (solo prima volta)
git config --global user.email "tua-email@example.com"
git config --global user.name "Tuo Nome"

# Aggiungi remote GitHub
git remote add github https://github.com/TUO-USERNAME/crypto-arbitrage-finder.git

# Push del codice
git push github main
```

3. **Inserisci le credenziali GitHub** quando richiesto
   - Username: il tuo username GitHub
   - Password: usa un **Personal Access Token** (non la password normale)
     - Crea token qui: https://github.com/settings/tokens
     - Scope necessari: `repo` (full control)

---

## 📋 PASSO 3: Deploy su Railway

### A) Crea Nuovo Progetto:
1. In Railway, clicca **"New Project"**
2. Seleziona **"Deploy from GitHub repo"**
3. Scegli il repository **`crypto-arbitrage-finder`**
4. Railway inizierà il build automaticamente

### B) Seleziona Regione Europa:
1. Clicca sul servizio appena creato
2. Vai su **"Settings"**
3. Scorri fino a **"Region"**
4. Seleziona **"eu-west"** (Europa - Belgio)
5. Clicca **"Save"**

### C) Aggiungi PostgreSQL:
1. Nel progetto Railway, clicca **"+ New"**
2. Seleziona **"Database"**
3. Scegli **"PostgreSQL"**
4. Railway crea il database automaticamente

### D) Configura Variabili d'Ambiente:
1. Clicca sul servizio principale (non il database)
2. Vai su **"Variables"**
3. Aggiungi queste variabili:

| Nome | Valore |
|------|--------|
| `NODE_ENV` | `production` |
| `SESSION_SECRET` | `il-tuo-session-secret-da-replit` |
| `DATABASE_URL` | *(Railway la collega automaticamente)* |

**IMPORTANTE**: Railway collegherà automaticamente `DATABASE_URL` dal PostgreSQL.

### E) Copia Credenziali Exchange dal DB Replit:

Le tue credenziali exchange sono già salvate nel database Replit (criptate).
Hai 2 opzioni:

**Opzione 1: Riconfigura su Railway (consigliato)**
- Dopo il deployment, apri l'app Railway
- Vai su "QuickConnect"
- Inserisci di nuovo le credenziali KuCoin/Bybit
- Verranno salvate nel nuovo database Railway

**Opzione 2: Esporta/Importa Database**
- Esporta il DB da Replit (con `pg_dump`)
- Importa su Railway PostgreSQL
- *(Procedura avanzata - chiedi se serve aiuto)*

---

## 📋 PASSO 4: Verifica Deployment

### A) Apri l'App:
1. In Railway, clicca **"Settings"**
2. Nella sezione **"Domains"**, clicca **"Generate Domain"**
3. Railway genera un URL tipo: `crypto-arbitrage-finder.up.railway.app`
4. Clicca sull'URL per aprire l'app

### B) Testa Connessione Exchange:
1. Nell'app, vai su **"Auto-Rebalancing"**
2. Clicca **"Refresh Balances"**
3. Dovresti vedere:
   ```
   ✅ KuCoin: $XXX.XX
   ✅ Bybit: $XXX.XX
   ```

Se funziona, **CE L'HAI FATTA!** 🎉

---

## 💰 COSTI

- **Primo mese**: $0 (hai $5 gratis)
- **Successivi**: ~$5/mese
- Include: Hosting + PostgreSQL + SSL

---

## 🆘 PROBLEMI COMUNI

### "Build failed":
- Controlla i logs in Railway
- Verifica che `package.json` abbia lo script `"start"`

### "Database connection error":
- Railway collega automaticamente `DATABASE_URL`
- Aspetta che il DB sia pronto (1-2 minuti dopo creazione)

### "Exchange ancora bloccato":
- Verifica che la regione sia **"eu-west"** nelle impostazioni
- Controlla l'IP del server nei logs Railway

---

## 📞 SUPPORTO

Se hai problemi, fammi sapere! Posso aiutarti con:
- ✅ Configurazione GitHub/Railway
- ✅ Debug errori deployment
- ✅ Export/import database
- ✅ Setup custom domain

---

**Pronto per iniziare? Segui PASSO 1!** 🚀
