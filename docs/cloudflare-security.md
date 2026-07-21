# Cloudflare Security — настройка для Vertlix AI (Next.js на Vercel)

Cloudflare ставится **перед** Vercel как DNS + reverse-proxy. Он закрывает то,
чего нет на уровне приложения: сетевой DDoS (L3/4), глобальный WAF, бот-менеджмент
и rate limiting на edge — до того, как трафик вообще дойдёт до Vercel.

```
Пользователь ──▶ Cloudflare (WAF, DDoS, Bot, Rate Limit) ──▶ Vercel ──▶ Next.js
```

> В коде уже сделано: rate-limiting приложения теперь читает **`CF-Connecting-IP`**
> (`src/lib/middleware/rate-limit.ts` → `clientIp()`), иначе за прокси все запросы
> шли бы с одного IP и лимит не работал бы. Заголовки безопасности (CSP, HSTS и
> т.д.) заданы в `next.config.ts`.

---

## 0. Подключение домена (основа)

1. **Add a site** в Cloudflare → введи `vertlix.ai`, план **Free** достаточно для
   старта (Pro/Business — если нужен полноценный Bot Management и больше WAF-правил).
2. Смени NS-серверы домена у регистратора на те, что выдал Cloudflare.
3. В **DNS** оставь записи, указывающие на Vercel, в режиме **Proxied** (оранжевое
   облако ☁️) — именно оно включает защиту. Для домена на Vercel:
   - `CNAME @  → cname.vercel-dns.com`  (Proxied)
   - `CNAME www → cname.vercel-dns.com` (Proxied)
4. В Vercel → **Settings → Domains** добавь `vertlix.ai` и `www.vertlix.ai`.

### SSL/TLS (критично — иначе петли редиректов)
- **SSL/TLS → Overview → Full (strict)**. Не «Flexible» — оно ломает HTTPS и даёт
  бесконечные редиректы с Vercel (у Vercel всегда валидный сертификат).
- **Edge Certificates**:
  - **Always Use HTTPS** → **On** (это и есть HTTP→HTTPS редирект на edge).
  - **Minimum TLS Version** → **TLS 1.2**.
  - **Automatic HTTPS Rewrites** → **On**.
  - **HSTS** — можно включить и здесь, но он уже отдаётся приложением; дублировать
    не вредно (значения совпадают: max-age 2 года, includeSubDomains, preload).

---

## 1. DDoS Protection

L3/4 (сетевой) DDoS у Cloudflare **включён всегда и автоматически**, настраивать
не нужно. Настраивается только L7 (HTTP):

1. **Security → DDoS** → **HTTP DDoS Attack Protection**.
2. Sensitivity → **High**, Action → managed (Cloudflare сам выбирает challenge/block).
3. Не выключай managed-правила без причины — они закрывают известные ботнеты.

> На Free плане L7 DDoS-защита тоже работает (managed ruleset), просто без тонкой
> настройки override-ов, доступной на Pro+.

---

## 2. Web Application Firewall (WAF)

**Security → WAF.**

### 2.1 Managed Rules (готовые наборы Cloudflare)
Включи (Pro+; на Free — облегчённый Free Managed Ruleset уже активен):
- **Cloudflare Managed Ruleset** → On, action **Managed Challenge** или **Block**.
- **OWASP Core Ruleset** → On, Paranoia Level 2, Anomaly threshold — начни с 40
  (Medium), последи за ложными срабатываниями, снижай осторожно.

### 2.2 Custom Rules — правила под это приложение
**Security → WAF → Custom rules → Create rule.** Вставляй выражения (Expression Editor):

**Правило A — защитить админку (только твой IP):**
```
(http.request.uri.path contains "/dashboard" and ip.src ne 203.0.113.10)
```
→ Action: **Managed Challenge** (или Block, если хочешь жёстко). Замени IP на свой.
Опционально сузь до `/api/admin`.

**Правило B — блок известных вредоносных путей (сканеры):**
```
(http.request.uri.path contains "/wp-admin") or
(http.request.uri.path contains "/wp-login") or
(http.request.uri.path contains ".env") or
(http.request.uri.path contains ".git") or
(http.request.uri.path contains "/phpmyadmin")
```
→ Action: **Block**.

**Правило C — только нужные HTTP-методы:**
```
(not http.request.method in {"GET" "POST" "HEAD" "OPTIONS" "PATCH" "DELETE"})
```
→ Action: **Block**.

**Правило D — гео-ограничение (опционально, если работаешь в отдельных странах):**
```
(http.request.uri.path contains "/api/" and not ip.geoip.country in {"RU" "KZ" "BY" "US"})
```
→ Action: **Managed Challenge**. Осторожно: может отсечь легитимных пользователей и VPN.

**Правило E — блок запросов без User-Agent к API (примитивные боты):**
```
(http.request.uri.path contains "/api/" and http.user_agent eq "")
```
→ Action: **Block**.

---

## 3. Bot Protection

**Security → Bots.**

- **Bot Fight Mode** (Free) → **On** — челленджит очевидных ботов автоматически.
- На Pro+: **Super Bot Fight Mode**:
  - **Definitely automated** → **Block**.
  - **Likely automated** → **Managed Challenge**.
  - **Verified bots** (Googlebot, и т.п.) → **Allow**.
  - **JavaScript Detections** → **On** (ловит headless-браузеры).
