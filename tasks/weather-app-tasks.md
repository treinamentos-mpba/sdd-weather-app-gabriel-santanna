# Backlog de Tarefas — Weather App

Tarefas derivadas de [`plans/weather-app-plan.md`](../plans/weather-app-plan.md) e rastreadas aos requisitos da spec. A sequência é: tipos → funções puras → services → hook → componentes → integração → testes → hardening. Dependências apontam sempre para tarefas anteriores.

**Ajuste de estrutura:** o plano ilustra `src/App.tsx`, mas a convenção do projeto coloca componentes em `src/components/` e o `index.html` aponta para `src/main.tsx`. Este backlog usa `src/main.tsx` como entrypoint e `src/components/App.tsx` para o componente raiz.

**Decisões ainda abertas:** não assumir valores para timeout, perfil de rede, lista de navegadores ou regra de arredondamento. Tarefas bloqueadas por essas decisões indicam as perguntas da spec correspondentes.

## Matriz de rastreabilidade funcional

| Requisito da spec | Tarefas de implementação | Tarefas de teste |
| --- | --- | --- |
| **RF-01 — Buscar cidade** | T-07 (geocodificação), T-10 (hook), T-14 (busca/seleção), T-21 (composição) | T-24 (service), T-26 (hook), T-28 (integração), T-29 (E2E) |
| **RF-02 — Exibir clima atual** | T-06 (códigos WMO), T-08 (forecast/API), T-15 (clima atual), T-21 (composição) | T-23 (WMO), T-25 (service), T-28 (integração), T-29 (E2E) |
| **RF-03 — Exibir previsão de cinco dias** | T-02 (datas/timeout), T-03 (lacunas), T-04 (datas), T-06 (códigos WMO), T-08 (forecast/API), T-16 (previsão), T-21 (composição) | T-23 (datas/WMO), T-25 (service), T-28 (integração), T-29 (E2E) |
| **RF-04 — Alternar unidade** | T-05 (conversão), T-15 (clima atual), T-16 (previsão), T-18 (controle), T-19 (estado), T-21 (composição) | T-22 (conversão unitária), T-28 (integração), T-29 (E2E) |
| **RF-05 — Comunicar estados da consulta** | T-07 (erros de geocoding), T-08 (erros de forecast), T-10 (estados/retry), T-14 (UI dos estados), T-21 (composição) | T-24 (service), T-25 (service), T-26 (hook), T-27 (loading/erro/vazio), T-28 (integração), T-29 (E2E) |

Todos os requisitos funcionais RF-01 a RF-05 têm tarefas de implementação e de teste associadas; nenhum RF está sem tarefa correspondente.

## Prioridade e tamanho

**Prioridade:** P0 = caminho crítico para o MVP funcional; P1 = necessário para validar/lançar o MVP, mas pode vir após a primeira fatia; P2 = condicional, executado somente se a decisão externa exigir.

**Tamanho relativo:** P = mudança localizada; M = vários cenários ou integração moderada; G = decisão ampla, orquestração ou fluxo transversal. Não representa estimativa em horas.

| Tarefa | Prioridade | Tamanho |
| --- | --- | --- |
| T-01 | P0 | M |
| T-02 | P0 | M |
| T-03 | P0 | P |
| T-04 | P0 | P |
| T-05 | P0 | P |
| T-06 | P0 | M |
| T-07 | P0 | M |
| T-08 | P0 | G |
| T-09 | P1 | M |
| T-10 | P0 | G |
| T-11 | P0 | P |
| T-12 | P0 | P |
| T-13 | P0 | P |
| T-14 | P0 | M |
| T-15 | P0 | P |
| T-16 | P0 | M |
| T-17 | P0 | M |
| T-18 | P0 | P |
| T-19 | P0 | M |
| T-20 | P2 | P |
| T-21 | P0 | G |
| T-22 | P0 | P |
| T-23 | P0 | P |
| T-24 | P0 | M |
| T-25 | P0 | M |
| T-26 | P0 | M |
| T-27 | P0 | P |
| T-28 | P0 | G |
| T-29 | P0 | G |
| T-30 | P2 | P |
| T-31 | P1 | M |
| T-32 | P1 | M |
| T-33 | P1 | M |

## Sequência de fatias verticais

