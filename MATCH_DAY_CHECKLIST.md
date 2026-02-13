# Match Day — Checklist de Validação e Critérios de Aceite

## Como subir ambiente local

- Backend: `c:\BitBot\bit-foot\backend`
- Frontend: `c:\BitBot\bit-foot\frontend`
- Script rápido:
  - Iniciar: `powershell -ExecutionPolicy Bypass -File .\scripts\dev-start.ps1`
  - Encerrar: `powershell -ExecutionPolicy Bypass -File .\scripts\dev-stop.ps1`

## Smoke rápido

- Pré-requisito: backend ativo em `http://localhost:3000`
- Rodar: `powershell -ExecutionPolicy Bypass -File .\scripts\smoke-matchday.ps1`
- Esperado: linha final com `[smoke] OK ...`

## Checklist funcional

### 1) Timeline e eventos
- [ ] Timeline textual não limpa ao avançar minuto.
- [ ] Eventos do minuto continuam cumulativos na tela live.
- [ ] Em readonly, timeline completa da partida aparece.

### 2) Modo readonly
- [ ] Partida já `played` abre sem botões de controle ao vivo.
- [ ] Painel de ações do técnico não aparece em readonly.
- [ ] Placar, estatísticas e ratings finais são exibidos.

### 3) Fluxo live
- [ ] Botão iniciar/pausar funciona.
- [ ] `+1 min` avança corretamente.
- [ ] Reset volta para minuto 0 sem quebrar sessão.
- [ ] Velocidade (1x/2x/3x) altera ritmo de transição visual.

### 4) Animação e coerência visual
- [ ] Campo renderiza 11 marcadores por time e 1 bola.
- [ ] Rótulo contextual muda conforme fase (`jogo corrido`, `pressão`, `bola parada`, `gol`).
- [ ] Jogadores/bola não “teleportam” abruptamente em minutos normais.
- [ ] Fase visual em readonly não fica presa em evento antigo fora do minuto atual.

### 5) Resiliência de concorrência
- [ ] Abrir Match Day e iniciar transmissão não exibe erro técnico de unicidade.
- [ ] Sem mensagem `UQ_matches_fixture_id` para usuário final.

## Critérios de aceite

A entrega do Match Day é considerada aceita quando:

1. Não há regressões de timeline, readonly e posse.
2. O fluxo live permanece interativo para partidas que iniciaram como `scheduled`.
3. Não há exibição de erro técnico bruto para o usuário.
4. O backend compila (`npm run build`) e os testes backend passam (`npm test`).
5. O smoke script executa sem falha.

## Observabilidade mínima

Verificar logs do backend com eventos estruturados:
- `match_live.connected`
- `match_live.join`
- `match_live.control`
- `match_live.coach_action`
- `realtime.bootstrap.reused_match`
- `realtime.bootstrap.simulated_match`
- `realtime.bootstrap.race_recovered`