- Для форм логина/регистрации добавь **Turnstile** (бесплатная CAPTCHA-замена от
  Cloudflare) — см. раздел 6.

**Custom rule против ботов на дорогих AI-эндпоинтах:**
```
(http.request.uri.path in {"/api/analyze" "/api/chat/orchestrate" "/api/chat/direct"}
 and cf.bot_management.score lt 30)
```
→ Action: **Managed Challenge**. (`cf.bot_management.score` доступен на Bot
Management / Enterprise; на Free используй `cf.client.bot` — булев флаг.)

---

## 4. Rate Limiting (edge)

**Security → WAF → Rate limiting rules → Create rule.** Это первый рубеж — режет
всплески ДО Vercel. Приложение (`authLimiter`/`chatLimiter`/`reportLimiter`) —
второй рубеж внутри.

**RL-1 — защита логина/регистрации (anti brute-force):**
- If URI Path is in `/api/auth/register`, `/api/auth/reset-password`,
  `/api/auth/callback/credentials`
- Rate: **10 requests / 1 minute**, counting by **IP**
- Action: **Block**, duration **10 minutes**.

Expression:
```
(http.request.uri.path in {"/api/auth/register" "/api/auth/reset-password" "/api/auth/callback/credentials"})
```

**RL-2 — дорогие AI-эндпоинты (защита кошелька от Anthropic):**
- If URI Path in `/api/analyze`, `/api/chat/orchestrate`, `/api/chat/direct`,
  `/api/reports`
- Rate: **20 requests / 1 minute** by **IP** (или по cookie сессии, если Pro+)
- Action: **Managed Challenge**, затем **Block** при повторении.

```
(http.request.uri.path in {"/api/analyze" "/api/chat/orchestrate" "/api/chat/direct" "/api/reports"})
```

**RL-3 — общий потолок на весь API:**
- If URI Path contains `/api/`
- Rate: **100 requests / 1 minute** by **IP**
- Action: **Block**, duration **1 minute**.

```
(http.request.uri.path contains "/api/")
```

> На Free доступно одно rate-limiting правило и более грубые лимиты; на Pro/Business
> — несколько правил и счёт по произвольным ключам (cookie, header, JA3). Значения
> подбирай под реальный трафик: начни свободнее, ужимай по логам.

---

## 5. Security Headers

Заголовки уже отдаёт приложение (`next.config.ts`): CSP, HSTS, X-Frame-Options,
X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP. **Дублировать в
Cloudflare не нужно** — иначе получишь два конфликтующих значения (напр. два CSP).

Что имеет смысл сделать на Cloudflare:
- **Rules → Transform Rules → Modify Response Header** — только если нужно добавить
  заголовок, которого нет в приложении. Сейчас всё покрыто — оставь как есть.
- **Scrape Shield → Email Address Obfuscation** → On.
- Проверь итог на https://securityheaders.com и https://www.ssllabs.com/ssltest/
  (ожидаемая оценка — **A / A+**).

> Если решишь управлять заголовками централизованно на Cloudflare — тогда убери их
> из `next.config.ts`, чтобы не было дублей. Рекомендую оставить в приложении
> (версионируется в git, едет вместе с кодом).

---

## 6. Защита форм: Turnstile (вместо CAPTCHA)

Для `/login`, `/register`, `/forgot-password`:
1. **Turnstile → Add site** → получишь Site Key + Secret Key.
2. Встрой виджет в форму, проверь токен на сервере в `authorize()` / route-хендлере
   через `POST https://challenges.cloudflare.com/turnstile/v0/siteverify`.
3. Переменные: `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`.

(Могу реализовать интеграцию Turnstile в код — скажи.)

---

## 7. Порядок применения (чек-лист)

1. [ ] Домен добавлен, NS перенесены, DNS-записи **Proxied** ☁️.
2. [ ] SSL/TLS = **Full (strict)**, Always Use HTTPS = On, min TLS 1.2.
3. [ ] `NEXTAUTH_URL=https://vertlix.ai` в Vercel (Production).
4. [ ] DDoS L7 sensitivity = High.
5. [ ] WAF Managed Rules On; Custom Rules A–E добавлены.
6. [ ] Bot Fight Mode (или Super BFM) On.
7. [ ] Rate limiting RL-1, RL-2, RL-3 созданы.
8. [ ] securityheaders.com → A/A+, ssllabs → A/A+.
9. [ ] (опц.) Turnstile на формах логина/регистрации.

## Важные предостережения

- **Не ставь SSL «Flexible»** — сломает HTTPS за Vercel (петли редиректов).
- **Не делай HTTP→HTTPS редирект и в приложении, и на Cloudflare** — достаточно
  «Always Use HTTPS» на edge. В коде его специально нет.
- **Проверяй WAF/Bot правила в режиме Log/Challenge**, прежде чем ставить Block —
  агрессивные правила режут живых пользователей.
- **Реальный IP клиента** — всегда `CF-Connecting-IP` (в коде уже учтено). Не
  доверяй `X-Forwarded-For` для логики безопасности за Cloudflare.
- **Webhooks** (напр. Lemon Squeezy) не должны попадать под Bot/Rate правила —
  вынеси их пути (`/api/webhooks/*`) в исключения или skip-правило.