1. **Shell executável:** T-01, T-11, T-12 e T-13. Entrega uma aplicação React renderizada e estilizada, pronta para receber o primeiro fluxo.
2. **Busca e estados vazios:** T-07, T-10 (caminho de busca), T-14, T-15 e T-21 (composição inicial), validados por T-24, T-26, T-27 e T-28. Entrega busca selecionável, loading, erro recuperável e ausência de resultados.
3. **Clima atual:** T-02, T-03, T-06, T-08, T-10 (consulta meteorológica), T-16 e T-21 (extensão da composição), validados por T-25, T-26, T-28 e T-29. Entrega condições atuais para a cidade escolhida.
4. **Previsão e unidades:** T-04, T-05, T-17, T-18 e T-19, validados por T-22, T-23, T-25, T-28 e T-29. Entrega os cinco dias e alternância C/F sem nova requisição.
5. **Pronto para release:** T-09 e T-31 a T-33; T-20 e T-30 somente se a fonte exigir atribuição.

**Gargalo para a primeira fatia:** hoje T-10 depende de geocoding e forecast, T-11 depende de T-10, e T-21 depende de todos os componentes de clima/previsão/unidade. Para entregar busca e estados vazios antes do forecast, implemente T-10 e T-21 incrementalmente (busca primeiro) ou refine-os em tarefas separadas para busca e consulta meteorológica; remova também a dependência de T-11 em T-10, pois o shell não precisa do hook.

## Entrega 1 — Tipos e contratos

### T-01 — Definir tipos compartilhados
- **Descrição:** declarar `Unit`, `City`, `CurrentWeather`, `ForecastDay`, `WeatherData` e o contrato `WeatherService`.
- **Critérios de aceite:** os tipos exportados têm os nomes e assinaturas descritos no plano; temperaturas do domínio são Celsius; campos meteorológicos ausentes aceitam `null`; `WeatherData` contém cidade, condições atuais e dias; `pnpm build` termina com código 0.
- **Dependências:** Nenhuma.
- **Arquivos prováveis:** `src/types/weather.ts`.
- **Tipo:** Data.
- **Requisitos:** RF-01, RF-02, RF-03, RF-04; AC-02.3, AC-03.4, AC-04.2.

### T-02 — Decidir datas ausentes e timeout
- **Descrição:** fechar as decisões abertas que afetam a normalização do forecast e a recuperação de falhas.
- **Critérios de aceite:** plano registra data de referência e fuso aprovados, regra para detectar/apresentar dias ausentes, duração numérica do timeout e escopo de aplicação; inclui um exemplo de lacuna e um de timeout para testes.
- **Dependências:** T-01.
- **Arquivos prováveis:** `plans/weather-app-plan.md`.
- **Tipo:** Data.
- **Requisitos:** RF-03, RF-05; AC-03.1, AC-03.4, AC-05.3; RNF-04, RNF-05.
- **Bloqueios:** confirmar fuso (Open Question 13) e duração exata do timeout indicada nos edge cases da spec.

### T-03 — Representar lacunas no modelo de forecast
- **Descrição:** ajustar o contrato compartilhado à regra aprovada para dias sem dados.
- **Critérios de aceite:** `forecastDays` tem uma posição por data do intervalo aprovado; dia sem resposta preserva seu `date` e tem `minTemperatureC`, `maxTemperatureC` e `weatherCode` como `null`; datas seguintes permanecem inalteradas.
- **Dependências:** T-02.
- **Arquivos prováveis:** `src/types/weather.ts`.
- **Tipo:** Data.
- **Requisitos:** RF-03; AC-03.1, AC-03.4.

## Entrega 2 — Funções puras

### T-04 — Implementar formatação de datas locais
- **Descrição:** reutilizar e ajustar as funções existentes para apresentar datas ISO da previsão sem conversão indevida de fuso.
- **Critérios de aceite:** para entrada `2026-10-29`, a data curta mostra `29 Out`; índice 0 retorna `Hoje` e índice 1 retorna `Amanhã`; a mesma string ISO mantém o dia exibido em fusos de dispositivo diferentes.
- **Dependências:** T-02.
- **Arquivos prováveis:** `src/lib/format.ts`.
- **Tipo:** Data.
- **Requisitos:** RF-03; AC-03.1, AC-03.4; RNF-05.

