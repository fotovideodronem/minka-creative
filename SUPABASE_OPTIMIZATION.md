# Optimalizace Supabase pro Free Tier (5GB Cached Egress Limit)

## Status
- **Limit**: 5 GB Cached Egress (měsíčně)
- **Aktuální**: ~5.02 GB (překročeno o 0.02 GB)
- **Řešení**: Implementovány níže uvedené optimalizace

## Implementované Optimalizace

### 1. Cache TTL (✅ Completed)
- **Změna**: 1 minuta → 30 minut
- **Dopad**: 30x snížení dotazů u uživatelů s cookies
- **Umístění**: `lib/db.ts` - `DEFAULT_CACHE_TTL_MS`

```typescript
const DEFAULT_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minut
```

Jakmile si uživatel načte data, mají cached na 30 minut. Pokud se vrátí během tohoto času, nic z Supabase se nenačítá.

### 2. Limity na SELECT Dotazy (✅ Completed)
- **BlogDB**: `.limit(100)` - poslední 100 článků
- **ProjectDB**: `.limit(100)` - poslední 100 projektů
- **MediaDB**: `.limit(500)` - poslední 500 souborů
- **DataStore**: `.limit(1000)` - ostatní tabulky

- **Dopad**: Zabraní načítání tisíců řádků
- **Umístění**: `lib/db.ts` - v getAll() metodách

### 3. Omezení Sloupců v SELECT (✅ Completed)
- **Staré**: `SELECT *` (všechny sloupce)
- **Nové**: Pouze potřebné sloupce
  - **Blog**: `id, title, excerpt, content, image_url, author, date, created_at`
  - **Projects**: `id, title, short_description, category, category_id, type, date, thumbnail_url, gallery, created_at`
  - **Media**: `id, name, type, url, parent_id, created_at`

- **Dopad**: Snížení velikosti odpovědi o ~30-50%
- **Umístění**: `lib/db.ts` - v getAll() metodách

## Automatické Optimalizace pro Obrázky

### Upload Optimizace
Při uploadování v adminu jsou obrázky automaticky kompilovány:
- **Kvalita**: 80% (default) - lze změnit v FileManagerV2
- **Maximální šířka**: 2000px
- **Format**: JPEG

V FileManagerV2 si můžete nastavit vlastní kvalitu:
```typescript
const quality = parseFloat(localStorage.getItem('jakub_minka_compression_quality') || '0.8');
// Jiné obrázky se uploadují s kvalitou 80%
```

### Co Dělat s Existujícími Obrázky (❗ RECOMMENDED)

Máte dva volby:

#### Volba 1: Manuální Komprimace (doporučeno)
1. Stáhněte všechny obrázky z Supabase Storage
2. Zkomprimujte je pomocí:
   - [ImageOptim](https://imageoptim.com/) (macOS)
   - [FileOptimizer](https://nikkhokkho.sourceforge.io/static.php?page=FileOptimizer) (Windows)
   - [ImageMagick](https://imagemagick.org/) (Linux)
     ```bash
     mogrify -quality 80 -resize 2000x2000 *.jpg
     ```
3. Znovu uploadujte do Storage

#### Volba 2: Cloudinary/Vercel Image Optimization
Pokud máte přístup, použijte external image CDN:
```html
<!-- Namísto -->
<img src="supabase-storage-url" />

<!-- Použijte -->
<img src="https://cdn.example.com/image.jpg?quality=80&width=1200" />
```

## Dopad Těchto Optimalizací

### Před Optimalizací
- 1-minutový cache → každého uživatele 1000+ dotazů za měsíc
- SELECT * → velké odpovědi
- Bez limitů → možné načítání milionů řádků
- **Odhad**: 5+ GB/měsíc

### Po Optimalizací
- 30-minutový cache → 200 dotazů za měsíc na uživatele
- Omezené sloupce → odpovědi 30-50% menší
- Limity → max 500-1000 řádků
- Obrázky: 80% kvalita
- **Odhad**: 1-2 GB/měsíc ✅

## Monitorování

### Jak Kontrolovat Spotřebu?
1. Přejděte na [Supabase Dashboard](https://supabase.com/dashboard)
2. Vyberte projekt
3. Jděte na **Usage** → **Cached Egress**
4. Zkontrolujte trend

### Ke Kterým Dotazům Se Počítá Egress?
- ✅ SELECT dotazy z databáze
- ✅ Stahování souborů ze Storage
- ❌ INSERT/UPDATE/DELETE

### Co se NEPOČÍTÁ?
- ❌ Data ze cache (1. 30 minut)
- ❌ localStorage (místní cache v browseru)
- ❌ CloudFlare cache (pokud máte)

## Pokud Limit Přesto Překročíte

### Variantní 1: Upgrade na Pro Plan
- **Cena**: ~$25/měsíc
- **Limit**: 250 GB Cached Egress + přeplatky
- **Plus**: Lepší support, priority

### Variantní 2: Pokud Chcete Zůstat na Free
Další optimalizace:
- Vypnout real-time synchronizaci (pokud máte)
- Zmenšit obrázky ještě víc (60% kvalita)
- Použít doplňkový CDN (Cloudflare, Vercel)
- Implementovat server-side rendering (Next.js)

### Variantní 3: Hybrid Přístup
- Databáze v Supabase (jen pro admin)
- Obrázky v [AWS S3](https://aws.amazon.com/s3/) + CloudFront CDN
- Content v [Netlify CMS](https://www.netlifycms.org/)

## Performance Tips

### 1. Vypnout Refresh v Adminu Když Není Potřeba
V adminu jsou všechny getAll() volazy s `{ force: true }`, aby viděli changes okamžitě.
Pokud chcete snížit spotřebu, můžete to změnit:

```typescript
// Místo { force: true }, použít default cache:
await projectDB.getAll(); // Používá cache pokud je fresh
```

### 2. Lazy Loading Galerií
V projektových detailech se načítají všechny galerie. Pokud máte 100 projektů s 50 obrázky v každém, to je 5000 obrázků.
Řešení: Vykrodit jen thumbnail, ostatní načítavat on-demand.

### 3. Kontrolovat Network Tab v DevTools
```timing
1. Otevřete DevTools (F12)
2. Jděte na Network
3. Filtrujte "XHR"
4. Podívejte se na "Size" sloupec
5. Hledejte velké odpovědi
```

Pokud vidíte responses >1MB, máte problém.

## Checklist

- [x] Cache TTL na 30 minut
- [x] Limity na SELECT (100-1000 řádků)
- [x] Omezené sloupce (ne SELECT *)
- [x] Obrázky optimalizovány při upload (80% kvalita)
- [ ] Zkomprimovat existující obrázky (doporučeno)
- [ ] Kontrolovat Network tab v DevTools
- [ ] Nastavit Cache-Control headers (pokud máte custom domain)
- [ ] Zvážit upgrade na Pro/upgrade pokud spolupráce roste

## Kontakt / Help

Pokud se vám zdá, že spotřeba pořád roste, zkontrolujte:

1. **Supabase Logs**:
   ```
   Dashboard → Logs → Postgres
   ```

2. **Network Traffic**:
   ```
   Dev Tools → Network → Watch for big responses
   ```

3. **Storage Usage**:
   ```
   Dashboard → Storage → Files
   Total je kolik GB zabirá?
   ```

Pokud je Storage >1GB, obrázky vás "žerou" - zkomprimujte je!
