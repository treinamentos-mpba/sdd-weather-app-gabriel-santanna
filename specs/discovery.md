# Discovery — Weather App

## Contexto

A solicitação é criar uma aplicação web de previsão do tempo para que as pessoas consultem rapidamente as condições de uma cidade e planejem atividades do dia ou dos próximos dias. O briefing pede busca de cidades, clima atual, previsão de cinco dias, alternância entre Celsius e Fahrenheit e uso em dispositivos móveis.

O produto é voltado principalmente a dois perfis: quem consulta o clima para decidir o que vestir ou levar no dia e quem verifica a previsão para planejar a semana. As decisões sobre fonte de dados, período da previsão, unidade padrão, autenticação, persistência em servidor e idioma estão registradas na seção **Decisões**.

## Personas (hipóteses)

As personas abaixo são propostas iniciais derivadas do briefing e devem ser validadas com usuários reais.

### Pessoa que decide a rotina do dia

- **Objetivo principal:** consultar rapidamente as condições atuais para decidir o que vestir ou levar, como um guarda-chuva.
- **Contexto de uso:** principalmente no celular, em deslocamento ou pouco antes de sair; precisa buscar uma cidade e entender a informação sem navegar por muitos passos.
- **Métrica de sucesso:** consegue encontrar o clima atual da cidade desejada e tomar uma decisão em até 30 segundos, em pelo menos 4 de 5 tentativas de um teste de usabilidade.

### Pessoa que planeja os próximos dias

- **Objetivo principal:** consultar a previsão de cinco dias de uma cidade para escolher quando realizar uma atividade ou planejar uma viagem.
- **Contexto de uso:** pesquisa com mais atenção em desktop ou celular antes de sair; compara as condições de diferentes dias e pode consultar novamente pelo celular.
- **Métrica de sucesso:** identifica em até 1 minuto as temperaturas mínima e máxima e a condição do dia que pretende avaliar, em pelo menos 4 de 5 tentativas de um teste de usabilidade.

## Requisitos Funcionais

- **RF1 — Buscar cidades:** permitir pesquisar uma cidade pelo nome e escolher o resultado correto quando houver localidades homônimas.
- **RF2 — Consultar clima atual:** exibir para a cidade escolhida a temperatura e informações relevantes, como condição do tempo, umidade, vento e precipitação.
- **RF3 — Consultar previsão:** exibir a previsão de hoje e dos quatro dias seguintes, incluindo temperaturas mínima e máxima e condição do tempo.
- **RF4 — Alternar unidade:** permitir alternar entre Celsius e Fahrenheit e atualizar os valores de temperatura exibidos.
- **RF5 — Comunicar estados da consulta:** apresentar estados de carregamento, erro e ausência de resultados; permitir nova tentativa quando a consulta falhar.

## Requisitos Não-Funcionais

- **RNF1 — Desempenho:** a tela inicial deve carregar em até 2 segundos em uma conexão típica; a busca deve fornecer retorno percebido como rápido.
- **RNF2 — Responsividade:** a interface deve funcionar em telas de 320 px até desktop, com prioridade para dispositivos móveis.
- **RNF3 — Acessibilidade:** controles devem ser utilizáveis por teclado, ter nomes e papéis semânticos e manter contraste adequado, buscando conformidade básica com WCAG AA.
- **RNF4 — Resiliência:** falhas de rede ou da fonte de dados devem ser comunicadas de forma compreensível, sem deixar a interface em estado inconsistente.
- **RNF5 — Localização:** textos e formatos apresentados ao usuário devem ser adequados ao português do Brasil.
- **RNF6 — Custo e configuração:** a fonte de dados da primeira versão não deve exigir chave de API, simplificando configuração e publicação.
- **RNF7 — Compatibilidade:** a aplicação deve funcionar nos navegadores modernos de uso geral.

## Riscos

As avaliações abaixo são qualitativas e preliminares. Devem ser revistas quando as perguntas em aberto forem respondidas e a fonte de dados for confirmada.