### T-05 — Implementar conversão de temperatura
- **Descrição:** criar função pura que converte Celsius para a unidade de apresentação solicitada.
- **Critérios de aceite:** `convertTemperature(0, 'celsius')` retorna 0; `convertTemperature(0, 'fahrenheit')` retorna 32; `convertTemperature(100, 'fahrenheit')` retorna 212; a função não arredonda nem altera o argumento.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/lib/temperature.ts`.
- **Tipo:** Data.
- **Requisitos:** RF-04; AC-04.2, AC-04.3, AC-04.4.

### T-06 — Implementar descrição dos códigos WMO
- **Descrição:** mapear códigos meteorológicos conhecidos para rótulos em pt-BR.
- **Critérios de aceite:** código WMO 0 retorna `Céu limpo`; código 61 retorna `Chuva fraca`; `null` e código não mapeado retornam ausência de descrição confirmada.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/lib/weatherCode.ts`.
- **Tipo:** Data.
- **Requisitos:** RF-02, RF-03; AC-02.1, AC-03.2, AC-03.4; RNF-05.

## Entrega 3 — Services

### T-07 — Implementar geocodificação
- **Descrição:** consultar a API de geocoding e normalizar os resultados para `City`.
- **Critérios de aceite:** request usa endpoint e parâmetros `name`, `language=pt` e `format=json`; `admin1`/`country_code` mapeiam para `region`/`countryCode`; `results` ausente ou vazio resulta em `[]`; erros de rede/HTTP rejeitam com tipo classificado, sem virar lista vazia.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/services/openMeteo.ts`.
- **Tipo:** Data.
- **Requisitos:** RF-01, RF-05; AC-01.1, AC-01.2, AC-01.3, AC-01.4; RNF-06.

### T-08 — Implementar forecast Open-Meteo
- **Descrição:** consultar clima atual e forecast diário com unidades canônicas e normalizar a resposta.
- **Critérios de aceite:** URL contém latitude/longitude, listas `current` e `daily`, `forecast_days=5`, `timezone=auto`, Celsius, km/h e mm; campos associam-se à data correspondente; campo/dia ausente vira `null` conforme T-03; `fetch` rejeitado gera `network`, status/payload de erro gera `api`, timeout gera `timeout` e JSON/schema inválido gera `invalid-response`; timeout usa o limite de T-02.
- **Dependências:** T-03.
- **Arquivos prováveis:** `src/services/openMeteo.ts`.
- **Tipo:** Data.
- **Requisitos:** RF-02, RF-03, RF-05; AC-02.1, AC-02.2, AC-02.3, AC-03.1, AC-03.2, AC-03.4, AC-05.3; RNF-04, RNF-06.

### T-09 — Confirmar termos da Open-Meteo
- **Descrição:** verificar limites, licença, atribuição e condições de uso antes da integração final/publicação.
- **Critérios de aceite:** README registra URL da fonte consultada, data da verificação, limites/termos aplicáveis e decisão de atribuição; confirmação de que o cliente não exige API key fica documentada.
- **Dependências:** T-07, T-08.
- **Arquivos prováveis:** `README.md`.
- **Tipo:** Infra.
- **Requisitos:** RNF-06.
- **Bloqueio:** confirmar termos e limites (Open Question 11).

## Entrega 4 — Hook de estado

### T-10 — Implementar hook de consulta
- **Descrição:** coordenar busca, seleção, forecast, retry, cancelamento e estados com `useReducer` e `WeatherService`.
- **Critérios de aceite:** expõe `status` (`idle`, `loading`, `success`, `error`, `empty`), `data`, `cities`, `error`, `query`, `search(name)`, `selectCity(city)` e `retry()`; busca carrega automaticamente o clima da primeira cidade, permanece em `loading` durante as duas chamadas e termina em `success`, `empty` ou `error`; seleção manual consulta o clima da cidade escolhida; retry repete a última ação pública com os mesmos argumentos; falha de forecast preserva o contexto da cidade; entrada vazia não acessa a rede; respostas substituídas ou posteriores à desmontagem não alteram o estado atual.
- **Dependências:** T-07, T-08.
- **Arquivos prováveis:** `src/hooks/useWeather.ts`.
- **Tipo:** Data.
- **Requisitos:** RF-01, RF-02, RF-03, RF-05; AC-01.3, AC-05.1, AC-05.2, AC-05.3, AC-05.4, AC-05.5; RNF-04.

## Entrega 5 — Componentes

### T-11 — Criar shell inicial do App
- **Descrição:** criar o componente raiz da aplicação em `src/components/`.
- **Critérios de aceite:** renderizar `<App />` produz elemento raiz no DOM sem exceção; um `fetch` espião confirma zero chamadas; componente fica em arquivo próprio.
- **Dependências:** T-10.
- **Arquivos prováveis:** `src/components/App.tsx`.
- **Tipo:** UI.
- **Requisitos:** RNF-02, RNF-05, RNF-07.

### T-12 — Criar entrypoint React
- **Descrição:** criar o ponto de entrada que monta `App` no elemento `root`.
- **Critérios de aceite:** com `#root` presente, `src/main.tsx` monta `App` sem erro; `pnpm build` termina com código 0; arquivo não contém lógica de UI ou acesso a dados.
- **Dependências:** T-11.
- **Arquivos prováveis:** `src/main.tsx`.
- **Tipo:** Infra.
- **Requisitos:** RNF-02, RNF-05, RNF-07.

