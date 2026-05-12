# Design System — Conecta Paraná

> **Fonte da verdade:** [Figma — Designs Conecta Paraná](https://www.figma.com/design/xys9bh2mEhMSAnRd8ZuQe8/Designs-Conecta-Parana)
>
> **Escopo MVP:** Light mode only. Dark mode é pós-MVP.

---

## Publicação como Team Library

Para que os tokens fiquem disponíveis como biblioteca compartilhada para o time:

1. Abra o arquivo Figma acima
2. No painel lateral, clique em **Assets** (ícone de quatro quadrados)
3. Clique no ícone de livro → **Publish styles and variables**
4. Marque todas as collections e publique
5. Em outros arquivos do time: Assets → clique no ícone de livro → habilite **"Designs Conecta Paraná"**

> ⚠️ Requer plano Professional para publicação como Team Library. No plano Starter, os tokens ficam disponíveis apenas dentro do arquivo.

---

## Estrutura de Páginas

O arquivo Figma contém as seguintes seções dentro de **Page 1**:

| Seção | Conteúdo |
|---|---|
| `01 · MOBILE / LIGHT` | Telas do app mobile — modo claro (Login, Cadastro, Home, Eventos, Mapa) |
| `02 · MOBILE / DARK` | Telas do app mobile — modo escuro |
| `03 · MOBILE / COMPONENTS` | Biblioteca de componentes mobile reutilizáveis |
| `04 · ADMIN / BACKOFFICE` | Telas do painel administrativo web (Dashboard, Comunicados, Notícias, Locais, Notificações, Administradores, Editor) |
| `05 · LANDING PAGE` | Telas da landing page pública |

---

## Tipografia

| Token semântico | Fonte | Tamanho | Peso | Line-height | Uso |
|---|---|---|---|---|---|
| `typography/display` | Sora | 48px | 700 | 55.2px | Hero / Display grande |
| `typography/h1` | Sora | 40px | 700 | 48px | Título principal de página |
| `typography/h2` | Sora | 32px | 700 | 38.4px | Títulos de seção |
| `typography/h3` | Sora | 24px | 600 | 28.8px | Subtítulos, cards |
| `typography/h4` | Sora | 20px | 600 | 24px | Títulos de componente |
| `typography/body-lg` | Plus Jakarta Sans | 18px | 400 | 28px | Corpo de texto largo |
| `typography/body` | Plus Jakarta Sans | 16px | 400 | 24px | Corpo de texto padrão |
| `typography/body-sm` | Plus Jakarta Sans | 14px | 400 | 20px | Texto secundário |
| `typography/caption` | Plus Jakarta Sans | 13px | 400 | 18px | Legendas, metadados |
| `typography/micro` | Plus Jakarta Sans | 12px | 400 | 16px | Labels, badges, timestamps |
| `typography/code` | JetBrains Mono | 13px | 400 | 20px | Trechos de código |

### CSS Variables
```css
--font-display: 'Sora', sans-serif;
--font-body: 'Plus Jakarta Sans', sans-serif;
--font-mono: 'JetBrains Mono', monospace;

--text-display: 3rem;      /* 48px */
--text-h1: 2.5rem;         /* 40px */
--text-h2: 2rem;           /* 32px */
--text-h3: 1.5rem;         /* 24px */
--text-h4: 1.25rem;        /* 20px */
--text-body-lg: 1.125rem;  /* 18px */
--text-body: 1rem;         /* 16px */
--text-body-sm: 0.875rem;  /* 14px */
--text-caption: 0.8125rem; /* 13px */
--text-micro: 0.75rem;     /* 12px */
```

### Tailwind Config (`tailwind.config.js`)
```js
fontSize: {
  'display': ['3rem',    { lineHeight: '3.45rem', fontWeight: '700' }],
  'h1':      ['2.5rem',  { lineHeight: '3rem',    fontWeight: '700' }],
  'h2':      ['2rem',    { lineHeight: '2.4rem',  fontWeight: '700' }],
  'h3':      ['1.5rem',  { lineHeight: '1.8rem',  fontWeight: '600' }],
  'h4':      ['1.25rem', { lineHeight: '1.5rem',  fontWeight: '600' }],
  'body-lg': ['1.125rem',{ lineHeight: '1.75rem', fontWeight: '400' }],
  'body':    ['1rem',    { lineHeight: '1.5rem',  fontWeight: '400' }],
  'body-sm': ['0.875rem',{ lineHeight: '1.25rem', fontWeight: '400' }],
  'caption': ['0.8125rem',{ lineHeight: '1.125rem', fontWeight: '400' }],
  'micro':   ['0.75rem', { lineHeight: '1rem',    fontWeight: '400' }],
},
fontFamily: {
  display: ['Sora', 'sans-serif'],
  body:    ['Plus Jakarta Sans', 'sans-serif'],
  mono:    ['JetBrains Mono', 'monospace'],
},
```

### Flutter ThemeData
```dart
textTheme: TextTheme(
  displayLarge:  TextStyle(fontFamily: 'Sora', fontSize: 48, fontWeight: FontWeight.w700, height: 1.15),
  headlineLarge: TextStyle(fontFamily: 'Sora', fontSize: 40, fontWeight: FontWeight.w700, height: 1.20),
  headlineMedium:TextStyle(fontFamily: 'Sora', fontSize: 32, fontWeight: FontWeight.w700, height: 1.20),
  titleLarge:    TextStyle(fontFamily: 'Sora', fontSize: 24, fontWeight: FontWeight.w600, height: 1.20),
  titleMedium:   TextStyle(fontFamily: 'Sora', fontSize: 20, fontWeight: FontWeight.w600, height: 1.20),
  bodyLarge:     TextStyle(fontFamily: 'Plus Jakarta Sans', fontSize: 18, fontWeight: FontWeight.w400, height: 1.55),
  bodyMedium:    TextStyle(fontFamily: 'Plus Jakarta Sans', fontSize: 16, fontWeight: FontWeight.w400, height: 1.50),
  bodySmall:     TextStyle(fontFamily: 'Plus Jakarta Sans', fontSize: 14, fontWeight: FontWeight.w400, height: 1.43),
  labelMedium:   TextStyle(fontFamily: 'Plus Jakarta Sans', fontSize: 13, fontWeight: FontWeight.w400, height: 1.38),
  labelSmall:    TextStyle(fontFamily: 'Plus Jakarta Sans', fontSize: 12, fontWeight: FontWeight.w400, height: 1.33),
),
```

---

## Paleta de Cores

As cores são organizadas em três camadas:
1. **Base** — valores raw diretamente do Figma (grupos do token JSON)
2. **Semântica** — aliases com nomes de intenção, por frente
3. **Frente** — mapeamento específico de Mobile / Admin / Landing

---

### Base — Spring Green (Verde Paraná)

Verde primário do projeto, derivado da identidade do Paraná.

| Token Base | Hex | Nota |
|---|---|---|
| `spring-green/5` | `#001C12` | Mais escuro |
| `spring-green/9` | `#002E1D` | |
| `spring-green/11` | `#013728` | |
| `spring-green/16` | `#005129` | |
| `spring-green/17` | `#00583A` | |
| `spring-green/19` | `#006035` | |
| `spring-green/20` | `#006733` | **Verde Paraná — tom oficial** |
| `spring-green/24` | `#136643` | |
| `spring-green/29` | `#0C8A5E` | |
| `spring-green/30` | `#009871` | |
| `spring-green/37` | `#3A8357` | |
| `spring-green/42` | `#31A773` | |
| `spring-green/48` | `#51A371` | |
| `spring-green/55` | `#60BA8D` | |
| `spring-green/66` | `#85CA9D` | |
| `spring-green/80` | `#B3E6C4` | |
| `spring-green/87` | `#D2EBE1` | |
| `spring-green/88` | `#CCF7DF` | |
| `spring-green/89` | `#DCECE5` | |
| `spring-green/90` | `#D5F5DE` | Mais claro |

### Base — Cyan (Azul-petróleo / Teal)

Usado no Admin e como cor de informação/link.

| Token Base | Hex | Nota |
|---|---|---|
| `cyan/6` | `#001A21` | Mais escuro |
| `cyan/19` | `#004E62` | |
| `cyan/22` | `#005872` | **Blue Lagoon** |
| `cyan/26` | `#007184` | |
| `cyan/28` | `#007491` | **Principal Admin** |
| `cyan/31` | `#008A9C` | |
| `cyan/37` | `#00A1BD` | **Pacific Blue** |
| `cyan/46` | `#38ABB1` | |
| `cyan/87` | `#C7ECF3` | |
| `cyan/88` | `#CFEAF1` | Mais claro |

### Base — Azure (Azul institucional)

Azul mais frio, usado no Admin e em elementos institucionais.

| Token Base | Hex | Nota |
|---|---|---|
| `azure/15` | `#182635` | |
| `azure/17` | `#003759` | |
| `azure/21` | `#00326C` | |
| `azure/30` | `#153182` | |
| `azure/37` | `#0087BC` | |
| `azure/47` | `#248FCC` | |
| `azure/61` | `#4285F4` | Google Blue |
| `azure/80` | `#B4D0E5` | |
| `azure/90` | `#E0E5E9` | |

### Base — Grey (Neutros)

| Token Base | Hex | Nome claude.ai equivalente |
|---|---|---|
| `grey/4` | `#0A0A0A` | Black Bean (quase) |
| `grey/10` | `#1A1A1A` | |
| `grey/23` | `#3D3D3A` | Outer Space |
| `grey/29` | `#46504B` | Corduroy |
| `grey/32` | `#4A5752` | |
| `grey/36` | `#56605C` | Pewter |
| `grey/39` | `#5A6B65` | |
| `grey/44` | `#6B746E` | |
| `grey/47` | `#747D78` | |
| `grey/56` | `#8A958F` | |
| `grey/59` | `#9C9A92` | Silver Chalice |
| `grey/64` | `#9EA7A0` | |
| `grey/74` | `#C2C0B6` | |
| `grey/89` | `#E1E6E2` | Gray Nurse |
| `grey/90` | `#E3EAE7` | |
| `grey/91` | `#E2EFE9` | Harp |
| `grey/93` | `#E3F6F9` | Aqua Haze |
| `grey/97` | `#F6F9F8` | |
| `grey/98` | `#F8FAFD` | |
| `grey/99` | `#FCFEFF` | |
| `white/solid` | `#FFFFFF` | White |
| `black/solid` | `#000000` | Black Bean |

### Base — Orange / Amarelo (Accent / Mostarda)

| Token Base | Hex | Nota |
|---|---|---|
| `orange/31` | `#9D4700` | Burnham escuro |
| `orange/45` | `#E38F00` | |
| `orange/47` | `#CC7722` | |
| `orange/52` | `#DC932E` | |
| `orange/59` | `#FEBC2E` | Sunglow |
| `orange/89` | `#FFDFC6` | |
| `orange/90` | `#EFE2DC` | |
| `yellow/89` | `#E8E6DC` | Alabaster / Pampas |

### Base — Red / Rose (Erro / Alerta)

| Token Base | Hex | Nota |
|---|---|---|
| `red/30` | `#992600` | |
| `red/41` | `#A12F2F` | |
| `red/48` | `#C53030` | |
| `red/52` | `#D73337` | Persian Red |
| `red/53` | `#CF4040` | Roman |
| `red/56` | `#EA4335` | Google Red |
| `red/58` | `#D55753` | Persimmon |
| `grey/94` | `#FFF0E2` | |
| `grey/95` | `#FDE8E8` | Cinderella |

### Base — Green / Violet (Sucesso / Extra)

| Token Base | Hex | Nota |
|---|---|---|
| `green/41` | `#4E943E` | Forest Green |
| `green/47` | `#28C840` | macOS Green |
| `spring-green/43` | `#34A853` | Google Green |
| `violet/42` | `#623E96` | |
| `violet/57` | `#7C54CD` | |

---

## Tokens Semânticos por Frente

### 📱 Mobile

| Token Semântico | → Base | Hex | CSS Variable |
|---|---|---|---|
| `color/mobile/primary/default` | `spring-green/20` | `#006733` | `--color-mobile-primary` |
| `color/mobile/primary/dark` | `spring-green/17` | `#00583A` | `--color-mobile-primary-dark` |
| `color/mobile/primary/light` | `spring-green/87` | `#D2EBE1` | `--color-mobile-primary-light` |
| `color/mobile/primary/subtle` | `spring-green/90` | `#D5F5DE` | `--color-mobile-primary-subtle` |
| `color/mobile/accent/default` | `orange/59` | `#FEBC2E` | `--color-mobile-accent` |
| `color/mobile/accent/dark` | `orange/47` | `#CC7722` | `--color-mobile-accent-dark` |
| `color/mobile/surface/default` | `white/solid` | `#FFFFFF` | `--color-mobile-surface` |
| `color/mobile/surface/subtle` | `grey/97` | `#F6F9F8` | `--color-mobile-surface-subtle` |
| `color/mobile/surface/muted` | `grey/90` | `#E3EAE7` | `--color-mobile-surface-muted` |
| `color/mobile/surface/dark` | `spring-green/11` | `#013728` | `--color-mobile-surface-dark` |
| `color/mobile/text/primary` | `grey/23` | `#3D3D3A` | `--color-mobile-text-primary` |
| `color/mobile/text/secondary` | `grey/36` | `#56605C` | `--color-mobile-text-secondary` |
| `color/mobile/text/muted` | `grey/47` | `#747D78` | `--color-mobile-text-muted` |
| `color/mobile/text/on-primary` | `white/solid` | `#FFFFFF` | `--color-mobile-text-on-primary` |
| `color/mobile/text/on-dark` | `white/solid` | `#FFFFFF` | `--color-mobile-text-on-dark` |
| `color/mobile/text/link` | `spring-green/24` | `#136643` | `--color-mobile-text-link` |
| `color/mobile/border/default` | `grey/89` | `#E1E6E2` | `--color-mobile-border` |
| `color/mobile/border/strong` | `grey/64` | `#9EA7A0` | `--color-mobile-border-strong` |
| `color/mobile/status/success` | `green/41` | `#4E943E` | `--color-mobile-success` |
| `color/mobile/status/success-light` | `spring-green/88` | `#CCF7DF` | `--color-mobile-success-light` |
| `color/mobile/status/warning` | `orange/59` | `#FEBC2E` | `--color-mobile-warning` |
| `color/mobile/status/warning-light` | `orange/90` | `#EFE2DC` | `--color-mobile-warning-light` |
| `color/mobile/status/error` | `red/52` | `#D73337` | `--color-mobile-error` |
| `color/mobile/status/error-light` | `grey/95` | `#FDE8E8` | `--color-mobile-error-light` |
| `color/mobile/status/info` | `cyan/28` | `#007491` | `--color-mobile-info` |
| `color/mobile/status/info-light` | `cyan/88` | `#CFEAF1` | `--color-mobile-info-light` |

### 🖥️ Admin

| Token Semântico | → Base | Hex | CSS Variable |
|---|---|---|---|
| `color/admin/primary/default` | `cyan/28` | `#007491` | `--color-admin-primary` |
| `color/admin/primary/dark` | `cyan/22` | `#005872` | `--color-admin-primary-dark` |
| `color/admin/primary/light` | `cyan/88` | `#CFEAF1` | `--color-admin-primary-light` |
| `color/admin/brand/green` | `spring-green/20` | `#006733` | `--color-admin-brand-green` |
| `color/admin/surface/default` | `white/solid` | `#FFFFFF` | `--color-admin-surface` |
| `color/admin/surface/subtle` | `grey/97` | `#F6F9F8` | `--color-admin-surface-subtle` |
| `color/admin/surface/sidebar` | `spring-green/9` | `#002E1D` | `--color-admin-surface-sidebar` |
| `color/admin/surface/row-hover` | `grey/98` | `#F8FAFD` | `--color-admin-surface-row-hover` |
| `color/admin/surface/overlay` | `black/solid` `70%` | `#000000B3` | `--color-admin-overlay` |
| `color/admin/text/primary` | `grey/23` | `#3D3D3A` | `--color-admin-text-primary` |
| `color/admin/text/secondary` | `grey/36` | `#56605C` | `--color-admin-text-secondary` |
| `color/admin/text/muted` | `grey/47` | `#747D78` | `--color-admin-text-muted` |
| `color/admin/text/on-sidebar` | `white/solid` | `#FFFFFF` | `--color-admin-text-on-sidebar` |
| `color/admin/text/link` | `cyan/28` | `#007491` | `--color-admin-text-link` |
| `color/admin/border/default` | `grey/89` | `#E1E6E2` | `--color-admin-border` |
| `color/admin/border/strong` | `azure/90` | `#E0E5E9` | `--color-admin-border-strong` |
| `color/admin/badge/active` | `spring-green/20` | `#006733` | `--color-admin-badge-active` |
| `color/admin/badge/inactive` | `grey/59` | `#9C9A92` | `--color-admin-badge-inactive` |
| `color/admin/badge/warning` | `orange/59` | `#FEBC2E` | `--color-admin-badge-warning` |
| `color/admin/badge/error` | `red/53` | `#CF4040` | `--color-admin-badge-error` |
| `color/admin/status/success` | `green/41` | `#4E943E` | `--color-admin-success` |
| `color/admin/status/error` | `red/52` | `#D73337` | `--color-admin-error` |
| `color/admin/status/warning` | `orange/52` | `#DC932E` | `--color-admin-warning` |
| `color/admin/status/info` | `cyan/28` | `#007491` | `--color-admin-info` |

### 🌐 Landing Page

| Token Semântico | → Base | Hex | CSS Variable |
|---|---|---|---|
| `color/landing/primary/default` | `spring-green/20` | `#006733` | `--color-landing-primary` |
| `color/landing/primary/dark` | `spring-green/11` | `#013728` | `--color-landing-primary-dark` |
| `color/landing/primary/light` | `spring-green/87` | `#D2EBE1` | `--color-landing-primary-light` |
| `color/landing/accent/default` | `cyan/37` | `#00A1BD` | `--color-landing-accent` |
| `color/landing/accent/cta` | `spring-green/20` | `#006733` | `--color-landing-accent-cta` |
| `color/landing/surface/default` | `white/solid` | `#FFFFFF` | `--color-landing-surface` |
| `color/landing/surface/warm` | `yellow/89` | `#E8E6DC` | `--color-landing-surface-warm` |
| `color/landing/surface/hero` | `spring-green/9` | `#002E1D` | `--color-landing-surface-hero` |
| `color/landing/surface/section-alt` | `grey/97` | `#F6F9F8` | `--color-landing-surface-section-alt` |
| `color/landing/text/heading` | `spring-green/9` | `#002E1D` | `--color-landing-text-heading` |
| `color/landing/text/body` | `grey/29` | `#46504B` | `--color-landing-text-body` |
| `color/landing/text/muted` | `grey/47` | `#747D78` | `--color-landing-text-muted` |
| `color/landing/text/on-dark` | `white/solid` | `#FFFFFF` | `--color-landing-text-on-dark` |
| `color/landing/text/on-warm` | `spring-green/11` | `#013728` | `--color-landing-text-on-warm` |
| `color/landing/text/link` | `spring-green/24` | `#136643` | `--color-landing-text-link` |
| `color/landing/border/default` | `grey/89` | `#E1E6E2` | `--color-landing-border` |
| `color/landing/border/hero` | `spring-green/17` `20%` | `#00583A33` | `--color-landing-border-hero` |

### 🔔 Semânticos Compartilhados

| Token Semântico | → Base | Hex | CSS Variable | Flutter |
|---|---|---|---|---|
| `color/semantic/success/default` | `green/41` | `#4E943E` | `--color-success` | `Colors.green[700]` equiv. |
| `color/semantic/success/light` | `spring-green/88` | `#CCF7DF` | `--color-success-light` | |
| `color/semantic/success/dark` | `spring-green/16` | `#005129` | `--color-success-dark` | |
| `color/semantic/warning/default` | `orange/52` | `#DC932E` | `--color-warning` | |
| `color/semantic/warning/light` | `orange/89` | `#FFDFC6` | `--color-warning-light` | |
| `color/semantic/error/default` | `red/52` | `#D73337` | `--color-error` | |
| `color/semantic/error/light` | `grey/95` | `#FDE8E8` | `--color-error-light` | |
| `color/semantic/error/dark` | `red/30` | `#992600` | `--color-error-dark` | |
| `color/semantic/info/default` | `cyan/28` | `#007491` | `--color-info` | |
| `color/semantic/info/light` | `cyan/88` | `#CFEAF1` | `--color-info-light` | |

---

## Spacing

Escala base de 4px. Nomenclatura por tamanho de t-shirt para os valores principais.

| Token | Valor | CSS Variable | Tailwind key |
|---|---|---|---|
| `spacing/0` | 0px | `--space-0: 0` | `0` |
| `spacing/xxs` | 4px | `--space-xxs: 0.25rem` | `1` |
| `spacing/xs` | 8px | `--space-xs: 0.5rem` | `2` |
| `spacing/sm` | 12px | `--space-sm: 0.75rem` | `3` |
| `spacing/s` | 16px | `--space-s: 1rem` | `4` |
| `spacing/s+` | 24px | `--space-s-plus: 1.5rem` | `6` |
| `spacing/m` | 32px | `--space-m: 2rem` | `8` |
| `spacing/xl` | 64px | `--space-xl: 4rem` | `16` |
| `spacing/gap/2` | 2px | `--gap-2: 0.125rem` | — |
| `spacing/gap/6` | 6px | `--gap-6: 0.375rem` | — |
| `spacing/gap/8` | 8px | `--gap-8: 0.5rem` | — |
| `spacing/gap/10` | 10px | `--gap-10: 0.625rem` | — |
| `spacing/gap/12` | 12px | `--gap-12: 0.75rem` | — |
| `spacing/gap/14` | 14px | `--gap-14: 0.875rem` | — |
| `spacing/gap/20` | 20px | `--gap-20: 1.25rem` | — |
| `spacing/gap/40` | 40px | `--gap-40: 2.5rem` | — |
| `spacing/gap/80` | 80px | `--gap-80: 5rem` | — |

---

## Radius

| Token | Valor | CSS Variable | Tailwind | Flutter |
|---|---|---|---|---|
| `radius/none` | 0px | `--radius-none: 0` | `rounded-none` | `BorderRadius.zero` |
| `radius/sm` | 8px | `--radius-sm: 0.5rem` | `rounded-lg` | `BorderRadius.circular(8)` |
| `radius/md` | 14px | `--radius-md: 0.875rem` | `rounded-2xl` | `BorderRadius.circular(14)` |
| `radius/lg` | 24px | `--radius-lg: 1.5rem` | `rounded-3xl` | `BorderRadius.circular(24)` |
| `radius/full` | 9999px | `--radius-full: 9999px` | `rounded-full` | `BorderRadius.circular(100)` |

> O valor principal do design é **8px** (conforme nota do designer: "Raio 8px · Compacto").

---

## Sombras

| Token | CSS Box-shadow | Flutter | Uso |
|---|---|---|---|
| `shadow/sm` | `0 1px 2px rgba(0,0,0,0.08)` | `BoxShadow(blurRadius: 2, offset: Offset(0,1), color: Color(0x14000000))` | Cards inline, inputs |
| `shadow/md` | `0 4px 12px rgba(0,0,0,0.12)` | `BoxShadow(blurRadius: 12, offset: Offset(0,4), color: Color(0x1F000000))` | Cards elevados, dropdowns |
| `shadow/lg` | `0 8px 24px rgba(0,0,0,0.16)` | `BoxShadow(blurRadius: 24, offset: Offset(0,8), color: Color(0x29000000))` | Modais, bottom sheets |

---

## Convenção de Nomenclatura

```
color/{frente}/{categoria}/{variante}

Exemplos:
  color/mobile/primary/default
  color/admin/surface/sidebar
  color/landing/text/on-dark
  color/semantic/error/light

typography/{escala}
  typography/h1
  typography/body-sm

spacing/{tamanho}
  spacing/s
  spacing/xl

radius/{nível}
  radius/sm
  radius/md

shadow/{nível}
  shadow/sm
  shadow/lg
```

---

## Referências

- [Figma — Designs Conecta Paraná](https://www.figma.com/design/xys9bh2mEhMSAnRd8ZuQe8/Designs-Conecta-Parana)
- [W3C Design Tokens Format](https://tr.designtokens.org/format/)
- [TECHNICAL_GLOSSARY.md](./TECHNICAL_GLOSSARY.md)
