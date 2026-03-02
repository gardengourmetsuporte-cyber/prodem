

## Redesign Landing Page: De SaaS para Site Institucional da Prodem

### Contexto da Empresa (pesquisa)

**Prodem Minas Sistemas Ltda** -- Empresa de engenharia fundada em 2015, localizada em São João da Boa Vista/SP. Soluções em:
- **Sistemas de transportadores** (esteiras, conveyors industriais)
- **Embalagens metálicas** (racks, containers)
- **Carrinhos de movimentação** (logística interna de fábricas)

Setor: indústria automotiva e manufatura. ~12 funcionários.
Contato: (19) 3624-1190 | WhatsApp (19) 99731-5465
Endereço: Rua Fernando de Souza, 1065 - Distrito Industrial, São João da Boa Vista/SP

---

### Arquitetura da nova Landing Page

A página deixa de vender um SaaS e passa a ser um **site institucional** com foco em gerar pedidos de orçamento.

```text
┌─────────────────────────────────────────┐
│  Navbar: Logo + Sobre | Soluções |      │
│         Contato | "Solicitar Orçamento"  │
├─────────────────────────────────────────┤
│                                         │
│  HERO: "Soluções em sistemas de         │
│  transporte e movimentação industrial"  │
│  CTA: Solicitar Orçamento               │
│  CTA2: Fale pelo WhatsApp               │
│                                         │
├─────────────────────────────────────────┤
│  SOBRE: Quem somos + diferenciais       │
│  (engenharia sob medida, qualidade,     │
│   experiência no setor automotivo)      │
├─────────────────────────────────────────┤
│  SOLUÇÕES: 3 cards grandes              │
│  • Transportadores industriais          │
│  • Embalagens metálicas                 │
│  • Carrinhos de movimentação            │
│  (sem mockups de app/phone)             │
├─────────────────────────────────────────┤
│  DIFERENCIAIS: 4 ícones                 │
│  Projetos sob medida | Engenharia       │
│  própria | Atendimento ágil | Qualidade │
├─────────────────────────────────────────┤
│  CTA: Fale conosco / Solicitar          │
│  orçamento + WhatsApp + Email           │
├─────────────────────────────────────────┤
│  CONTATO: Mapa, endereço, telefones     │
├─────────────────────────────────────────┤
│  FOOTER: © Prodem Minas Sistemas        │
└─────────────────────────────────────────┘
```

### Mudanças técnicas

**1. Remover seções SaaS** (não se aplicam mais):
- `ProblemSection.tsx` -- reescrever como "Sobre Nós"
- `SolutionSection.tsx` -- reescrever como "Nossas Soluções" (sem steps, sem phone mockups)
- `PricingSection.tsx` -- deletar (não vende planos)
- `FAQSection.tsx` -- deletar ou substituir por "Diferenciais"
- `AnimatedMockup.tsx` -- não usar no hero (substituir por visual industrial)
- `AnimatedPhoneMockup.tsx` -- não usar

**2. Reescrever componentes**:

| Componente | De | Para |
|---|---|---|
| `LandingNavbar.tsx` | Links SaaS (Planos, FAQ) + "Começar grátis" | Links institucionais (Sobre, Soluções, Contato) + "Solicitar Orçamento" |
| `HeroSection.tsx` | Venda de SaaS com mockup de dashboard | Headline institucional + CTAs (Orçamento + WhatsApp) sem mockup de app |
| `ProblemSection.tsx` | "Problemas do gestor" | Seção "Sobre a Prodem" com história, missão e números |
| `SolutionSection.tsx` | 3 steps + phone mockups + 10 módulos | 3 cards de soluções (transportadores, embalagens, carrinhos) + grid de diferenciais |
| `CTASection.tsx` | "Criar conta grátis" | "Solicitar Orçamento" + contato WhatsApp/telefone |
| `FooterSection.tsx` | Links SaaS | Endereço completo, telefones, email, links institucionais |

**3. Criar novo componente**:
- `ContactSection.tsx` -- Seção de contato com endereço, mapa embed, telefones, formulário simples

**4. Deletar componentes não usados**:
- `PricingSection.tsx` (referência removida do Landing.tsx)
- `FAQSection.tsx` (substituída pelos diferenciais dentro da SolutionSection)
- `PlanCheckoutDialog.tsx` (não há planos)
- `AnimatedMockup.tsx` e `AnimatedPhoneMockup.tsx` (sem mockups de app)

**5. `Landing.tsx`** -- Nova estrutura:
```
LandingNavbar → HeroSection → AboutSection (ex-Problem) → SolutionsSection (ex-Solution) → CTASection → ContactSection (novo) → FooterSection
```

**6. `useDocumentTitle.ts`** -- Atualizar APP_NAME de "Garden Gestão" para "Prodem"

**7. Todo conteúdo textual** adaptado para linguagem industrial B2B (transportadores, embalagens metálicas, engenharia sob medida).

### Sobre a parte interna

A adaptação interna (dashboard, módulos) será feita em etapas subsequentes após a landing ficar pronta. Os módulos relevantes para a Prodem seriam: Financeiro, Estoque (materiais/peças), Equipe, Checklists de produção, Pedidos/Orçamentos. Módulos como "Fichas Técnicas de Receitas", "Cardápio Digital", "Gamificação" precisarão ser repensados ou removidos.