### T-13 — Configurar estilos globais Tailwind
- **Descrição:** criar o CSS de entrada com as diretivas Tailwind e importá-lo no bootstrap.
- **Critérios de aceite:** `src/main.tsx` importa `src/styles.css`; arquivo contém as diretivas `base`, `components` e `utilities`; `pnpm build` termina com código 0.
- **Dependências:** T-12.
- **Arquivos prováveis:** `src/styles.css`, `src/main.tsx`.
- **Tipo:** Infra.
- **Requisitos:** RNF-02, RNF-05, RNF-07.

### T-14 — Criar busca e seleção de cidade
- **Descrição:** implementar campo de busca e opções selecionáveis, controlados por props e callbacks.
- **Critérios de aceite:** Enter envia termo não vazio; termo vazio/só com espaços não dispara callback; cada opção mostra nome e contexto regional disponível; selecionar opção dispara callback dessa cidade; estado vazio mantém o termo; controle tem nome acessível e funciona por teclado.
- **Dependências:** T-10.
- **Arquivos prováveis:** `src/components/CitySearch.tsx`.
- **Tipo:** UI.
- **Requisitos:** RF-01, RF-05; AC-01.1, AC-01.2, AC-01.3, AC-01.4; RNF-02, RNF-03, RNF-05.

### T-15 — Criar apresentação de estados
- **Descrição:** implementar mensagens de carregamento, vazio e erro com retry quando aplicável.
- **Critérios de aceite:** loading, empty e error exibem mensagens em pt-BR; loading usa `role=status`, erro usa `role=alert` e empty não usa papel de erro; retry aparece somente para ação recuperável e dispara o callback uma vez; nenhum estado exibe conteúdo como forecast válido.
- **Dependências:** T-10.
- **Arquivos prováveis:** `src/components/WeatherStatus.tsx`.
- **Tipo:** UI.
- **Requisitos:** RF-05; AC-05.1, AC-05.2, AC-05.3, AC-05.4, AC-05.5; RNF-03, RNF-04, RNF-05.

### T-16 — Criar painel de clima atual
- **Descrição:** mostrar cidade, temperatura, condição e campos opcionais disponíveis.
- **Critérios de aceite:** componente recebe `city`, `current` e `unit`; renderização identifica nome da cidade, valor/unidade de temperatura e condição com ícone de `lib/weatherCodes`; usa `lib/temperature` para conversão; umidade, vento, precipitação e pressão em hPa não nulos são apresentados; cada campo `null` e pressão omitida mostram indisponibilidade, nunca `0`; temperatura ou condição atual ausente mostra aviso de resposta incompleta.
- **Dependências:** T-05, T-06, T-10.
- **Arquivos prováveis:** `src/components/CurrentWeather.tsx`.
- **Tipo:** UI.
- **Requisitos:** RF-02, RF-04; AC-02.1, AC-02.2, AC-02.3, AC-02.4, AC-04.2, AC-04.3; RNF-02, RNF-03, RNF-05.

