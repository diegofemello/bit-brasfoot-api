# 🏟️ BitFoot — Plano de Desenvolvimento Completo

> **Brasfoot-like Football Manager** — Simulador de gerenciamento de clubes de futebol  
> Data de criação do plano: 12 de fevereiro de 2026

---

## 📋 Índice

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Estrutura dos Repositórios](#3-estrutura-dos-repositórios)
4. [Arquitetura Geral](#4-arquitetura-geral)
5. [Modelagem do Banco de Dados](#5-modelagem-do-banco-de-dados)
6. [Backend — Módulos e API](#6-backend--módulos-e-api)
7. [Frontend — Páginas e Componentes](#7-frontend--páginas-e-componentes)
8. [Motor de Simulação (Game Engine)](#8-motor-de-simulação-game-engine)
9. [Fases de Desenvolvimento (Sprints)](#9-fases-de-desenvolvimento-sprints)
10. [Padrões e Convenções](#10-padrões-e-convenções)
11. [Testes](#11-testes)
12. [Configuração do Ambiente Local](#12-configuração-do-ambiente-local)

---

## 1. Visão Geral do Projeto

O **BitFoot** é uma aplicação web inspirada no Brasfoot — um simulador de gerenciamento de clubes de futebol. O jogador assume o papel de técnico/dirigente, controlando finanças, elenco, táticas, contratações e disputando campeonatos com simulação de partidas em tempo real (modo texto e animação 2D).

### Funcionalidades Principais

| #   | Funcionalidade            | Descrição                                                                                   |
| --- | ------------------------- | ------------------------------------------------------------------------------------------- |
| 1   | Gerenciar Clube           | Escolher time, controlar finanças, elenco, formação tática, contratações, base              |
| 2   | Mercado de Transferências | Compra, venda, empréstimo, troca, propostas automáticas, jogadores livres                   |
| 3   | Sistema Tático            | Formações, estilos, marcação, cobradores de bola parada                                     |
| 4   | Simulação de Partidas     | Modo texto, animação 2D, substituições ao vivo, mudança tática                              |
| 5   | Campeonatos               | Brasileiro (A/B/C), Estaduais, Copa do Brasil, Libertadores, Sul-Americana, Ligas Europeias |
| 6   | Finanças                  | Salários, transferências, premiações, bilheteria, falência                                  |
| 7   | Infraestrutura            | Estádio, CT, base — impactam receita e evolução                                             |
| 8   | Categorias de Base        | Revelação de jovens, potencial, evolução, promoção ao profissional                          |
| 9   | Modo Carreira Longa       | Décadas no mesmo clube, mudar de clube, reputação, propostas                                |
| 10  | Ranking e Estatísticas    | Artilharia, classificação, histórico de campeões, carreira do técnico                       |
| 11  | Editor de Dados           | Editar jogadores, times, elencos                                                            |
| 12  | Sistema de Save/Load      | Salvar e carregar partidas em andamento                                                     |

---

## 2. Stack Tecnológica

### Backend (`backend/`)

| Tecnologia                | Versão | Uso                              |
| ------------------------- | ------ | -------------------------------- |
| **NestJS**                | 11.x   | Framework principal da API       |
| **TypeScript**            | 5.7+   | Linguagem                        |
| **TypeORM**               | 0.3.x  | ORM para PostgreSQL              |
| **PostgreSQL**            | 16+    | Banco de dados relacional        |
| **class-validator**       | latest | Validação de DTOs                |
| **class-transformer**     | latest | Serialização/transformação       |
| **@nestjs/swagger**       | latest | Documentação OpenAPI/Swagger     |
| **@nestjs/config**        | latest | Variáveis de ambiente            |
| **@nestjs/throttler**     | latest | Rate limiting                    |
| **@nestjs/websockets**    | latest | Gateway realtime da partida      |
| **socket.io**             | 4.x    | Transporte realtime bidirecional |
| **@nestjs/cache-manager** | latest | Cache em memória                 |
| **uuid**                  | latest | Geração de IDs                   |
| **seed/faker**            | latest | Dados de seed (jogadores, times) |

### Frontend (`frontend/`)

| Tecnologia          | Versão   | Uso                         |
| ------------------- | -------- | --------------------------- |
| **Angular**         | 21.x     | Framework SPA               |
| **TypeScript**      | 5.7+     | Linguagem                   |
| **Tailwind CSS**    | 4.x      | Estilização utility-first   |
| **Angular Signals** | built-in | Reatividade moderna         |
| **Angular Router**  | built-in | Navegação e guards          |
| **HttpClient**      | built-in | Comunicação com API         |
| **RxJS**            | 7.x      | Streams reativos            |
| **socket.io-client**| 4.x      | Realtime no Match Day       |
| **ngx-translate**   | latest   | Internacionalização (pt-BR) — planejado |
| **Angular CDK**     | 21.x     | Drag & drop, overlays — planejado       |

### Ferramentas de Desenvolvimento

| Ferramenta              | Uso                         |
| ----------------------- | --------------------------- |
| **ESLint**              | Linting (backend; frontend pendente) |
| **Prettier**            | Formatação de código        |
| **Husky + lint-staged** | Git hooks para qualidade    |
| **Jest**                | Testes unitários (backend)  |
| **Karma/Jest**          | Testes unitários (frontend) |
| **Compodoc**            | Documentação do frontend    |

---

## 3. Estrutura dos Repositórios

Os dois projetos vivem em repositórios Git independentes. Não há referência cruzada de arquivos.

### 3.1 Backend (`backend/`)

```
backend/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   │
│   ├── config/                          # Configurações da aplicação
│   │   ├── database.config.ts
│   │   ├── throttler.config.ts
│   │   └── swagger.config.ts
│   │
│   ├── common/                          # Código compartilhado
│   │   ├── decorators/
│   │   │   └── pagination.decorator.ts
│   │   ├── filters/
│   │   │   ├── http-exception.filter.ts
│   │   │   └── all-exceptions.filter.ts
│   │   ├── guards/
│   │   │   └── game-state.guard.ts
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   ├── transform.interceptor.ts
│   │   │   └── timeout.interceptor.ts
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   ├── interfaces/
│   │   │   └── paginated-result.interface.ts
│   │   ├── dto/
│   │   │   └── pagination.dto.ts
│   │   ├── enums/
│   │   │   ├── position.enum.ts
│   │   │   ├── formation.enum.ts
│   │   │   ├── competition-type.enum.ts
│   │   │   ├── transfer-type.enum.ts
│   │   │   ├── match-event-type.enum.ts
│   │   │   └── tactic-style.enum.ts
│   │   └── utils/
│   │       ├── random.util.ts
│   │       ├── name-generator.util.ts
│   │       └── math.util.ts
│   │
│   ├── modules/
│   │   ├── user/                        # Usuários
│   │   │   ├── user.module.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── user.service.ts
│   │   │   ├── entities/
│   │   │   │   └── user.entity.ts
│   │   │   └── dto/
│   │   │       ├── create-user.dto.ts
│   │   │       └── update-user.dto.ts
│   │   │
│   │   ├── save-game/                   # Saves do jogo
│   │   │   ├── save-game.module.ts
│   │   │   ├── save-game.controller.ts
│   │   │   ├── save-game.service.ts
│   │   │   ├── entities/
│   │   │   │   └── save-game.entity.ts
│   │   │   └── dto/
│   │   │       ├── create-save.dto.ts
│   │   │       └── load-save.dto.ts
│   │   │
│   │   ├── country/                     # Países
│   │   │   ├── country.module.ts
│   │   │   ├── country.controller.ts
│   │   │   ├── country.service.ts
│   │   │   ├── entities/
│   │   │   │   └── country.entity.ts
│   │   │   └── dto/
│   │   │       └── country-response.dto.ts
│   │   │
│   │   ├── league/                      # Ligas e Divisões
│   │   │   ├── league.module.ts
│   │   │   ├── league.controller.ts
│   │   │   ├── league.service.ts
│   │   │   ├── entities/
│   │   │   │   └── league.entity.ts
│   │   │   └── dto/
│   │   │       ├── create-league.dto.ts
│   │   │       └── league-response.dto.ts
│   │   │
│   │   ├── club/                        # Clubes
│   │   │   ├── club.module.ts
│   │   │   ├── club.controller.ts
│   │   │   ├── club.service.ts
│   │   │   ├── entities/
│   │   │   │   └── club.entity.ts
│   │   │   └── dto/
│   │   │       ├── create-club.dto.ts
│   │   │       ├── update-club.dto.ts
│   │   │       └── club-response.dto.ts
│   │   │
│   │   ├── player/                      # Jogadores
│   │   │   ├── player.module.ts
│   │   │   ├── player.controller.ts
│   │   │   ├── player.service.ts
│   │   │   ├── entities/
│   │   │   │   ├── player.entity.ts
│   │   │   │   └── player-stats-history.entity.ts
│   │   │   └── dto/
│   │   │       ├── create-player.dto.ts
│   │   │       ├── update-player.dto.ts
│   │   │       └── player-response.dto.ts
│   │   │
│   │   ├── youth-academy/              # Categorias de Base
│   │   │   ├── youth-academy.module.ts
│   │   │   ├── youth-academy.controller.ts
│   │   │   ├── youth-academy.service.ts
│   │   │   ├── entities/
│   │   │   │   └── youth-player.entity.ts
│   │   │   └── dto/
│   │   │       ├── promote-player.dto.ts
│   │   │       └── youth-player-response.dto.ts
│   │   │
│   │   ├── tactic/                      # Táticas
│   │   │   ├── tactic.module.ts
│   │   │   ├── tactic.controller.ts
│   │   │   ├── tactic.service.ts
│   │   │   ├── entities/
│   │   │   │   └── tactic.entity.ts
│   │   │   └── dto/
│   │   │       ├── create-tactic.dto.ts
│   │   │       ├── update-tactic.dto.ts
│   │   │       └── tactic-response.dto.ts
│   │   │
│   │   ├── transfer/                    # Transferências
│   │   │   ├── transfer.module.ts
│   │   │   ├── transfer.controller.ts
│   │   │   ├── transfer.service.ts
│   │   │   ├── entities/
│   │   │   │   ├── transfer.entity.ts
│   │   │   │   └── transfer-offer.entity.ts
│   │   │   └── dto/
│   │   │       ├── create-offer.dto.ts
│   │   │       ├── respond-offer.dto.ts
│   │   │       └── transfer-response.dto.ts
│   │   │
│   │   ├── finance/                     # Finanças
│   │   │   ├── finance.module.ts
│   │   │   ├── finance.controller.ts
│   │   │   ├── finance.service.ts
│   │   │   ├── entities/
│   │   │   │   ├── finance.entity.ts
│   │   │   │   └── financial-transaction.entity.ts
│   │   │   └── dto/
│   │   │       ├── update-ticket-price.dto.ts
│   │   │       └── finance-response.dto.ts
│   │   │
│   │   ├── infrastructure/             # Infraestrutura (Estádio, CT, Base)
│   │   │   ├── infrastructure.module.ts
│   │   │   ├── infrastructure.controller.ts
│   │   │   ├── infrastructure.service.ts
│   │   │   ├── entities/
│   │   │   │   └── infrastructure.entity.ts
│   │   │   └── dto/
│   │   │       ├── upgrade-infrastructure.dto.ts
│   │   │       └── infrastructure-response.dto.ts
│   │   │
│   │   ├── competition/                 # Competições / Campeonatos
│   │   │   ├── competition.module.ts
│   │   │   ├── competition.controller.ts
│   │   │   ├── competition.service.ts
│   │   │   ├── entities/
│   │   │   │   ├── competition.entity.ts
│   │   │   │   ├── competition-season.entity.ts
│   │   │   │   ├── competition-group.entity.ts
│   │   │   │   └── standing.entity.ts
│   │   │   └── dto/
│   │   │       ├── competition-response.dto.ts
│   │   │       └── standing-response.dto.ts
│   │   │
│   │   ├── fixture/                     # Rodadas e Calendário
│   │   │   ├── fixture.module.ts
│   │   │   ├── fixture.controller.ts
│   │   │   ├── fixture.service.ts
│   │   │   ├── entities/
│   │   │   │   └── fixture.entity.ts
│   │   │   └── dto/
│   │   │       └── fixture-response.dto.ts
│   │   │
│   │   ├── match/                       # Partidas
│   │   │   ├── match.module.ts
│   │   │   ├── match.controller.ts
│   │   │   ├── match.service.ts
│   │   │   ├── entities/
│   │   │   │   ├── match.entity.ts
│   │   │   │   └── match-event.entity.ts
│   │   │   └── dto/
│   │   │       ├── match-response.dto.ts
│   │   │       ├── match-event-response.dto.ts
│   │   │       └── match-substitution.dto.ts
│   │   │
│   │   ├── match-engine/               # Motor de Simulação
│   │   │   ├── match-engine.module.ts
│   │   │   ├── match-engine.service.ts
│   │   │   ├── services/
│   │   │   │   ├── simulation.service.ts
│   │   │   │   ├── event-generator.service.ts
│   │   │   │   ├── commentary.service.ts
│   │   │   │   └── rating.service.ts
│   │   │   └── interfaces/
│   │   │       ├── match-state.interface.ts
│   │   │       ├── simulation-config.interface.ts
│   │   │       └── match-result.interface.ts
│   │   │
│   │   ├── season/                      # Temporadas
│   │   │   ├── season.module.ts
│   │   │   ├── season.controller.ts
│   │   │   ├── season.service.ts
│   │   │   ├── entities/
│   │   │   │   └── season.entity.ts
│   │   │   └── dto/
│   │   │       └── season-response.dto.ts
│   │   │
│   │   ├── career/                      # Carreira do Técnico
│   │   │   ├── career.module.ts
│   │   │   ├── career.controller.ts
│   │   │   ├── career.service.ts
│   │   │   ├── entities/
│   │   │   │   ├── career.entity.ts
│   │   │   │   └── career-history.entity.ts
│   │   │   └── dto/
│   │   │       ├── career-response.dto.ts
│   │   │       └── change-club.dto.ts
│   │   │
│   │   ├── stats/                       # Estatísticas e Rankings
│   │   │   ├── stats.module.ts
│   │   │   ├── stats.controller.ts
│   │   │   ├── stats.service.ts
│   │   │   └── dto/
│   │   │       ├── top-scorers.dto.ts
│   │   │       ├── league-standings.dto.ts
│   │   │       └── champion-history.dto.ts
│   │   │
│   │   ├── editor/                      # Editor de Dados
│   │   │   ├── editor.module.ts
│   │   │   ├── editor.controller.ts
│   │   │   ├── editor.service.ts
│   │   │   └── dto/
│   │   │       ├── edit-player.dto.ts
│   │   │       └── edit-club.dto.ts
│   │   │
│   │   └── progression/                # Sistema de Progressão
│   │       ├── progression.module.ts
│   │       ├── progression.service.ts
│   │       └── services/
│   │           ├── player-evolution.service.ts
│   │           ├── player-aging.service.ts
│   │           ├── retirement.service.ts
│   │           └── promotion-relegation.service.ts
│   │
│   └── database/
│       ├── migrations/                  # Migrations TypeORM
│       └── seeds/                       # Seeds de dados iniciais
│           ├── countries.seed.ts
│           ├── leagues.seed.ts
│           ├── clubs.seed.ts
│           ├── players.seed.ts
│           └── seed-runner.ts
│
├── test/
│   ├── unit/
│   └── e2e/
│
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── nest-cli.json
├── package.json
├── tsconfig.json
├── tsconfig.build.json
└── README.md
```

### 3.2 Frontend (`frontend/`)

```
frontend/
├── src/
│   ├── main.ts
│   ├── index.html
│   ├── styles.css                       # Tailwind imports
│   │
│   ├── app/
│   │   ├── app.component.ts
│   │   ├── app.config.ts
│   │   ├── app.routes.ts
│   │   │
│   │   ├── core/                        # Serviços singleton e interceptors
│   │   │   ├── interceptors/
│   │   │   │   ├── error.interceptor.ts
│   │   │   │   └── loading.interceptor.ts
│   │   │   ├── guards/
│   │   │   │   └── game-loaded.guard.ts
│   │   │   ├── services/
│   │   │   │   ├── api.service.ts
│   │   │   │   ├── game-state.service.ts
│   │   │   │   ├── notification.service.ts
│   │   │   │   └── storage.service.ts
│   │   │   ├── models/
│   │   │   │   ├── user.model.ts
│   │   │   │   ├── club.model.ts
│   │   │   │   ├── player.model.ts
│   │   │   │   ├── match.model.ts
│   │   │   │   ├── tactic.model.ts
│   │   │   │   ├── competition.model.ts
│   │   │   │   ├── finance.model.ts
│   │   │   │   ├── transfer.model.ts
│   │   │   │   ├── career.model.ts
│   │   │   │   └── season.model.ts
│   │   │   └── enums/
│   │   │       ├── position.enum.ts
│   │   │       ├── formation.enum.ts
│   │   │       └── competition-type.enum.ts
│   │   │
│   │   ├── shared/                      # Componentes reutilizáveis
│   │   │   ├── components/
│   │   │   │   ├── header/
│   │   │   │   ├── sidebar/
│   │   │   │   ├── footer/
│   │   │   │   ├── loading-spinner/
│   │   │   │   ├── confirmation-dialog/
│   │   │   │   ├── data-table/
│   │   │   │   ├── stat-card/
│   │   │   │   ├── player-card/
│   │   │   │   ├── player-mini-card/
│   │   │   │   ├── progress-bar/
│   │   │   │   ├── badge/
│   │   │   │   ├── toast/
│   │   │   │   ├── modal/
│   │   │   │   ├── pagination/
│   │   │   │   ├── star-rating/
│   │   │   │   └── money-display/
│   │   │   ├── directives/
│   │   │   │   ├── tooltip.directive.ts
│   │   │   │   └── click-outside.directive.ts
│   │   │   └── pipes/
│   │   │       ├── currency-brl.pipe.ts
│   │   │       ├── age.pipe.ts
│   │   │       ├── position-label.pipe.ts
│   │   │       └── short-number.pipe.ts
│   │   │
│   │   └── features/                    # Módulos de funcionalidades
│   │       ├── main-menu/
│   │       │   ├── pages/
│   │       │   │   ├── main-menu/
│   │       │   │   ├── new-game/
│   │       │   │   ├── load-game/
│   │       │   │   └── select-club/
│   │       │   └── main-menu.routes.ts
│   │       │
│   │       ├── dashboard/
│   │       │   ├── pages/
│   │       │   │   └── dashboard/
│   │       │   ├── components/
│   │       │   │   ├── next-match-card/
│   │       │   │   ├── finance-summary/
│   │       │   │   ├── league-position/
│   │       │   │   ├── recent-results/
│   │       │   │   └── news-feed/
│   │       │   └── dashboard.routes.ts
│   │       │
│   │       ├── squad/
│   │       │   ├── pages/
│   │       │   │   ├── squad-list/
│   │       │   │   └── player-detail/
│   │       │   ├── components/
│   │       │   │   ├── squad-table/
│   │       │   │   ├── player-attributes/
│   │       │   │   └── player-history/
│   │       │   ├── services/
│   │       │   │   └── squad.service.ts
│   │       │   └── squad.routes.ts
│   │       │
│   │       ├── tactics/
│   │       │   ├── pages/
│   │       │   │   └── tactics-editor/
│   │       │   ├── components/
│   │       │   │   ├── formation-picker/
│   │       │   │   ├── pitch-view/
│   │       │   │   ├── player-slot/
│   │       │   │   ├── tactic-options/
│   │       │   │   └── set-piece-config/
│   │       │   ├── services/
│   │       │   │   └── tactics.service.ts
│   │       │   └── tactics.routes.ts
│   │       │
│   │       ├── transfers/
│   │       │   ├── pages/
│   │       │   │   ├── transfer-market/
│   │       │   │   ├── negotiations/
│   │       │   │   ├── transfer-history/
│   │       │   │   └── free-agents/
│   │       │   ├── components/
│   │       │   │   ├── player-search-filters/
│   │       │   │   ├── offer-dialog/
│   │       │   │   ├── incoming-offers/
│   │       │   │   └── loan-management/
│   │       │   ├── services/
│   │       │   │   └── transfer.service.ts
│   │       │   └── transfers.routes.ts
│   │       │
│   │       ├── youth-academy/
│   │       │   ├── pages/
│   │       │   │   └── youth-academy/
│   │       │   ├── components/
│   │       │   │   ├── youth-player-list/
│   │       │   │   └── promote-dialog/
│   │       │   ├── services/
│   │       │   │   └── youth-academy.service.ts
│   │       │   └── youth-academy.routes.ts
│   │       │
│   │       ├── finances/
│   │       │   ├── pages/
│   │       │   │   └── finances-overview/
│   │       │   ├── components/
│   │       │   │   ├── balance-chart/
│   │       │   │   ├── salary-list/
│   │       │   │   ├── transaction-history/
│   │       │   │   └── ticket-pricing/
│   │       │   ├── services/
│   │       │   │   └── finance.service.ts
│   │       │   └── finances.routes.ts
│   │       │
│   │       ├── infrastructure/
│   │       │   ├── pages/
│   │       │   │   └── infrastructure/
│   │       │   ├── components/
│   │       │   │   ├── stadium-card/
│   │       │   │   ├── training-center-card/
│   │       │   │   └── youth-facility-card/
│   │       │   ├── services/
│   │       │   │   └── infrastructure.service.ts
│   │       │   └── infrastructure.routes.ts
│   │       │
│   │       ├── competitions/
│   │       │   ├── pages/
│   │       │   │   ├── competitions-list/
│   │       │   │   ├── league-table/
│   │       │   │   ├── cup-bracket/
│   │       │   │   └── fixtures-calendar/
│   │       │   ├── components/
│   │       │   │   ├── standings-table/
│   │       │   │   ├── fixture-card/
│   │       │   │   ├── group-stage/
│   │       │   │   └── knockout-bracket/
│   │       │   ├── services/
│   │       │   │   └── competition.service.ts
│   │       │   └── competitions.routes.ts
│   │       │
│   │       ├── match-day/
│   │       │   ├── pages/
│   │       │   │   ├── pre-match/
│   │       │   │   ├── match-live/
│   │       │   │   └── post-match/
│   │       │   ├── components/
│   │       │   │   ├── match-text-commentary/
│   │       │   │   ├── match-pitch-2d/
│   │       │   │   ├── scoreboard/
│   │       │   │   ├── match-stats/
│   │       │   │   ├── substitution-panel/
│   │       │   │   ├── live-tactic-change/
│   │       │   │   ├── match-timeline/
│   │       │   │   └── match-events-log/
│   │       │   ├── services/
│   │       │   │   ├── match-day.service.ts
│   │       │   │   └── match-animation.service.ts
│   │       │   └── match-day.routes.ts
│   │       │
│   │       ├── career/
│   │       │   ├── pages/
│   │       │   │   ├── career-overview/
│   │       │   │   └── job-offers/
│   │       │   ├── components/
│   │       │   │   ├── career-timeline/
│   │       │   │   ├── trophy-cabinet/
│   │       │   │   └── reputation-meter/
│   │       │   ├── services/
│   │       │   │   └── career.service.ts
│   │       │   └── career.routes.ts
│   │       │
│   │       ├── stats/
│   │       │   ├── pages/
│   │       │   │   ├── season-stats/
│   │       │   │   ├── all-time-stats/
│   │       │   │   └── player-rankings/
│   │       │   ├── components/
│   │       │   │   ├── top-scorers-table/
│   │       │   │   ├── champion-history/
│   │       │   │   └── records-list/
│   │       │   ├── services/
│   │       │   │   └── stats.service.ts
│   │       │   └── stats.routes.ts
│   │       │
│   │       ├── editor/
│   │       │   ├── pages/
│   │       │   │   ├── player-editor/
│   │       │   │   └── club-editor/
│   │       │   ├── services/
│   │       │   │   └── editor.service.ts
│   │       │   └── editor.routes.ts
│   │       │
│   │       └── settings/
│   │           ├── pages/
│   │           │   └── settings/
│   │           └── settings.routes.ts
│   │
│   ├── assets/
│   │   ├── images/
│   │   │   ├── logos/
│   │   │   ├── flags/
│   │   │   ├── pitch/
│   │   │   └── ui/
│   │   ├── fonts/
│   │   └── data/
│   │       └── formations.json
│   │
│   └── environments/
│       ├── environment.ts
│       └── environment.development.ts
│
├── .eslintrc.json
├── .prettierrc
├── angular.json
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.spec.json
└── README.md
```

---

## 4. Arquitetura Geral

### 4.1 Diagrama de Alto Nível

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND (Angular 21)             │
│  ┌──────────┐ ┌───────────┐ ┌────────────────────┐  │
│  │  Pages   │ │Components │ │   Services/State   │  │
│  │(Features)│ │ (Shared)  │ │  (Signals + RxJS)  │  │
│  └────┬─────┘ └─────┬─────┘ └─────────┬──────────┘  │
│       └─────────────┼─────────────────┘              │
│                     │ HTTP (REST API)                 │
└─────────────────────┼───────────────────────────────┘
                      │
┌─────────────────────┼───────────────────────────────┐
│                BACKEND (NestJS 11)                    │
│  ┌──────────┐ ┌─────┴─────┐ ┌────────────────────┐  │
│  │Controllers│ │ Services  │ │   Match Engine     │  │
│  │  (REST)   │ │ (Business)│ │  (Simulation)      │  │
│  └────┬─────┘ └─────┬─────┘ └─────────┬──────────┘  │
│       └─────────────┼─────────────────┘              │
│                     │ TypeORM                         │
│              ┌──────┴──────┐                          │
│              │ PostgreSQL  │                          │
│              │  Database   │                          │
│              └─────────────┘                          │
└──────────────────────────────────────────────────────┘
```

### 4.2 Fluxo de Jogo Principal

```
Menu Principal → Novo Jogo / Carregar
              │
              ▼
    Selecionar País → Liga → Clube
              │
              ▼
        Dashboard do Clube
        ┌─────────────────┐
        │  Elenco          │
        │  Táticas          │
        │  Transferências   │
        │  Finanças         │
        │  Infraestrutura   │
        │  Base             │
        │  Competições      │
        │  Carreira         │
        │  Estatísticas     │
        └────────┬──────────┘
                 │
                 ▼
          Avançar Dia/Rodada
                 │
        ┌────────┴────────┐
        │ Dia de Jogo?    │
        │   SIM    NÃO    │
        └───┬────────┬────┘
            │        │
            ▼        ▼
     Pré-Jogo    Treino/
     Partida     Eventos
     Pós-Jogo    Diários
            │        │
            └────┬───┘
                 │
                 ▼
        Verificar fim da temporada
                 │
            ┌────┴────┐
            │ SIM     │ NÃO → volta ao Dashboard
            └────┬────┘
                 │
                 ▼
        Processamento de fim de temporada:
        - Promoção / Rebaixamento
        - Evolução dos jogadores
        - Aposentadorias
        - Renovações de contrato
        - Geração de novos jogadores da base
        - Atualização de finanças
                 │
                 ▼
          Nova Temporada
```

### 4.3 Padrão de Comunicação

- **Frontend → Backend (dados de domínio):** REST API com JSON via `HttpClient`
- **Frontend ↔ Backend (partida ao vivo):** WebSocket (Socket.IO) no namespace `/match-live`
- **Sessão local (fase atual):** Sem autenticação; foco total no fluxo de jogo
- **Estado do jogo:** Persistido no PostgreSQL. O frontend consulta o estado via API.
- **Simulação de partida:** Executada no backend (match engine + serviço realtime). O frontend recebe o estado/eventos ao vivo e renderiza progressivamente.

---

## 5. Modelagem do Banco de Dados

### 5.1 Diagrama Entidade-Relacionamento (Resumo)

```
User 1──N SaveGame
SaveGame 1──1 Career
Career 1──N CareerHistory

SaveGame 1──N Country
Country 1──N League
League 1──N Club
Club 1──N Player
Club 1──1 Finance
Club 1──1 Infrastructure
Club 1──N YouthPlayer
Club 1──N Tactic

League 1──N CompetitionSeason
CompetitionSeason 1──N Standing
CompetitionSeason 1──N Fixture
CompetitionSeason 1──N CompetitionGroup

Fixture 1──1 Match
Match 1──N MatchEvent
Match N──1 Club (home)
Match N──1 Club (away)

Player 1──N PlayerStatsHistory
Player 1──N Transfer
Finance 1──N FinancialTransaction
```

### 5.2 Entidades Detalhadas

#### `User`

| Coluna       | Tipo         | Descrição                 |
| ------------ | ------------ | ------------------------- |
| id           | UUID (PK)    | Identificador             |
| manager_name | VARCHAR(100) | Nome do manager           |
| locale       | VARCHAR(10)  | Idioma/região (ex: pt-BR) |
| created_at   | TIMESTAMP    | Data de criação           |
| updated_at   | TIMESTAMP    | Data de atualização       |

#### `SaveGame`

| Coluna              | Tipo             | Descrição          |
| ------------------- | ---------------- | ------------------ |
| id                  | UUID (PK)        |                    |
| user_id             | UUID (FK → User) |                    |
| name                | VARCHAR(100)     | Nome do save       |
| current_date        | DATE             | Data atual no jogo |
| current_season_year | INT              | Ano da temporada   |
| managed_club_id     | UUID (FK → Club) | Clube gerenciado   |
| is_active           | BOOLEAN          | Save ativo         |
| created_at          | TIMESTAMP        |                    |
| updated_at          | TIMESTAMP        |                    |

#### `Country`

| Coluna       | Tipo         | Descrição    |
| ------------ | ------------ | ------------ |
| id           | UUID (PK)    |              |
| save_game_id | UUID (FK)    |              |
| name         | VARCHAR(100) | Nome do país |
| code         | VARCHAR(3)   | Código ISO   |
| continent    | VARCHAR(50)  | Continente   |
| flag_url     | VARCHAR(255) | Bandeira     |

#### `League`

| Coluna           | Tipo                | Descrição                      |
| ---------------- | ------------------- | ------------------------------ |
| id               | UUID (PK)           |                                |
| country_id       | UUID (FK → Country) |                                |
| name             | VARCHAR(100)        | Ex: "Série A"                  |
| division         | INT                 | Nível da divisão (1, 2, 3)     |
| max_teams        | INT                 | Máximo de times                |
| promotion_spots  | INT                 | Vagas de acesso                |
| relegation_spots | INT                 | Vagas de rebaixamento          |
| prize_money      | DECIMAL(15,2)       | Premiação do campeão           |
| type             | ENUM                | 'league', 'cup', 'continental' |

#### `Club`

| Coluna          | Tipo               | Descrição                    |
| --------------- | ------------------ | ---------------------------- |
| id              | UUID (PK)          |                              |
| league_id       | UUID (FK → League) |                              |
| name            | VARCHAR(100)       | Nome do clube                |
| short_name      | VARCHAR(10)        | Abreviação                   |
| city            | VARCHAR(100)       | Cidade                       |
| color_primary   | VARCHAR(7)         | Cor primária (#hex)          |
| color_secondary | VARCHAR(7)         | Cor secundária               |
| logo_url        | VARCHAR(255)       | Logo                         |
| reputation      | INT (1-100)        | Reputação do clube           |
| fan_base        | INT                | Base de torcedores           |
| is_managed      | BOOLEAN            | Se é gerenciado pelo jogador |
| morale          | INT (1-100)        | Moral do elenco              |

#### `Player`

| Coluna                | Tipo             | Descrição                                                       |
| --------------------- | ---------------- | --------------------------------------------------------------- |
| id                    | UUID (PK)        |                                                                 |
| club_id               | UUID (FK → Club) | Nullable se livre                                               |
| name                  | VARCHAR(100)     | Nome completo                                                   |
| short_name            | VARCHAR(50)      | Nome curto                                                      |
| nationality           | VARCHAR(100)     | Nacionalidade                                                   |
| birth_date            | DATE             | Data de nascimento                                              |
| position              | ENUM             | GOL, ZAG, LAT_D, LAT_E, VOL, MEI, MEI_O, MEI_D, PD, PE, ATA, SA |
| secondary_position    | ENUM             | Posição alternativa (nullable)                                  |
| overall               | INT (1-100)      | Habilidade geral                                                |
| potential             | INT (1-100)      | Potencial máximo                                                |
| speed                 | INT (1-100)      | Velocidade                                                      |
| stamina               | INT (1-100)      | Resistência                                                     |
| strength              | INT (1-100)      | Força                                                           |
| technique             | INT (1-100)      | Técnica                                                         |
| passing               | INT (1-100)      | Passe                                                           |
| shooting              | INT (1-100)      | Finalização                                                     |
| defending             | INT (1-100)      | Marcação                                                        |
| heading               | INT (1-100)      | Cabeceio                                                        |
| goalkeeping           | INT (1-100)      | Habilidade de goleiro                                           |
| dribbling             | INT (1-100)      | Dribles                                                         |
| creativity            | INT (1-100)      | Criatividade                                                    |
| aggression            | INT (1-100)      | Agressividade                                                   |
| positioning           | INT (1-100)      | Posicionamento                                                  |
| work_rate             | INT (1-100)      | Raça / Empenho                                                  |
| injury_proneness      | INT (1-100)      | Propensão a lesão                                               |
| market_value          | DECIMAL(15,2)    | Valor de mercado                                                |
| salary                | DECIMAL(12,2)    | Salário mensal                                                  |
| contract_end          | DATE             | Fim do contrato                                                 |
| is_on_loan            | BOOLEAN          | Emprestado                                                      |
| loan_from_club_id     | UUID (FK)        | Clube de origem (empréstimo)                                    |
| is_transfer_listed    | BOOLEAN          | Na lista de transferências                                      |
| is_retired            | BOOLEAN          | Aposentado                                                      |
| goals_season          | INT              | Gols na temporada                                               |
| assists_season        | INT              | Assistências na temporada                                       |
| yellow_cards_season   | INT              | Cartões amarelos                                                |
| red_cards_season      | INT              | Cartões vermelhos                                               |
| matches_played_season | INT              | Jogos na temporada                                              |
| avg_rating_season     | DECIMAL(3,1)     | Nota média                                                      |

#### `PlayerStatsHistory`

| Coluna        | Tipo         | Descrição         |
| ------------- | ------------ | ----------------- |
| id            | UUID (PK)    |                   |
| player_id     | UUID (FK)    |                   |
| season_year   | INT          |                   |
| club_name     | VARCHAR(100) |                   |
| matches       | INT          |                   |
| goals         | INT          |                   |
| assists       | INT          |                   |
| avg_rating    | DECIMAL(3,1) |                   |
| overall_start | INT          | Overall no início |
| overall_end   | INT          | Overall no fim    |

#### `YouthPlayer`

| Coluna          | Tipo             | Descrição            |
| --------------- | ---------------- | -------------------- |
| id              | UUID (PK)        |                      |
| club_id         | UUID (FK → Club) |                      |
| name            | VARCHAR(100)     |                      |
| position        | ENUM             |                      |
| birth_date      | DATE             |                      |
| potential       | INT (1-100)      |                      |
| current_ability | INT (1-100)      |                      |
| is_promoted     | BOOLEAN          | Já foi promovido     |
| scouting_report | TEXT             | Relatório do olheiro |
| discovered_at   | DATE             | Data de revelação    |

#### `Tactic`

| Coluna               | Tipo               | Descrição                                                            |
| -------------------- | ------------------ | -------------------------------------------------------------------- |
| id                   | UUID (PK)          |                                                                      |
| club_id              | UUID (FK → Club)   |                                                                      |
| name                 | VARCHAR(50)        | Nome da tática                                                       |
| formation            | VARCHAR(10)        | Ex: "4-4-2"                                                          |
| style                | ENUM               | 'offensive', 'balanced', 'defensive', 'counter_attack', 'possession' |
| marking              | ENUM               | 'press', 'normal', 'deep'                                            |
| offside_trap         | BOOLEAN            | Linha de impedimento                                                 |
| goalkeeper_offensive | BOOLEAN            | Goleiro ofensivo                                                     |
| penalty_taker_id     | UUID (FK → Player) |                                                                      |
| free_kick_taker_id   | UUID (FK → Player) |                                                                      |
| corner_taker_id      | UUID (FK → Player) |                                                                      |
| captain_id           | UUID (FK → Player) |                                                                      |
| is_active            | BOOLEAN            | Se é a tática atual                                                  |
| player_positions     | JSONB              | Mapa [playerId → posição no campo]                                   |

#### `TransferOffer`

| Coluna               | Tipo          | Descrição                                               |
| -------------------- | ------------- | ------------------------------------------------------- |
| id                   | UUID (PK)     |                                                         |
| player_id            | UUID (FK)     |                                                         |
| from_club_id         | UUID (FK)     | Clube que fez a proposta                                |
| to_club_id           | UUID (FK)     | Clube que detém o jogador                               |
| type                 | ENUM          | 'buy', 'sell', 'loan', 'swap'                           |
| offered_amount       | DECIMAL(15,2) | Valor oferecido                                         |
| salary_offered       | DECIMAL(12,2) | Salário oferecido ao jogador                            |
| swap_player_id       | UUID (FK)     | Jogador de troca (se swap)                              |
| loan_duration_months | INT           | Duração empréstimo                                      |
| status               | ENUM          | 'pending', 'accepted', 'rejected', 'counter', 'expired' |
| created_at           | TIMESTAMP     |                                                         |
| expires_at           | TIMESTAMP     |                                                         |

#### `Transfer`

| Coluna       | Tipo          | Descrição                     |
| ------------ | ------------- | ----------------------------- |
| id           | UUID (PK)     |                               |
| offer_id     | UUID (FK)     |                               |
| player_id    | UUID (FK)     |                               |
| from_club_id | UUID (FK)     |                               |
| to_club_id   | UUID (FK)     |                               |
| type         | ENUM          | 'buy', 'loan', 'swap', 'free' |
| amount       | DECIMAL(15,2) |                               |
| completed_at | TIMESTAMP     |                               |
| season_year  | INT           |                               |

#### `Finance`

| Coluna            | Tipo             | Descrição            |
| ----------------- | ---------------- | -------------------- |
| id                | UUID (PK)        |                      |
| club_id           | UUID (FK → Club) |                      |
| balance           | DECIMAL(15,2)    | Saldo atual          |
| monthly_income    | DECIMAL(15,2)    | Receita mensal       |
| monthly_expense   | DECIMAL(15,2)    | Despesa mensal       |
| total_salary_bill | DECIMAL(15,2)    | Folha salarial total |
| ticket_price      | DECIMAL(8,2)     | Preço do ingresso    |
| is_bankrupt       | BOOLEAN          | Falido               |

#### `FinancialTransaction`

| Coluna      | Tipo          | Descrição                                                                                        |
| ----------- | ------------- | ------------------------------------------------------------------------------------------------ |
| id          | UUID (PK)     |                                                                                                  |
| finance_id  | UUID (FK)     |                                                                                                  |
| type        | ENUM          | 'transfer_in', 'transfer_out', 'salary', 'prize', 'ticket', 'infrastructure', 'sponsor', 'other' |
| amount      | DECIMAL(15,2) |                                                                                                  |
| description | VARCHAR(255)  |                                                                                                  |
| date        | DATE          |                                                                                                  |

#### `Infrastructure`

| Coluna                | Tipo             | Descrição                     |
| --------------------- | ---------------- | ----------------------------- |
| id                    | UUID (PK)        |                               |
| club_id               | UUID (FK → Club) |                               |
| stadium_capacity      | INT              | Capacidade do estádio         |
| stadium_level         | INT (1-10)       | Nível do estádio              |
| training_center_level | INT (1-10)       | Nível do CT                   |
| youth_facility_level  | INT (1-10)       | Nível das instalações da base |
| stadium_upgrade_cost  | DECIMAL(15,2)    | Custo para upgrade            |
| training_upgrade_cost | DECIMAL(15,2)    |                               |
| youth_upgrade_cost    | DECIMAL(15,2)    |                               |

#### `Competition`

| Coluna        | Tipo         | Descrição                                                            |
| ------------- | ------------ | -------------------------------------------------------------------- |
| id            | UUID (PK)    |                                                                      |
| save_game_id  | UUID (FK)    |                                                                      |
| name          | VARCHAR(100) | Ex: "Campeonato Brasileiro Série A"                                  |
| type          | ENUM         | 'league', 'cup', 'continental', 'national_cup', 'state_championship' |
| country_id    | UUID (FK)    | Nullable para continentais                                           |
| format        | ENUM         | 'round_robin', 'home_away', 'knockout', 'group_then_knockout'        |
| current_round | INT          |                                                                      |

#### `CompetitionSeason`

| Coluna           | Tipo      | Descrição                                |
| ---------------- | --------- | ---------------------------------------- |
| id               | UUID (PK) |                                          |
| competition_id   | UUID (FK) |                                          |
| season_year      | INT       |                                          |
| status           | ENUM      | 'not_started', 'in_progress', 'finished' |
| champion_club_id | UUID (FK) |                                          |

#### `CompetitionGroup`

| Coluna                | Tipo        | Descrição     |
| --------------------- | ----------- | ------------- |
| id                    | UUID (PK)   |               |
| competition_season_id | UUID (FK)   |               |
| name                  | VARCHAR(10) | Ex: "Grupo A" |

#### `Standing`

| Coluna                | Tipo      | Descrição         |
| --------------------- | --------- | ----------------- |
| id                    | UUID (PK) |                   |
| competition_season_id | UUID (FK) |                   |
| competition_group_id  | UUID (FK) | Nullable          |
| club_id               | UUID (FK) |                   |
| position              | INT       | Posição na tabela |
| played                | INT       | Jogos             |
| won                   | INT       | Vitórias          |
| drawn                 | INT       | Empates           |
| lost                  | INT       | Derrotas          |
| goals_for             | INT       | Gols marcados     |
| goals_against         | INT       | Gols sofridos     |
| goal_difference       | INT       | Saldo de gols     |
| points                | INT       | Pontos            |

#### `Fixture`

| Coluna                | Tipo              | Descrição                           |
| --------------------- | ----------------- | ----------------------------------- |
| id                    | UUID (PK)         |                                     |
| competition_season_id | UUID (FK)         |                                     |
| round                 | INT               | Rodada                              |
| match_date            | DATE              | Data da partida                     |
| home_club_id          | UUID (FK)         |                                     |
| away_club_id          | UUID (FK)         |                                     |
| match_id              | UUID (FK → Match) | Nullable (preenchido quando jogado) |
| is_played             | BOOLEAN           |                                     |

#### `Match`

| Coluna         | Tipo          | Descrição                              |
| -------------- | ------------- | -------------------------------------- |
| id             | UUID (PK)     |                                        |
| fixture_id     | UUID (FK)     |                                        |
| home_club_id   | UUID (FK)     |                                        |
| away_club_id   | UUID (FK)     |                                        |
| home_score     | INT           |                                        |
| away_score     | INT           |                                        |
| home_tactic_id | UUID (FK)     |                                        |
| away_tactic_id | UUID (FK)     |                                        |
| attendance     | INT           | Público presente                       |
| ticket_revenue | DECIMAL(12,2) | Renda                                  |
| status         | ENUM          | 'scheduled', 'in_progress', 'finished' |
| played_at      | TIMESTAMP     |                                        |

#### `MatchEvent`

| Coluna              | Tipo      | Descrição                                                                                                                                       |
| ------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| id                  | UUID (PK) |                                                                                                                                                 |
| match_id            | UUID (FK) |                                                                                                                                                 |
| minute              | INT       | Minuto do evento                                                                                                                                |
| type                | ENUM      | 'goal', 'own_goal', 'penalty_goal', 'penalty_miss', 'yellow_card', 'red_card', 'substitution', 'injury', 'half_time', 'full_time', 'commentary' |
| player_id           | UUID (FK) | Jogador principal                                                                                                                               |
| secondary_player_id | UUID (FK) | Jogador secundário (assistência, substituído)                                                                                                   |
| club_id             | UUID (FK) | Clube do jogador                                                                                                                                |
| description         | TEXT      | Narração/comentário                                                                                                                             |

#### `Season`

| Coluna       | Tipo      | Descrição                 |
| ------------ | --------- | ------------------------- |
| id           | UUID (PK) |                           |
| save_game_id | UUID (FK) |                           |
| year         | INT       |                           |
| status       | ENUM      | 'in_progress', 'finished' |
| start_date   | DATE      |                           |
| end_date     | DATE      |                           |

#### `Career`

| Coluna          | Tipo         | Descrição       |
| --------------- | ------------ | --------------- |
| id              | UUID (PK)    |                 |
| save_game_id    | UUID (FK)    |                 |
| manager_name    | VARCHAR(100) | Nome do técnico |
| reputation      | INT (1-100)  | Reputação       |
| current_club_id | UUID (FK)    |                 |
| total_matches   | INT          |                 |
| total_wins      | INT          |                 |
| total_draws     | INT          |                 |
| total_losses    | INT          |                 |
| total_titles    | INT          |                 |

#### `CareerHistory`

| Coluna                | Tipo         | Descrição        |
| --------------------- | ------------ | ---------------- |
| id                    | UUID (PK)    |                  |
| career_id             | UUID (FK)    |                  |
| club_id               | UUID (FK)    |                  |
| club_name             | VARCHAR(100) |                  |
| season_year           | INT          |                  |
| matches               | INT          |                  |
| wins                  | INT          |                  |
| draws                 | INT          |                  |
| losses                | INT          |                  |
| titles_won            | TEXT[]       | Array de títulos |
| final_league_position | INT          |                  |

---

## 6. Backend — Módulos e API

### 6.1 Lista Completa de Endpoints

#### SaveGame (`/api/save-games`)

| Método | Rota                    | Descrição                   |
| ------ | ----------------------- | --------------------------- |
| GET    | `/`                     | Listar saves do usuário     |
| POST   | `/`                     | Criar novo save (novo jogo) |
| GET    | `/:id`                  | Obter estado do save        |
| PUT    | `/:id`                  | Atualizar save              |
| DELETE | `/:id`                  | Deletar save                |
| POST   | `/:id/advance-day`      | Avançar um dia no jogo      |
| POST   | `/:id/advance-to-match` | Avançar até próximo jogo    |
| POST   | `/:id/end-season`       | Processar fim de temporada  |

#### Country (`/api/saves/:saveId/countries`)

| Método | Rota           | Descrição                 |
| ------ | -------------- | ------------------------- |
| GET    | `/`            | Listar países disponíveis |
| GET    | `/:id`         | Detalhes do país          |
| GET    | `/:id/leagues` | Ligas do país             |

#### League (`/api/saves/:saveId/leagues`)

| Método | Rota             | Descrição        |
| ------ | ---------------- | ---------------- |
| GET    | `/`              | Listar ligas     |
| GET    | `/:id`           | Detalhes da liga |
| GET    | `/:id/clubs`     | Clubes da liga   |
| GET    | `/:id/standings` | Classificação    |

#### Club (`/api/saves/:saveId/clubs`)

| Método | Rota                  | Descrição                        |
| ------ | --------------------- | -------------------------------- |
| GET    | `/`                   | Listar clubes (filtros)          |
| GET    | `/:id`                | Detalhes do clube                |
| GET    | `/:id/squad`          | Elenco do clube                  |
| GET    | `/:id/finances`       | Finanças do clube                |
| GET    | `/:id/infrastructure` | Infraestrutura                   |
| PATCH  | `/:id/select`         | Selecionar como clube gerenciado |

#### Player (`/api/saves/:saveId/players`)

| Método | Rota           | Descrição                                       |
| ------ | -------------- | ----------------------------------------------- |
| GET    | `/`            | Listar jogadores (filtros, paginação, busca)    |
| GET    | `/:id`         | Detalhes do jogador                             |
| GET    | `/:id/history` | Histórico de estatísticas                       |
| GET    | `/free-agents` | Jogadores livres                                |
| GET    | `/search`      | Busca avançada (posição, overall, idade, valor) |

#### YouthAcademy (`/api/saves/:saveId/clubs/:clubId/youth-academy`)

| Método | Rota           | Descrição                |
| ------ | -------------- | ------------------------ |
| GET    | `/`            | Listar jogadores da base |
| GET    | `/:id`         | Detalhes do jovem        |
| POST   | `/:id/promote` | Promover ao profissional |
| DELETE | `/:id/release` | Dispensar da base        |

#### Tactic (`/api/saves/:saveId/clubs/:clubId/tactics`)

| Método | Rota            | Descrição                      |
| ------ | --------------- | ------------------------------ |
| GET    | `/`             | Listar todas as táticas salvas |
| POST   | `/`             | Criar nova tática              |
| GET    | `/:id`          | Detalhes da tática             |
| PUT    | `/:id`          | Atualizar tática               |
| DELETE | `/:id`          | Remover tática                 |
| PATCH  | `/:id/activate` | Definir como tática ativa      |

#### Transfer (`/api/saves/:saveId/transfers`)

| Método | Rota                        | Descrição                          |
| ------ | --------------------------- | ---------------------------------- |
| GET    | `/offers/incoming`          | Propostas recebidas                |
| GET    | `/offers/outgoing`          | Propostas enviadas                 |
| POST   | `/offers`                   | Fazer proposta                     |
| PATCH  | `/offers/:id/accept`        | Aceitar proposta                   |
| PATCH  | `/offers/:id/reject`        | Rejeitar proposta                  |
| PATCH  | `/offers/:id/counter`       | Contraproposta                     |
| GET    | `/history`                  | Histórico de transferências        |
| POST   | `/list-player/:playerId`    | Colocar na lista de transferências |
| DELETE | `/list-player/:playerId`    | Remover da lista                   |
| POST   | `/release-player/:playerId` | Liberar jogador (sem custo)        |

#### Finance (`/api/saves/:saveId/clubs/:clubId/finances`)

| Método | Rota             | Descrição                 |
| ------ | ---------------- | ------------------------- |
| GET    | `/`              | Resumo financeiro         |
| GET    | `/transactions`  | Histórico de transações   |
| PATCH  | `/ticket-price`  | Ajustar preço do ingresso |
| GET    | `/salary-report` | Relatório salarial        |

#### Infrastructure (`/api/saves/:saveId/clubs/:clubId/infrastructure`)

| Método | Rota                       | Descrição                |
| ------ | -------------------------- | ------------------------ |
| GET    | `/`                        | Estado da infraestrutura |
| POST   | `/upgrade-stadium`         | Melhorar estádio         |
| POST   | `/upgrade-training-center` | Melhorar CT              |
| POST   | `/upgrade-youth-facility`  | Melhorar base            |

#### Competition (`/api/saves/:saveId/competitions`)

| Método | Rota               | Descrição                  |
| ------ | ------------------ | -------------------------- |
| GET    | `/`                | Listar competições do save |
| GET    | `/:id`             | Detalhes da competição     |
| GET    | `/:id/standings`   | Classificação              |
| GET    | `/:id/fixtures`    | Calendário de jogos        |
| GET    | `/:id/top-scorers` | Artilharia                 |
| GET    | `/:id/groups`      | Grupos (se aplicável)      |

#### Match (`/api/saves/:saveId/matches`)

| Método | Rota                 | Descrição                              |
| ------ | -------------------- | -------------------------------------- |
| GET    | `/next`              | Próximo jogo do time gerenciado        |
| GET    | `/:id`               | Detalhes da partida                    |
| GET    | `/:id/events`        | Eventos da partida                     |
| POST   | `/:id/simulate`      | Simular partida                        |
| POST   | `/:id/substitute`    | Fazer substituição (durante simulação) |
| PATCH  | `/:id/change-tactic` | Mudar tática (durante simulação)       |
| GET    | `/:id/stats`         | Estatísticas da partida                |

#### Career (`/api/saves/:saveId/career`)

| Método | Rota                 | Descrição                   |
| ------ | -------------------- | --------------------------- |
| GET    | `/`                  | Dados da carreira           |
| GET    | `/history`           | Histórico por clube         |
| GET    | `/offers`            | Propostas de emprego        |
| POST   | `/offers/:id/accept` | Aceitar proposta de emprego |
| POST   | `/resign`            | Pedir demissão              |

#### Stats (`/api/saves/:saveId/stats`)

| Método | Rota                | Descrição             |
| ------ | ------------------- | --------------------- |
| GET    | `/top-scorers`      | Artilheiros gerais    |
| GET    | `/top-assists`      | Assistências          |
| GET    | `/champion-history` | Histórico de campeões |
| GET    | `/records`          | Recordes              |
| GET    | `/player-rankings`  | Ranking de jogadores  |

#### Editor (`/api/saves/:saveId/editor`)

| Método | Rota           | Descrição      |
| ------ | -------------- | -------------- |
| PUT    | `/players/:id` | Editar jogador |
| PUT    | `/clubs/:id`   | Editar clube   |
| POST   | `/players`     | Criar jogador  |
| POST   | `/clubs`       | Criar clube    |

#### Season (`/api/saves/:saveId/seasons`)

| Método | Rota       | Descrição                  |
| ------ | ---------- | -------------------------- |
| GET    | `/current` | Temporada corrente         |
| GET    | `/`        | Listar todas as temporadas |
| GET    | `/:year`   | Resumo da temporada        |

---

## 7. Frontend — Páginas e Componentes

### 7.1 Mapa de Rotas

```
/                           →  Redirect → /menu

/menu                       →  Menu Principal (Novo Jogo, Carregar, Configurações)
/new-game                   →  Fluxo: Selecionar País → Liga → Clube
/load-game                  →  Lista de saves salvos

/game                       →  Layout principal do jogo (com sidebar)
  /dashboard                →  Painel principal do clube
  /squad                    →  Lista do elenco
  /squad/:playerId          →  Detalhe do jogador
  /tactics                  →  Editor de táticas
  /transfers                →  Mercado de transferências
  /transfers/negotiations   →  Negociações em andamento
  /transfers/history        →  Histórico de transferências
  /transfers/free-agents    →  Jogadores livres
  /youth-academy            →  Categorias de base
  /finances                 →  Visão financeira
  /infrastructure           →  Melhorias do clube
  /competitions             →  Lista de competições
  /competitions/:id         →  Detalhes da competição (tabela/chaves)
  /competitions/:id/fixtures → Calendário
  /match/pre/:fixtureId     →  Pré-jogo (escalação, tática)
  /match/live/:matchId      →  Partida ao vivo (texto + 2D)
  /match/post/:matchId      →  Pós-jogo (estatísticas)
  /career                   →  Visão da carreira
  /career/offers            →  Propostas de emprego
  /stats                    →  Estatísticas gerais
  /stats/rankings           →  Rankings
  /stats/champions          →  Histórico de campeões
  /editor                   →  Editor de jogadores e clubes
  /settings                 →  Configurações do jogo
```

### 7.2 Componentes-Chave por Feature

#### Dashboard

- **NextMatchCard**: Exibe próximo jogo com data, adversário, competição
- **FinanceSummary**: Saldo, receita/despesa do mês
- **LeaguePosition**: Posição atual na liga principal
- **RecentResults**: Últimos 5 resultados
- **NewsFeed**: Notícias (transferências, resultados, revelações da base)

#### Elenco (Squad)

- **SquadTable**: Tabela completa com ordenação e filtro por posição
- **PlayerAttributes**: Gráfico radar de atributos
- **PlayerHistory**: Histórico de temporadas em tabela

#### Táticas

- **FormationPicker**: Seletor de formação com preview
- **PitchView**: Campo 2D com posições arrastáveis (drag & drop)
- **PlayerSlot**: Slot de jogador no campo (mostra minicard)
- **TacticOptions**: Estilo, marcação, impedimento, goleiro
- **SetPieceConfig**: Seleção de cobradores de bola parada

#### Transferências

- **PlayerSearchFilters**: Filtros avançados (posição, idade, overall, valor, nacionalidade)
- **OfferDialog**: Modal de proposta com campos de valor, salário, tipo
- **IncomingOffers**: Lista de propostas recebidas com ações
- **LoanManagement**: Gerenciamento de empréstimos

#### Dia de Jogo (Match Day)

- **MatchTextCommentary**: Narração em texto com scroll automático
- **MatchPitch2D**: Animação simples do campo (canvas/SVG) mostrando posição da bola
- **Scoreboard**: Placar em tempo real
- **MatchStats**: Estatísticas (posse, finalizações, escanteios)
- **SubstitutionPanel**: Painel de substituições (max 5)
- **LiveTacticChange**: Trocar tática durante o jogo
- **MatchTimeline**: Linha do tempo visual dos eventos
- **MatchEventsLog**: Log completo dos eventos

#### Finanças

- **BalanceChart**: Gráfico de evolução do saldo
- **SalaryList**: Lista de salários com total
- **TransactionHistory**: Tabela de transações com filtros
- **TicketPricing**: Ajuste de preço dos ingressos

---

## 8. Motor de Simulação (Game Engine)

### 8.1 Visão Geral

O motor de simulação é o coração do jogo. Ele roda inteiramente no **backend** e é responsável por:

1. **Simular partidas** minuto a minuto
2. **Gerar eventos** (gols, cartões, substituições, etc.)
3. **Calcular resultados** baseado nos atributos dos jogadores e táticas
4. **Processar evolução** dos jogadores entre temporadas
5. **Gerar transferências automáticas** (IA dos outros clubes)
6. **Revelar jogadores da base** aleatoriamente
7. **Processar promoção/rebaixamento**

### 8.2 Simulação de Partida

```
SimulationService.simulateMatch(match, homeConfig, awayConfig)
│
├── Calcular força dos times (baseado em overall + tática + moral + mando)
├── Para cada minuto (0-90 + acréscimos):
│   ├── Determinar posse de bola (probabilidade baseada em meio-campo)
│   ├── Gerar ação (ataque, falta, escanteio, nada)
│   ├── Se ataque:
│   │   ├── Calcular chance de finalização
│   │   ├── Calcular chance de gol (ataque vs defesa/goleiro)
│   │   ├── Se gol: gerar evento Goal
│   │   └── Se não: gerar evento (defesa, trave, fora)
│   ├── Verificar chance de cartão (baseado em agressividade)
│   ├── Verificar chance de lesão (baseado em injury_proneness)
│   └── Gerar narração/comentário
│
├── Intervalo (minuto 45):
│   └── Permitir substituições/mudança tática
│
├── Segundo tempo (45-90):
│   └── Mesma lógica, com fadiga aplicada
│
├── Acréscimos:
│   └── 1-5 minutos extras
│
└── Fim: retornar resultado + eventos + estatísticas
```

### 8.3 Cálculo de Força do Time

```typescript
teamStrength =
	avgOverall * 0.4 +
	tacticBonus * 0.15 +
	moraleBonus * 0.1 +
	homeAdvantage * 0.1 +
	keyPlayersBonus * 0.15 +
	fitnessAvg * 0.1
```

### 8.4 Evolução de Jogadores (Fim de Temporada)

```
Para cada jogador:
├── Se idade < 24 e overall < potential:
│   └── Ganhar 1-5 de overall (influenciado por CT level e jogos disputados)
├── Se idade entre 24 e 30:
│   └── Estabilidade (variação de -1 a +2)
├── Se idade entre 30 e 33:
│   └── Declínio leve (-1 a -3)
├── Se idade > 33:
│   └── Declínio acentuado (-2 a -5)
│   └── Chance de aposentadoria (aumenta com idade)
└── Atualizar market_value baseado no overall
```

### 8.5 IA de Transferências

```
Para cada clube controlado pela IA:
├── Avaliar elenco (posições fracas)
├── Buscar jogadores disponíveis
├── Gerar ofertas com valores realistas
├── Aceitar/rejeitar ofertas recebidas (baseado em overall + necessidade)
├── Vender jogadores excedentes
└── Contratar jogadores da base se nível alto
```

### 8.6 Geração de Jogadores da Base

```
Para cada clube (fim de temporada):
├── Quantidade baseada no youth_facility_level (1-4 jogadores)
├── Gerar atributos aleatórios
├── Potential baseado em:
│   ├── youth_facility_level
│   ├── Sorte (random)
│   └── Reputação do clube
├── Nome gerado aleatoriamente (baseado no país)
└── Idade: 15-18 anos
```

---

## 9. Fases de Desenvolvimento (Sprints)

### Fase 0 — Setup e Fundação (Sprint 1-2) — ~2 semanas

> Status revisado em 13/02/2026 com base no código atual.

**Backend:**

- [x] Inicializar projeto NestJS 11 com TypeScript
- [x] Configurar TypeORM com PostgreSQL
- [x] Configurar ESLint + Prettier
- [x] Configurar Swagger
- [x] Implementar module structure base
- [x] Criar helpers comuns (filters, pipes, interceptors, guards)
- [x] Implementar módulo User
- [x] Implementar sessão local sem autenticação (single-manager)
- [x] Criar camadas genéricas reutilizáveis (BaseRepository, BaseCrudService, paginação)
- [x] Criar entidades base: User, SaveGame
- [x] Primeiro migration

**Frontend:**

- [x] Inicializar projeto Angular 21 (standalone)
- [x] Configurar Tailwind CSS 4
- [x] Configurar ESLint + Prettier
- [x] Criar estrutura de pastas (core, shared, features)
- [x] Implementar layout base (app shell)
- [x] Criar componentes shared base (header, sidebar, loading, toast)
- [x] Implementar serviço de API (HttpClient + interceptors)
- [x] Implementar sessão local sem autenticação (seleção direta de save)
- [x] Criar componentes e serviços genéricos reutilizáveis
- [x] Configurar routing base

**Entregável:** Base funcional sem autenticação, com estrutura reutilizável nos dois lados

---

### Fase 1 — Dados do Mundo (Sprint 3-4) — ~2 semanas

**Backend:**

- [x] Criar entidades: Country, League, Club, Player
- [x] Criar endpoints CRUD para countries, leagues, clubs
- [x] Criar endpoints para players com busca avançada e paginação
- [x] Implementar módulo SaveGame completo
- [x] Criar seeds de dados: países (Brasil + 5-10 países), ligas, clubes, jogadores
- [x] Implementar sistema de criação de novo jogo (copia seed → save)
- [x] Migrations

**Frontend:**

- [x] Tela de Menu Principal
- [x] Fluxo de Novo Jogo (seleção de país → liga → clube)
- [x] Tela de carregar save
- [x] Implementar GameStateService com Signals
- [x] Design do layout do jogo (navegação principal)

**Entregável:** Criar novo jogo, selecionar clube, visualizar dados iniciais

---

### Fase 2 — Gerenciamento do Clube (Sprint 5-7) — ~3 semanas

**Backend:**

- [x] Implementar módulo Club completo
- [x] Implementar módulo Player com filtros e stats
- [x] Implementar módulo Tactic (CRUD, formações, posições)
- [x] Implementar módulo Finance (saldo, transações, ticket)
- [x] Implementar módulo Infrastructure (upgrade, custos, impacto)
- [x] Validações de negócio (saldo suficiente para upgrade, etc.)

**Frontend:**

- [x] Dashboard do clube com resumo
- [x] Lista do elenco com tabela ordenável e filtros
- [x] Tela de detalhes do jogador (atributos, histórico)
- [x] Editor de táticas com campo 2D e drag & drop
- [x] Seletor de formação visual
- [x] Painel de finanças com gráficos
- [x] Tela de infraestrutura com cards de upgrade

**Entregável:** Gerenciamento completo do clube (elenco, tática, finanças, estrutura)

---

### Fase 3 — Transferências (Sprint 8-9) — ~2 semanas

**Backend:**

- [x] Implementar módulo Transfer completo
- [x] Sistema de propostas (criar, aceitar, rejeitar, contraproposta)
- [x] Transferências: compra, venda, empréstimo, troca, liberação
- [x] Validações de valor, saldo, limite de elenco
- [x] Endpoint de jogadores livres (free agents)
- [x] Listar/remover da lista de transferências

**Frontend:**

- [x] Mercado de transferências com busca e filtros avançados
- [x] Lista de jogadores disponíveis
- [x] Painel de proposta (valor, tipo, detalhes)
- [x] Tela de negociações em andamento (enviadas e recebidas)
- [x] Histórico de transferências
- [x] Lista de jogadores livres
- [x] Feedback visual de status (aceito, rejeitado, pendente)

**Entregável:** Sistema de transferências funcional completo

---

### Fase 4 — Competições e Calendário (Sprint 10-12) — ~3 semanas

**Backend:**

- [x] Implementar módulo Competition
- [x] Implementar módulo CompetitionSeason + Standing
- [x] Implementar módulo Fixture (geração de calendário)
- [x] Algoritmo de geração de rodadas (round-robin, ida e volta)
- [x] Algoritmo de geração de chaves (mata-mata)
- [x] Suporte a fase de grupos + mata-mata (Libertadores)
- [x] Implementar módulo Season
- [x] Gerar fixtures na criação de nova temporada
- [x] Atualizar standings após cada partida

**Frontend:**

- [x] Lista de competições do save
- [x] Tabela de classificação (liga) com cores de zona
- [x] Calendário de jogos (fixtures)
- [x] Chaves de mata-mata visual
- [x] Fase de grupos
- [x] Artilharia por competição
- [x] Seletor de rodada

**Entregável:** Competições configuradas com calendário e classificação

---

### Fase 5 — Motor de Simulação e Dia de Jogo (Sprint 13-16) — ~4 semanas

**Backend:**

- [x] Implementar MatchEngine (SimulationService)
- [x] Implementar EventGenerator (gols, cartões, lesões, substituições)
- [x] Implementar CommentaryService (narração em texto)
- [x] Implementar RatingService (notas dos jogadores)
- [x] Calcular força dos times e probabilidades
- [x] Simulação minuto a minuto com estado
- [x] Suporte a substituições e mudança tática durante partida
- [x] Simular todas as partidas da rodada (jogador + IA)
- [x] Atualizar standings, stats dos jogadores
- [x] Atualizar finanças (bilheteria)
- [x] Implementar módulo Match completo com eventos persistidos
- [x] Implementar realtime de partida via WebSocket (Gateway `/match-live`)
- [x] Processar controles de transmissão no backend (start/pause/resume/step/reset/speed)
- [x] Sincronizar ações do técnico em tempo real e persistir no histórico da partida
- [x] Garantir nova sessão limpa ao iniciar partida (sem reaproveitar eventos antigos)

**Frontend:**

- [x] Tela de pré-jogo (escalação, tática, previsão)
- [x] Tela de partida ao vivo — Modo Texto (narração com scroll automático)
- [x] Tela de partida ao vivo — Animação 2D (canvas/SVG campo + bola)
- [x] Placar em tempo real
- [x] Painel de substituições
- [x] Botão de troca de tática ao vivo
- [x] Timeline de eventos
- [x] Tela de pós-jogo (resultado, estatísticas, notas, destaques)
- [x] Transição animada entre minutos
- [x] Integração realtime via Socket.IO para estado da partida ao vivo

**Entregável:** Simulação de partidas completa com interação ao vivo

---

### Fase 6 — Progressão e Fim de Temporada (Sprint 17-19) — ~3 semanas

**Backend:**

- [x] Implementar PlayerEvolutionService (evolução por idade/tempo)
- [x] Implementar PlayerAgingService (declínio)
- [x] Implementar RetirementService (aposentadoria)
- [x] Implementar PromotionRelegationService
- [x] Implementar YouthAcademy (geração de jogadores, promoção)
- [x] Processamento de fim de temporada completo (MVP):
  - Promoção/rebaixamento
  - Evolução de jogadores
  - Aposentadorias
  - Fim de contratos
  - Geração de novos jovens da base
  - Atualização de valores de mercado
  - Reset de stats sazonais
- [x] Inicialização de nova temporada
- [x] Avanço de dia / avanço até próximo jogo

**Frontend:**

- [x] Tela de categorias de base (lista, promover, dispensar)
- [x] Tela de resumo de fim de temporada
- [x] Animação de promoção/rebaixamento
- [x] Lista de aposentadorias
- [x] Lista de novos jogadores revelados
- [x] Renovação de contratos
- [x] Botão de avançar dia / avançar até jogo
- [x] Tela de início de nova temporada

**Entregável:** Ciclo completo de temporada com evolução e base

---

### Fase 7 — IA e Transferências Automáticas (Sprint 20-21) — ~2 semanas

> Fase iniciada em 13/02/2026.

**Backend:**

- [ ] IA de transferências para clubes não gerenciados
- [ ] Clubes da IA avaliam elenco e fazem contratações
- [x] Geração automática de propostas (para o jogador e entre clubes)
- [ ] IA aceita/rejeita propostas baseada em critérios lógicos
- [ ] Rotação de elenco da IA (substituir jogadores velhos)
- [ ] Propostas de emprego (outros clubes convidam o manager)
- [x] Endpoint para executar ciclo de IA de transferências (`POST /transfers/ai/run`)

**Frontend:**

- [ ] Notificações de propostas automáticas recebidas
- [ ] Feed de notícias sobre transferências de outros clubes
- [ ] Propostas de emprego com detalhes do clube

**Entregável:** IA funcional gerenciando clubes adversários

---

### Fase 8 — Carreira, Estatísticas e Rankings (Sprint 22-23) — ~2 semanas

**Backend:**

- [ ] Implementar módulo Career completo
- [ ] Histórico da carreira por clube (CareerHistory)
- [ ] Reputação do técnico (baseada em resultados)
- [ ] Mudar de clube / pedir demissão
- [ ] Implementar módulo Stats
- [ ] Artilharia geral, assistências
- [ ] Histórico de campeões
- [ ] Recordes (mais gols em uma temporada, etc.)
- [ ] Player rankings

**Frontend:**

- [ ] Tela de carreira do técnico (timeline, troféus, reputação)
- [ ] Tela de propostas de emprego
- [ ] Tela de estatísticas da temporada
- [ ] Rankings globais de jogadores
- [ ] Histórico de campeões por competição
- [ ] Tela de recordes

**Entregável:** Modo carreira e sistema de estatísticas completos

---

### Fase 9 — Editor de Dados (Sprint 24) — ~1 semana

**Backend:**

- [ ] Implementar módulo Editor
- [ ] Endpoints para edição de jogadores (atributos, clube, posição)
- [ ] Endpoints para edição de clubes (nome, cores, liga)
- [ ] Criação de jogadores customizados
- [ ] Validações (limites de atributos, consistência)

**Frontend:**

- [ ] Editor de jogadores (formulário completo de atributos)
- [ ] Editor de clubes (nome, cores, escudo)
- [ ] Criação de jogadores
- [ ] Preview de alterações

**Entregável:** Editor funcional de dados do jogo

---

### Fase 10 — Polimento e UX (Sprint 25-27) — ~3 semanas

**Backend:**

- [ ] Otimização de queries (eager/lazy loading, índices)
- [ ] Cache de dados frequentes (standings, fixtures)
- [ ] Rate limiting refinado
- [ ] Tratamento de erros robusto
- [ ] Logs estruturados
- [ ] Validação completa de todos os DTOs

**Frontend:**

- [ ] Animações e transições (Angular Animations)
- [ ] Responsividade completa (mobile-first com Tailwind)
- [ ] Dark mode
- [ ] Loading states em todas as telas
- [ ] Empty states com ilustrações
- [ ] Toasts de feedback em todas as ações
- [ ] Tutorial/onboarding para novos jogadores
- [ ] Atalhos de teclado
- [ ] Otimização de performance (lazy loading de rotas, virtual scroll)
- [ ] Testes de usabilidade e ajustes finais

**Entregável:** Aplicação polida, responsiva e agradável de usar

---

### Fase 11 — Testes e Qualidade (Sprint 28-29) — ~2 semanas

**Backend:**

- [ ] Testes unitários para todos os services (Jest)
- [ ] Testes do Match Engine (cenários de simulação)
- [ ] Testes e2e dos endpoints principais (Supertest)
- [ ] Coverage mínimo de 80%
- [ ] Testes de integração com banco

**Frontend:**

- [ ] Testes unitários dos services (Jest/Karma)
- [ ] Testes de componentes-chave
- [ ] Testes e2e fluxos críticos (Playwright/Cypress)
  - Menu Principal → Novo Jogo → Selecionar Clube
  - Simular partida
  - Fazer transferência
  - Avançar temporada
- [ ] Coverage mínimo de 70%

**Entregável:** Suite de testes robusta

---

## 10. Padrões e Convenções

### 10.1 Nomenclatura

| Item                | Convenção             | Exemplo                               |
| ------------------- | --------------------- | ------------------------------------- |
| Arquivos (backend)  | kebab-case            | `match-engine.service.ts`             |
| Arquivos (frontend) | kebab-case            | `player-card.component.ts`            |
| Classes             | PascalCase            | `PlayerService`, `MatchEngineService` |
| Interfaces          | PascalCase com sufixo | `PaginatedResult`, `MatchState`       |
| Enums               | PascalCase            | `Position`, `FormationType`           |
| Variáveis           | camelCase             | `currentSeason`, `totalGoals`         |
| Tabelas DB          | snake_case            | `player_stats_history`                |
| Colunas DB          | snake_case            | `goals_for`, `market_value`           |
| Endpoints           | kebab-case, plural    | `/api/saves/:id/clubs`                |
| DTOs                | PascalCase + sufixo   | `CreatePlayerDto`, `MatchResponseDto` |
| Componentes Angular | kebab-case selector   | `app-player-card`                     |
| Signals Angular     | camelCase com ()      | `players()`, `isLoading()`            |

### 10.2 Padrões de Código

#### Princípios obrigatórios para este projeto

- **Reaproveitamento máximo (DRY):** evitar duplicação de lógica entre módulos e features.
- **Estruturas genéricas primeiro:** extrair comportamento comum para classes/funções genéricas antes de repetir código.
- **Componentização e serviços reutilizáveis:** priorizar blocos compartilhados no frontend e serviços base no backend.
- **Comentários mínimos:** não adicionar comentários desnecessários; comentar apenas regras de negócio não óbvias.

#### Backend (NestJS)

- **Validação:** Usar `class-validator` em todos os DTOs com `ValidationPipe` global
- **Transformação:** Usar `class-transformer` com `@Exclude()` para dados sensíveis
- **Errors:** Usar `HttpException` com códigos HTTP corretos e mensagens claras
- **Paginação:** Retornar `{ data: T[], meta: { total, page, limit, totalPages } }`
- **Relations:** Usar `@Relation` com cuidado; preferir queries explícitas para performance
- **Transactions:** Usar `QueryRunner` para operações que alteram múltiplas tabelas
- **Naming:** Entities no singular (`Player`, não `Players`); tabelas no plural (`players`)

#### Frontend (Angular)

- **Standalone Components:** Todos os componentes são standalone (Angular 21 padrão)
- **Signals:** Usar Signals para estado reativo em vez de BehaviorSubject quando possível
- **Lazy Loading:** Todas as rotas de features são lazy-loaded
- **OnPush:** Usar `ChangeDetectionStrategy.OnPush` em todos os componentes
- **Smart/Dumb:** Pages são smart (injetam services), components shared são dumb (input/output)
- **Tailwind:** Nunca usar CSS custom quando o Tailwind resolve. Usar `@apply` apenas em exceções
- **HttpClient:** Todas as chamadas HTTP passam por services tipados
- **Error Handling:** Interceptor global captura erros e exibe toast

### 10.3 Git

- **Commits:** Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`)
- **Branches:** `main`, `develop`, `feature/xxx`, `bugfix/xxx`, `hotfix/xxx`
- **PRs:** Sempre para `develop`; squash merge
- **Mensagens:** Em português ou inglês (definir e manter consistência)

### 10.4 Variáveis de Ambiente

#### Backend (`.env`)

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=bitfoot
DB_PASSWORD=bitfoot_dev
DB_DATABASE=bitfoot

# App
APP_PORT=3000
APP_PREFIX=api
NODE_ENV=development

# Throttle
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

#### Frontend (`environment.development.ts`)

```typescript
export const environment = {
	production: false,
	apiUrl: 'http://localhost:3000/api',
	appName: 'BitFoot',
}
```

---

## 11. Testes

### 11.1 Estratégia de Testes

```
                    ┌──────────────┐
                    │   E2E Tests  │  ← Poucos, fluxos críticos
                    ├──────────────┤
                    │ Integration  │  ← Endpoints + DB
                    ├──────────────┤
                    │  Unit Tests  │  ← Bulk dos testes
                    └──────────────┘
```

### 11.2 Backend

| Tipo       | Ferramenta       | Cobertura               |
| ---------- | ---------------- | ----------------------- |
| Unitário   | Jest             | Services, Engine, Utils |
| Integração | Jest + Supertest | Controllers + DB        |
| E2E        | Jest + Supertest | Fluxos completos        |

**Testes críticos do Motor:**

- Simulação de partida gera resultado válido
- Gol é marcado corretamente
- Promoção/rebaixamento funciona
- Evolução de jogador respeita regras de idade
- Transferência debita/credita finanças
- Fim de temporada processa corretamente

### 11.3 Frontend

| Tipo       | Ferramenta             | Cobertura              |
| ---------- | ---------------------- | ---------------------- |
| Unitário   | Jest                   | Services, Pipes, Utils |
| Componente | Jest + Testing Library | Componentes-chave      |
| E2E        | Playwright             | Fluxos de usuário      |

---

## 12. Configuração do Ambiente Local

### 12.1 Pré-requisitos

| Software   | Versão Mínima |
| ---------- | ------------- |
| Node.js    | 22.x LTS      |
| npm        | 10.x          |
| PostgreSQL | 16+           |
| Git        | 2.40+         |
| VS Code    | Latest        |

### 12.2 Setup do Backend

```bash
# Clonar repo
cd backend/

# Instalar dependências
npm install

# Copiar variáveis de ambiente
cp .env.example .env
# (editar .env com credenciais do PostgreSQL local)

# Criar banco de dados
# psql -U postgres -c "CREATE DATABASE bitfoot;"
# psql -U postgres -c "CREATE USER bitfoot WITH PASSWORD 'bitfoot_dev';"
# psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE bitfoot TO bitfoot;"

# Rodar migrations
npm run migration:run

# Rodar seeds (dados iniciais)
npm run seed

# Iniciar em modo desenvolvimento
npm run start:dev
# API disponível em http://localhost:3000
# Swagger disponível em http://localhost:3000/api/docs
```

### 12.3 Setup do Frontend

```bash
# Clonar repo
cd frontend/

# Instalar dependências
npm install

# Iniciar em modo desenvolvimento
ng serve
# App disponível em http://localhost:4200
```

### 12.4 Extensões VS Code Recomendadas

- Angular Language Service
- Tailwind CSS IntelliSense
- ESLint
- Prettier
- PostgreSQL (ckolkman)
- Thunder Client (testar API)
- GitLens

---

## Resumo de Estimativa

| Fase                              | Sprints        | Duração Estimada           |
| --------------------------------- | -------------- | -------------------------- |
| 0 — Setup e Fundação              | 1-2            | ~2 semanas                 |
| 1 — Dados do Mundo                | 3-4            | ~2 semanas                 |
| 2 — Gerenciamento do Clube        | 5-7            | ~3 semanas                 |
| 3 — Transferências                | 8-9            | ~2 semanas                 |
| 4 — Competições e Calendário      | 10-12          | ~3 semanas                 |
| 5 — Motor e Dia de Jogo           | 13-16          | ~4 semanas                 |
| 6 — Progressão e Fim de Temporada | 17-19          | ~3 semanas                 |
| 7 — IA e Transferências Auto      | 20-21          | ~2 semanas                 |
| 8 — Carreira e Estatísticas       | 22-23          | ~2 semanas                 |
| 9 — Editor de Dados               | 24             | ~1 semana                  |
| 10 — Polimento e UX               | 25-27          | ~3 semanas                 |
| 11 — Testes e Qualidade           | 28-29          | ~2 semanas                 |
| **TOTAL**                         | **29 sprints** | **~29 semanas (~7 meses)** |

> ⚠️ As estimativas consideram 1 desenvolvedor dedicado. Com mais devs, as fases podem ser paralelizadas (backend e frontend simultaneamente).

---

## Prioridade de Implementação

Se precisar de um MVP funcional rapidamente, a ordem de prioridade é:

1. 🟢 **Fase 0** — Setup (obrigatório)
2. 🟢 **Fase 1** — Dados do Mundo (obrigatório)
3. 🟢 **Fase 2** — Gerenciamento do Clube (core)
4. 🟡 **Fase 4** — Competições (necessário para jogar)
5. 🟡 **Fase 5** — Motor de Simulação (necessário para jogar)
6. 🟡 **Fase 6** — Progressão (necessário para ciclo completo)
7. 🔵 **Fase 3** — Transferências (pode ser simplificado no MVP)
8. 🔵 **Fase 7** — IA (pode ser simplificada no MVP)
9. ⚪ **Fase 8** — Carreira e Stats
10. ⚪ **Fase 9** — Editor
11. ⚪ **Fase 10** — Polimento
12. ⚪ **Fase 11** — Testes aprofundados

---

_Documento criado em 12/02/2026 — BitFoot Development Plan v1.0_
