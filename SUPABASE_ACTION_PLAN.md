# 🚀 Supabase Optimizace - Co Dělat Teď

## Shrnutí Implementovaných Změn

✅ **Cache TTL**: 1 min → 30 min  
✅ **Query Limity**: Bez limitů → 100-1000 řádků  
✅ **SELECT Sloupce**: * → Jen potřebné  
✅ **Image Komprese**: 80% kvalita na upload  

**Dopad**: ~5GB/měsíc → ~1-2GB/měsíc

---

## 🎯 AKCE BUDEME DĚLAT TEĎ (DŮLEŽITÉ!)

### 1. ⚠️ Zkomprimovat Existující Obrázky (NEJDŮLEŽITĚJŠÍ)

**Proč**: Už máte velké obrázky v Storage z minula. Ty se budou posílat v plném rozlišení.

**Co Dělat**:

#### Option A: macOS (ImageOptim) - NEJJEDNODUŠŠÍ
```bash
# Stáhnout všechny soubory z Supabase Storage
# 1. Jit do Supabase Dashboard → Storage
# 2. Vybrat všechny soubory
# 3. Stáhnout (Download)

# 2. Otevřít Download složku, instaluji ImageOptim:
# https://imageoptim.com/
# Drag & drop všechny obrázky do ImageOptim okna
# Optimalizuje je automaticky
```

#### Option B: Příkazová řádka (ImageMagick) - NEJRYCHLEJŠÍ
```bash
# Nainstalovat ImageMagick:
brew install imagemagick  # macOS
# sudo apt-get install imagemagick  # Linux
# choco install imagemagick  # Windows

# Zkomprimovat všechny obrázky:
cd ~/Downloads/images
mogrify -quality 80 -resize 2000x2000\> *.jpg *.jpeg
mogrify -quality 80 -resize 2000x2000\> *.png

# -quality 80 = 80% JPEG kvalita
# -resize 2000x2000\> = max šířka/výška 2000px, bez zvětšování pokud je menší
```

#### Option C: Web Tool (pokud máte málo obrázků)
Jít na https://compressor.io/ a uploadovat všechny obrázky po jednom.

### 2. Re-uploadnout Zkomprimované Obrázky

Jakmile máte zkomprimované obrázky:

```
1. V Adminu jít na "Soubory & Média"
2. Smazat všechny staré obrázky
3. Re-uploadovat zkomprimované verze
```

---

## 📊 Jak Sledovat Pokrok

### Supabase Usage Dashboard
```
1. Jít na https://supabase.com/dashboard
2. Kliknut na váš projekt
3. Jít na záložku "Usage"
4. Podívat se na "Cached Egress" graf
5. Sledovat trend - měl by klesnout
```

### Čtení Grafu:
- **Zeleně**: Pod limitem ✅
- **Žlutě**: Blízko limitu ⚠️
- **Červeně**: Překročeno ❌

### Network Traffic v Browseru
```
1. Otevřít web v Chromu/Firefoxu
2. Zmáčknout F12 (Developer Tools)
3. Jít na "Network" tab
4. Kliknut na stránku "Projects" / "Blog"
5. Hledat Supabase requesty (zelené XHR čáry)
6. Kliknut a podívat se na "Size"

Cíl:
- Responses < 500KB (optimální)
- Responses < 1MB (OK)
- Responses > 1MB (příliš velké!)
```

---

## 🔍 Diagnostika

### Co Se Vám Zvýšilo v Supabase?

**Pokud jste překročili limit, podívejte se na:**

```bash
1. Storage Files Size:
   Dashboard → Storage → Files
   Jaké Files mají nejvíc GB?
   ↓
   Ty jsou pravděpodobně obrázky.

2. Database Size:
   Dashboard → Database → Backups & Stats
   Kolik GB má celková database?
   ↓
   Pokud > 500MB, máte moc dat (nebo obrázky jako JSON).

3. API Usage:
   Dashboard → Usage → API Requests
   Kolik requestů jste dělali v posledním měsíci?
   ↓
   S 30min cache by mělo být < 100k requestů.
```