### T-17 — Criar lista de previsão diária
- **Descrição:** apresentar as datas e temperaturas mínima/máxima de cada dia.
- **Critérios de aceite:** lista renderiza uma posição por data do intervalo de T-02/T-03; cada posição mantém sua data original; unidade da prop é aplicada a todas as mínimas/máximas disponíveis; código WMO disponível gera condição; campos/dias ausentes são identificados sem inventar valores nem deslocar itens.
- **Dependências:** T-03, T-04, T-06, T-10.
- **Arquivos prováveis:** `src/components/ForecastList.tsx`.
- **Tipo:** UI.
- **Requisitos:** RF-03, RF-04; AC-03.1, AC-03.2, AC-03.3, AC-03.4, AC-04.2, AC-04.3, AC-04.5; RNF-02, RNF-03, RNF-05.

### T-18 — Criar controle C/F
- **Descrição:** implementar controle acessível que recebe a unidade e emite a escolha da pessoa.
- **Critérios de aceite:** controle oferece exatamente `Celsius` e `Fahrenheit` em um `radiogroup`; opção selecionada expõe `aria-checked=true`; teclado alterna opções; cada mudança emite o valor correspondente uma vez e não chama serviços.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/components/TemperatureToggle.tsx`.
- **Tipo:** UI.
- **Requisitos:** RF-04; AC-04.1, AC-04.2, AC-04.3; RNF-03.

### T-19 — Conectar estado da unidade no App
- **Descrição:** manter `Unit` local em `App` e passá-la ao controle e aos componentes de temperatura.
- **Critérios de aceite:** renderização inicial passa `celsius`; selecionar `fahrenheit` atualiza todos os valores atuais/diários sem aumentar a contagem de chamadas ao serviço; cidade e datas permanecem idênticas; recarregar a aplicação volta a Celsius.
- **Dependências:** T-16, T-17, T-18.
- **Arquivos prováveis:** `src/components/App.tsx`.
- **Tipo:** UI.
- **Requisitos:** RF-04; AC-04.1, AC-04.2, AC-04.3, AC-04.4, AC-04.5; RNF-08.

### T-20 — Exibir atribuição da fonte, se exigida
- **Descrição:** implementar atribuição de dados somente se a decisão de T-09 determinar que ela é necessária.
- **Critérios de aceite:** se T-09 exigir atribuição, componente renderiza o texto e link aprovados, legíveis e acessíveis; se não exigir, tarefa é marcada como não aplicável sem adicionar componente.
- **Dependências:** T-09.
- **Arquivos prováveis:** `src/components/DataAttribution.tsx`.
- **Tipo:** UI.
- **Requisitos:** RNF-06.

## Entrega 6 — Integração

**Evolução da composição:** a fatia inicial de UI usou `mockWeatherData` por meio de um `WeatherService` substituível. A integração de API passa a usar o serviço real padrão de `useWeather`, preservando injeção apenas para testes. Cobrir os cinco estados, primeira cidade automática e seleção manual de alternativas, retry, respostas obsoletas e conversão de todas as temperaturas sem nova consulta; testes devem simular ou interceptar a rede.

### T-21 — Compor fluxo de consulta no App
- **Descrição:** conectar hook e componentes de busca, estados, clima atual, previsão, unidade e atribuição aprovada.
- **Critérios de aceite:** `src/App.tsx` usa o serviço real padrão de `useWeather`, sem imports de mocks; `idle` mostra busca disponível sem cidade fixa ou consulta automática; renderiza `loading`, `empty`, `error` e `success` conforme o hook; selecionar opção chama forecast com suas coordenadas; `ErrorState` chama `retry`; `Unit` é estado local passado aos componentes de apresentação, sem nova consulta na troca de unidade; sucesso mostra somente os dados daquela cidade; iniciar outra busca não apresenta previsão anterior como resultado novo; atribuição aparece somente quando exigida por T-09.
- **Dependências:** T-10, T-11, T-12, T-13, T-14, T-15, T-16, T-17, T-19, T-20.
- **Arquivos prováveis:** `src/App.tsx`.
- **Tipo:** UI.
- **Requisitos:** RF-01, RF-02, RF-03, RF-04, RF-05; AC-01.3, AC-02.1, AC-03.1, AC-04.5, AC-05.5; RNF-02, RNF-05, RNF-06.

## Entrega 7 — Testes

### T-22 — Testar conversão de unidade
- **Descrição:** criar testes unitários dedicados para a conversão Celsius/Fahrenheit.
- **Critérios de aceite:** `pnpm test -- tests/unit/temperature.test.ts` passa; verifica 0 °C → 32 °F, 100 °C → 212 °F, conversão de volta 32 °F → 0 °C, identidade em Celsius e ausência de mutação/arredondamento.
- **Dependências:** T-05.
- **Arquivos prováveis:** `tests/unit/temperature.test.ts`.
- **Tipo:** Test.
- **Requisitos:** RF-04; AC-04.2, AC-04.3, AC-04.4.

### T-23 — Testar formatação e códigos WMO
- **Descrição:** testar funções puras de data e descrição meteorológica, sem incluir conversão de unidade.
- **Critérios de aceite:** `pnpm test -- tests/unit/domain.test.ts` passa; verifica `29 Out`, `Hoje`, `Amanhã`, datas sem deslocamento de fuso, código 0 como `Céu limpo`, código 61 como `Chuva fraca`, `null` e código desconhecido.
- **Dependências:** T-04, T-06.
- **Arquivos prováveis:** `tests/unit/domain.test.ts`.
- **Tipo:** Test.
- **Requisitos:** RF-02, RF-03; AC-02.1, AC-03.1, AC-03.2, AC-03.4; RNF-05.

### T-24 — Testar geocodificação com fetch mockado
- **Descrição:** testar URL, parsing, resultados vazios e falhas com `fetch` simulado.
- **Critérios de aceite:** `pnpm test -- tests/unit/openMeteo.geocoding.test.ts` passa com `fetch` substituído por mock e restaurado após cada teste; URL decodificada preserva acentos, hífen e apóstrofo; resposta com dois homônimos mantém contexto regional; resposta vazia retorna `[]`; falhas de rede/HTTP rejeitam; entrada vazia é verificada no hook em T-26.
- **Dependências:** T-07.
- **Arquivos prováveis:** `tests/unit/openMeteo.geocoding.test.ts`.
- **Tipo:** Test.
- **Requisitos:** RF-01, RF-05; AC-01.1, AC-01.2, AC-01.4, AC-05.2.

### T-25 — Testar forecast com fetch mockado
- **Descrição:** verificar parâmetros, normalização e respostas incompletas sem chamadas reais.
- **Critérios de aceite:** `pnpm exec vitest run tests/unit/weatherService.test.ts` passa com `vi.stubGlobal('fetch', ...)` e restauração após cada teste; verifica parâmetros de T-08, associação por índice/data em cinco dias, precipitação explicitamente `null` normalizada para `0`, precipitação omitida preservada como `null`, resposta sem `current` ou `daily` lançando `WeatherServiceError`, status HTTP de erro, JSON inválido e timeout no limite configurado.
- **Dependências:** T-08.
- **Arquivos prováveis:** `tests/unit/weatherService.test.ts`.
- **Tipo:** Test.
- **Requisitos:** RF-02, RF-03, RF-05; AC-02.3, AC-03.1, AC-03.4, AC-05.3.

### T-26 — Testar hook de consulta
- **Descrição:** cobrir transições do hook com um `WeatherService` falso.
- **Critérios de aceite:** `pnpm test -- tests/unit/useWeather.test.ts` passa; testes verificam busca válida/vazia/inválida, loading, seleção e success; `network`, `timeout`, HTTP 429/5xx permitem retry, erro 4xx não oferece retry; retry repete busca/forecast, falha preserva cidade e resposta obsoleta é ignorada.
- **Dependências:** T-10.
- **Arquivos prováveis:** `tests/unit/useWeather.test.ts`.
- **Tipo:** Test.
- **Requisitos:** RF-01, RF-05; AC-05.1, AC-05.2, AC-05.3, AC-05.4, AC-05.5; RNF-04.

### T-27 — Testar componente de estados
- **Descrição:** testar `WeatherStatus` isoladamente nos estados loading, erro e vazio.
- **Critérios de aceite:** `pnpm test -- tests/integration/WeatherStatus.test.tsx` passa; loading renderiza `role=status`; erro renderiza `role=alert` e retry dispara callback uma vez; vazio informa ausência de resultados sem papel de erro; nenhum estado renderiza previsão válida.
- **Dependências:** T-15, T-21.
- **Arquivos prováveis:** `tests/integration/WeatherStatus.test.tsx`.
- **Tipo:** Test.
- **Requisitos:** RF-05; AC-05.1, AC-05.2, AC-05.3, AC-05.4, AC-05.5; RNF-03, RNF-04, RNF-05.

### T-28 — Testar integração da UI
- **Descrição:** testar componentes conectados ao hook usando serviço falso.
- **Critérios de aceite:** `pnpm test -- tests/integration/App.test.tsx` passa; casos verificam busca/seleção, loading, vazio, erro/retry, campos parciais, datas do forecast e alternância de unidade; spy confirma nenhuma nova chamada ao mudar C/F.
- **Dependências:** T-21.
- **Arquivos prováveis:** `tests/integration/App.test.tsx`.
- **Tipo:** Test.
- **Requisitos:** RF-01, RF-02, RF-03, RF-04, RF-05; AC-01.1, AC-01.3, AC-02.3, AC-03.4, AC-04.2, AC-04.5, AC-05.4.

### T-29 — Testar fluxo principal E2E desktop e mobile
- **Descrição:** exercitar fluxos principais com APIs interceptadas no Playwright.
- **Critérios de aceite:** Playwright passa busca-seleção-forecast com cinco datas, busca sem resultados e erro-retry-sucesso nos projetos Chromium desktop e mobile; em mobile usa viewport de 390 × 844 px; ao alternar unidade, request count permanece constante; todas as respostas externas são interceptadas.
- **Dependências:** T-21.
- **Arquivos prováveis:** `tests/e2e/weather-app.spec.ts`.
- **Tipo:** Test.
- **Requisitos:** RF-01, RF-02, RF-03, RF-04, RF-05; AC-01.3, AC-05.2, AC-05.4, AC-04.2; RNF-04.

### T-30 — Testar atribuição condicional
- **Descrição:** verificar a apresentação da atribuição quando requerida pela fonte.
- **Critérios de aceite:** quando T-09 exigir atribuição, teste verifica texto visível, destino correto do link e nome acessível; se não exigir, teste/tarefa é marcado como não aplicável.
- **Dependências:** T-20, T-21.
- **Arquivos prováveis:** `tests/integration/DataAttribution.test.tsx`.
- **Tipo:** Test.
- **Requisitos:** RNF-06.

## Entrega 8 — Hardening

### T-31 — Verificar responsividade e acessibilidade
- **Descrição:** criar verificações para viewport de 320 px, teclado, nomes/papéis e contraste.
- **Critérios de aceite:** em viewport de 320 px, teste compara bounding boxes dos controles e áreas principais e falha se houver sobreposição ou overflow horizontal; teste de teclado completa busca e seleção sem mouse; controles têm nome/papel acessíveis; contraste é medido e comparado ao limite aprovado.
- **Dependências:** T-28, T-29.
- **Arquivos prováveis:** `tests/e2e/responsive-accessibility.spec.ts`.
- **Tipo:** Test.
- **Requisitos:** RNF-02, RNF-03.
- **Bloqueio:** alinhar critérios de contraste e versão WCAG à Open Question 20.

### T-32 — Medir carregamento inicial
- **Descrição:** medir o carregamento inicial no ambiente acordado.
- **Critérios de aceite:** teste registra navegador, perfil de rede, execuções e resultado bruto; aplica a agregação definida na Open Question 21; métrica aprovada é menor ou igual a 2 s; desvio gera falha e relatório reproduzível.
- **Dependências:** T-29.
- **Arquivos prováveis:** `tests/e2e/performance.spec.ts`.
- **Tipo:** Test.
- **Requisitos:** RNF-01.
- **Bloqueio:** definir conexão típica e método de medição (Open Question 21).

### T-33 — Validar matriz de navegadores
- **Descrição:** executar os fluxos E2E na matriz de navegadores aprovada.
- **Critérios de aceite:** lista aprovada de navegador/versão está registrada; suíte E2E executa em cada item; resultado de cada navegador é anexado e qualquer falha reprova a validação.
- **Dependências:** T-29.
- **Arquivos prováveis:** `playwright.config.ts`, `tests/e2e/compatibility.spec.ts`.
- **Tipo:** Test.
- **Requisitos:** RNF-07.
- **Bloqueio:** aprovar a lista mínima de navegadores e versões (Open Question 19).