| Risco | Probabilidade | Impacto | Mitigação |
| --- | --- | --- | --- |
| Indisponibilidade, lentidão ou limite de requisições da fonte meteorológica | Média | Alto | Definir timeout, tratar falhas, informar a indisponibilidade e permitir nova tentativa; avaliar cache apenas após confirmar requisitos de atualização e termos da fonte. |
| Fonte de dados incompatível com o uso pretendido, com limites, custos ou termos não identificados | Média | Alto | Confirmar fonte, licença, atribuição, limites e necessidade de chave antes de fechar a arquitetura e publicar. |
| Busca selecionar uma cidade homônima ou localização incorreta | Alta | Alto | Exibir cidade junto de estado/região e país; exigir seleção quando houver ambiguidade e validar resultados de geocodificação. |
| Datas ou previsão exibidas no dia/horário errado por diferença de fuso horário | Média | Alto | Definir o fuso de referência como requisito e validar mudanças de data e cidades em fusos diferentes. |
| Dados desatualizados ou interpretados como observação em tempo real | Média | Alto | Confirmar o significado de “clima atual”, indicar horário de atualização quando disponível e comunicar limitações dos dados. |
| Falha de rede ou conexão lenta impede a consulta | Média | Médio | Exibir carregamento, erro e ação de nova tentativa; evitar bloquear a interface e definir comportamento para dados incompletos. |
| Interface difícil de usar em telas pequenas ou com tecnologia assistiva | Média | Alto | Validar fluxos em larguras móveis, teclado e leitor de tela; adotar critérios de acessibilidade verificáveis antes da entrega. |
| Escopo ou critérios de aceite ambíguos causam retrabalho ou entrega incompleta | Alta | Alto | Resolver as perguntas prioritárias com stakeholders, registrar decisões na especificação e vincular requisitos a critérios de aceite testáveis. |
| Preferências ou localização são armazenadas ou solicitadas sem expectativa clara do usuário | Baixa | Alto | Definir política de privacidade e retenção; pedir permissão somente quando necessário e minimizar dados armazenados. |
| Conversão de temperatura ou apresentação de unidades resulta em valores incorretos | Baixa | Alto | Definir unidades e regras de conversão; centralizar cálculos e cobrir limites e arredondamentos com testes. |

## Perguntas em Aberto (Open Questions)

O briefing inicial informa apenas que será possível buscar cidades, consultar o clima atual, ver a previsão de cinco dias, alternar entre Celsius e Fahrenheit e usar o produto em dispositivos móveis. As perguntas abaixo registram definições ausentes; as premissas já descritas neste documento ainda precisam ser confirmadas por quem solicitou o produto.

### Objetivo e escopo

1. Quem é o público prioritário e qual decisão principal o app deve ajudar a tomar: planejar o dia, uma viagem ou outra atividade? **Impacto:** orienta prioridades, informações exibidas e critérios de sucesso.
2. O que significa “clima atual”: observação mais recente, condição neste momento ou previsão para as próximas horas? **Impacto:** define quais dados mostrar e como explicar sua atualidade.
3. “Previsão de cinco dias” inclui o dia de hoje ou os cinco dias seguintes? **Impacto:** muda o intervalo coberto e a interpretação da lista.
4. A previsão deve ser diária, por hora ou oferecer as duas granularidades? **Impacto:** altera escopo, volume de informação e organização da interface.
5. Quais informações precisam aparecer no clima atual e na previsão, além da temperatura? **Impacto:** sem uma lista mínima, o conteúdo e os critérios de aceite ficam subjetivos.
6. Alertas de tempo severo fazem parte do produto? **Impacto:** pode exigir outra fonte de dados, novos estados de interface e tratamento de urgência.

### Busca e localização

7. O que o usuário pode digitar: nome de cidade apenas, ou também código postal, região ou país? **Impacto:** determina o comportamento e as limitações da busca.
8. A busca deve sugerir resultados enquanto a pessoa digita ou ocorrer somente após envio? **Impacto:** afeta interação, acessibilidade e quantidade de requisições.
9. Quantos resultados devem aparecer e como serão ordenados? **Impacto:** afeta a facilidade de encontrar a localidade correta.
10. Como diferenciar cidades homônimas: estado/região, país, população ou outro contexto? **Impacto:** reduz o risco de mostrar o clima do lugar errado.
11. A localização automática do dispositivo deve ser oferecida? Em caso afirmativo, ela é opcional e qual alternativa existe se a permissão for negada? **Impacto:** envolve permissões, privacidade e o fluxo inicial.
12. O app deve abrir em uma cidade padrão, na última cidade consultada ou sem cidade selecionada? **Impacto:** define a experiência na primeira visita e nas visitas seguintes.