---

## ❓ Nejčastější Problémy

### Problém: Obrázky Se Pořád Posílají Velké
**Řešení**: 
- Zkomprimovat obrázky (viz výše)
- Smazat staré obrázky z Storage
- Upgradovat Supabase plán (pokud chcete více dat)

### Problém: Cache Nefunguje (vidím stejná data pořád)
**Řešení**:
- Otevřít DevTools → Application → Local Storage
- Najít `jakub_minka_*` klíče
- Smazat je
- Refreshnout stránku (F5)

### Problém: Admin Nevidí Změny Okamžitě
**Řešení**:
- To je normální s 30min cachez
- Admin má `{ force: true }` na všech dotazech → vidí vždy fresh data
- Pokud ne, zkuste refresh (F5)

### Problém: Novožádaná Recenze/Projekt Se Nezobrazuje
**Řešení**:
- V Recenzích: Kликнout "Načíst výchozí" tlačítko
- Cache se invaliduje po save → měl by se zobrazit do 1 minuty
- Pokud ne, zkontrolovat Browser Console (F12) na chyby

---

## 🎓 Jak To Teď Funguje

### Při Prvním Pohledu
```
1. Uživatel jde na web
2. App posílá dotazy do Supabase:
   - Projekty (SELECT ... LIMIT 100)
   - Blog (SELECT ... LIMIT 100)
   - Partnery + Recenze
3. Data se cachují v localStorage na 30 minut
4. Web se zobrazuje
```

### Když Se Vrátí Do 30 Minut
```
1. App kontroluje localStorage
2. Cache je fresh (< 30 minut) → vrátí z cache
3. ŽÁDNÝ dotaz do Supabase ✅
4. Velmi rychle ✨
```

### V Adminu
```
1. Vždy jde přes `{ force: true }` → přeskakuje cache
2. Admin vždy vidí nejnovější data
3. Po každém save se cache invaliduje
4. Public stránky se uktualizují během 30 minut
```

---

## 💡 Extra Tips

### Chcete-li Mrtvý Cache (Okamžité Refreshování)
Pokud chcete, aby se změny projevily hned na public stránce (bez čekání na 30 minut):
```typescript
// lib/db.ts
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minut místo 30
```

**Trade-off**: Více dotazů do Supabase (až 6x víc) = vyšší spotřeba

### Chcete-li Nižší Spotřebu (30 dní Cache)
```typescript
// lib/db.ts
const DEFAULT_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dní
```

**Trade-off**: Když upravíte projekt v adminu, veřejná stránka to uvidí až po 30 dnech

### Sledovat Supabase v Real-Time
```typescript
// lib/db.ts - něco jako:
const logSupabaseUsage = () => {
  const usage = {
    cacheHits: localStorage.getItem('cache_hits') || 0,
    supabaseRequests: localStorage.getItem('supabase_requests') || 0,
  };
  console.log('Cache effectiveness:', usage);
};
```

---

## 🚨 Pokud Potřebujete Urgentně Snížit Spotřebu

1. **Smazat všechny staré obrázky** z Storage
2. **Vypnout WebSockets/Real-time** (pokud máte)
3. **Snížit cache na 5 minut** až do zlepšení
4. **Zvážit upgrade na Pro plán** ($25/měsíc)

---

## 📞 Support

Wenn máte otázky:
1. Podívejte se do `SUPABASE_OPTIMIZATION.md` (detailní technické info)
2. Zkontrolujte Supabase Logs:`Dashboard → Logs → Postgres`
3. Podívejte se na Network tab v DevTools

---

**Hotovo! 🎉**

S těmito změnami by jste měli být pod 2GB/měsíc Cached Egress limitom.  
Pokud problém přetrvá, nejpravděpodobněji je to kvůli velkým obrázkům v Storage - zkomprimujte je!