### Dados, unidades e atualização

13. Quais limites de uso, custos, licença e requisitos de atribuição se aplicam à Open-Meteo? **Impacto:** podem afetar viabilidade, publicação e continuidade do serviço, mesmo sem chave de API.
14. Qual é a unidade padrão: Celsius ou Fahrenheit? A troca de unidade afeta apenas temperatura ou também vento e precipitação? **Impacto:** evita valores inconsistentes e define conversões necessárias.
15. Qual fuso horário deve ser usado para datas e horários da previsão: o da cidade consultada ou o do dispositivo? **Impacto:** pode deslocar dias e horários, especialmente em consultas entre fusos.
16. Quando os dados devem ser atualizados e a interface deve indicar quando foram obtidos? **Impacto:** equilibra atualidade, transparência, desempenho e limites da fonte.
17. Há necessidade de oferecer idiomas além de pt-BR, agora ou em versões futuras? **Impacto:** pode exigir internacionalização, formatos regionais e esforço adicional de manutenção.

### Persistência, qualidade e operação

18. Devem existir favoritos ou histórico de cidades consultadas? **Impacto:** define novos fluxos e a necessidade de persistência local ou em servidor.
19. A cidade e a unidade escolhidas devem ser lembradas entre visitas? **Impacto:** exige definir armazenamento, duração e comportamento em dispositivos compartilhados.
20. O que deve acontecer sem conexão: mostrar erro, dados armazenados anteriormente ou uma versão limitada do app? **Impacto:** define suporte offline, cache e a comunicação da validade dos dados.
21. Quais navegadores e dispositivos precisam ser suportados, e quais critérios objetivos definem a experiência mobile aceitável? **Impacto:** dá limites verificáveis para compatibilidade e responsividade.
22. Qual nível de acessibilidade é obrigatório, incluindo navegação por teclado, leitores de tela e contraste? **Impacto:** “acessível” sem critérios pode gerar resultados incompatíveis com as necessidades dos usuários.
23. Existem metas mensuráveis de carregamento e de resposta da busca? **Impacto:** sem limites, desempenho não pode ser verificado de forma consistente.
24. Que comportamento é esperado para busca sem resultados, falha da API, timeout e dados incompletos? **Impacto:** determina recuperação, mensagens e se o usuário consegue continuar.
25. Há limites de privacidade ou retenção para localização, buscas e preferências? **Impacto:** influencia permissões, armazenamento e informações que precisam ser comunicadas.
26. Como será feita a publicação e qual disponibilidade é esperada? **Impacto:** pode restringir a escolha de fonte de dados, infraestrutura e estratégia de falha.
27. Como será medido o sucesso do produto e quais condições tornam uma entrega aceitável? **Impacto:** sem métricas ou critérios de aceite, não é possível validar se o app resolve o problema.

## Decisões

- **Fonte de dados: Open-Meteo, sem API key.** Justificativa: atende à necessidade de geocodificação e previsão sem exigir segredo de API na aplicação. Resolve a escolha da fonte e da chave na pergunta 13; limites de uso, licença e atribuição continuam pendentes na mesma pergunta.
- **“5 dias” significa hoje mais os quatro dias seguintes.** Justificativa: fixa um intervalo previsível para a previsão. Resolve a pergunta 3; a granularidade diária ou por hora da pergunta 4 permanece em aberto.
- **Unidade padrão: Celsius.** Justificativa: estabelece um valor inicial consistente para o público-alvo definido para o produto. Resolve a escolha da unidade padrão na pergunta 14; quais outras unidades, além da temperatura, devem ser convertidas ainda precisa ser definido.
- **Sem autenticação e sem persistência de dados em servidor.** Justificativa: mantém o escopo da primeira versão simples e sem contas de usuário. Define que não haverá login nem armazenamento em servidor; favoritos, histórico, preferências e dados armazenados localmente ainda precisam ser decididos nas perguntas 18, 19 e 25.
- **Idioma da UI: pt-BR.** Justificativa: oferece uma experiência consistente para o público inicial. Define o idioma da interface; suporte a outros idiomas permanece em aberto na pergunta 17.

## Suposições (Assumptions)

- A maioria das consultas será feita com acesso à internet.
- A primeira versão não solicitará geolocalização automática; essa premissa precisa ser confirmada na pergunta 11.
- O público utilizará navegadores modernos e atualizados.
