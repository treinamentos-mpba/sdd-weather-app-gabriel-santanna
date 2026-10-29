# Especificação de Produto — Weather App

## Overview

O Weather App é uma aplicação web responsiva para consultar o clima de uma cidade e apoiar decisões do dia a dia e o planejamento dos próximos dias. O MVP permite buscar uma cidade, consultar as condições atuais, ver uma previsão de cinco dias e alternar a temperatura entre Celsius e Fahrenheit.

O público inicial inclui pessoas que consultam o clima antes de sair e pessoas que planejam atividades ou viagens. As personas e suas métricas são hipóteses a validar: encontrar as condições atuais em até 30 segundos, ou identificar a previsão de um dia em até 1 minuto, em pelo menos 4 de 5 tentativas de usabilidade.

Decisões confirmadas para esta especificação: Open-Meteo como fonte sem API key; cinco dias significam hoje mais os quatro dias seguintes; Celsius é a unidade inicial; não haverá autenticação nem persistência em servidor; o idioma da interface será pt-BR. Os limites de uso e termos da fonte, além de decisões de UX ainda abertas, precisam ser confirmados antes da implementação final.

## Functional Requirements

- **RF-01 — Buscar cidade:** permitir pesquisar uma cidade pelo nome, carregar automaticamente o clima da primeira localidade retornada e escolher outra opção quando houver mais resultados.
- **RF-02 — Exibir clima atual:** após a seleção da cidade, apresentar a temperatura e a condição atual. Umidade, vento, precipitação e pressão atmosférica em hPa são apresentados quando disponíveis, com indicação de indisponibilidade quando ausentes.
- **RF-03 — Exibir previsão de cinco dias:** apresentar hoje e os quatro dias seguintes, com temperatura mínima e máxima e condição do tempo para cada dia. A visualização diária é a interpretação provisória do requisito; previsão por hora permanece por decidir.
- **RF-04 — Alternar unidade de temperatura:** iniciar em Celsius e permitir alternar entre Celsius e Fahrenheit, atualizando todas as temperaturas exibidas.
- **RF-05 — Comunicar estados da consulta:** apresentar estados de carregamento, erro e ausência de resultados; oferecer uma ação para tentar novamente após falha recuperável.

## User Stories

- **US-01 (RF-01):** Como pessoa que decide a rotina do dia, quero buscar uma cidade pelo nome e selecionar a localidade correta para consultar o clima do lugar desejado.
- **US-02 (RF-02):** Como pessoa que decide a rotina do dia, quero ver as condições atuais da cidade selecionada para decidir o que vestir ou levar.
- **US-03 (RF-03):** Como pessoa que planeja os próximos dias, quero consultar as temperaturas mínima e máxima e a condição do tempo de cada dia para escolher quando realizar uma atividade ou planejar uma viagem.
- **US-04 (RF-04):** Como pessoa que planeja os próximos dias, quero alternar entre Celsius e Fahrenheit para interpretar todas as temperaturas na unidade que prefiro.
- **US-05 (RF-05):** Como pessoa que decide a rotina do dia, quero receber uma indicação quando a consulta estiver carregando ou falhar e poder tentar novamente para obter os dados de que preciso.

## Acceptance Criteria

Cada cenário usa Given/When/Then e está associado diretamente ao requisito funcional correspondente.

### RF-01 — Buscar cidade

- **AC-01.1:** **Given** uma busca por cidade com localidades correspondentes, **When** a pessoa envia a busca, **Then** o app carrega o clima da primeira localidade e mantém os resultados disponíveis para seleção manual.
- **AC-01.2:** **Given** que os resultados incluem cidades homônimas e a fonte fornece contexto regional, **When** o app apresenta as opções, **Then** cada opção exibe cidade e contexto suficiente, como região/estado e país, para diferenciá-las.
- **AC-01.3:** **Given** uma lista de resultados, **When** a pessoa seleciona uma localidade, **Then** o app identifica essa localidade como selecionada e exibe os dados correspondentes a ela.
- **AC-01.4:** **Given** uma busca sem localidades correspondentes, **When** a consulta termina, **Then** o app informa que não encontrou resultados e não exibe dados meteorológicos de outra cidade.

### RF-02 — Exibir clima atual

- **AC-02.1:** **Given** uma cidade selecionada e uma resposta válida com temperatura e condição atuais, **When** os dados são carregados, **Then** o app exibe a cidade, a temperatura e a condição retornadas pela fonte.
- **AC-02.2:** **Given** uma resposta que contém umidade, vento, precipitação e pressão, **When** o clima atual é exibido, **Then** o app apresenta esses valores com suas unidades.
- **AC-02.3:** **Given** uma resposta sem um ou mais valores opcionais de umidade, vento, precipitação ou pressão, **When** o clima atual é exibido, **Then** o app indica indisponibilidade, sem apresentar campos omitidos como zero nem como informação confirmada. Exceção de normalização: `current.precipitation` explicitamente `null` é interpretado como `0 mm`; campo omitido continua indisponível.
- **AC-02.4:** **Given** uma temperatura atual e uma unidade ativa, **When** o app apresenta o valor, **Then** sua unidade fica identificável como Celsius ou Fahrenheit.

### RF-03 — Exibir previsão de cinco dias

- **AC-03.1:** **Given** uma cidade selecionada e previsão diária disponível para o intervalo, **When** os dados são carregados, **Then** o app apresenta cinco dias: hoje e os quatro dias seguintes, usando as datas retornadas para a localidade.
- **AC-03.2:** **Given** os dados de previsão para um dia, **When** o app apresenta esse dia, **Then** exibe as temperaturas mínima e máxima e a condição do tempo disponíveis na resposta.
- **AC-03.3:** **Given** uma unidade ativa, **When** a previsão é apresentada, **Then** todas as temperaturas da previsão usam essa unidade.
- **AC-03.4:** **Given** que não há previsão para um ou mais dias do intervalo, **When** o app apresenta a previsão, **Then** informa quais dados estão indisponíveis e não inventa valores nem desloca as datas restantes.

### RF-04 — Alternar unidade de temperatura

- **AC-04.1:** **Given** uma primeira utilização com temperaturas disponíveis, **When** os dados são apresentados, **Then** todos os valores de temperatura usam Celsius.
- **AC-04.2:** **Given** temperaturas disponíveis no clima atual e na previsão em Celsius, **When** a pessoa seleciona Fahrenheit, **Then** todos os valores de temperatura visíveis passam a usar Fahrenheit.
- **AC-04.3:** **Given** temperaturas disponíveis em Fahrenheit, **When** a pessoa seleciona Celsius, **Then** todos os valores de temperatura visíveis passam a usar Celsius.
- **AC-04.4:** **Given** um valor de 0 °C ou 100 °C, **When** a pessoa seleciona Fahrenheit, **Then** o app apresenta, respectivamente, 32 °F ou 212 °F.
- **AC-04.5:** **Given** uma cidade e uma previsão exibidas, **When** a pessoa alterna a unidade, **Then** a cidade selecionada e as datas da previsão permanecem inalteradas.

### RF-05 — Comunicar estados da consulta

- **AC-05.1:** **Given** que uma busca ou consulta meteorológica foi iniciada e ainda não terminou, **When** a pessoa aguarda a resposta, **Then** o app apresenta um estado de carregamento.
- **AC-05.2:** **Given** que a busca terminou sem resultados, **When** o app apresenta o resultado, **Then** informa que nenhuma cidade foi encontrada e não exibe dados meteorológicos de outra localidade.
- **AC-05.3:** **Given** que uma consulta falha por uma condição recuperável, **When** o app comunica a falha, **Then** apresenta uma mensagem compreensível e uma ação de nova tentativa.
- **AC-05.4:** **Given** uma falha recuperável exibida e a ação de nova tentativa disponível, **When** a pessoa tenta novamente e a consulta tem sucesso, **Then** o app apresenta o carregamento durante a nova consulta e depois exibe os dados correspondentes, removendo a mensagem de erro.
- **AC-05.5:** **Given** um estado de carregamento, erro ou ausência de resultados, **When** o app renderiza esse estado, **Then** não o apresenta como se fosse uma previsão válida.

## Non-Functional Requirements

- **RNF-01 — Desempenho:** a tela inicial deve carregar em até 2 segundos em uma conexão típica. O perfil exato de rede e o método de medição ainda precisam ser acordados. A busca deve parecer rápida; seu limite numérico permanece em aberto.
- **RNF-02 — Responsividade:** os fluxos principais devem funcionar em larguras a partir de 320 px até telas desktop, com prioridade para uso em dispositivos móveis.
- **RNF-03 — Acessibilidade:** controles devem ser operáveis por teclado, ter nomes e papéis semânticos e manter contraste adequado, buscando conformidade básica com WCAG AA. A versão da norma e o escopo de verificação devem ser confirmados.
- **RNF-04 — Resiliência:** falhas de rede ou da fonte devem ser comunicadas sem deixar a interface bloqueada ou em estado inconsistente; deve haver nova tentativa para falhas recuperáveis.
- **RNF-05 — Localização:** textos e formatos voltados ao usuário devem estar em português do Brasil.
- **RNF-06 — Configuração da fonte:** a consulta à fonte escolhida não deve exigir API key no cliente. Isso não implica que todos os usos sejam gratuitos; limites, atribuição e termos ainda precisam ser confirmados.
- **RNF-07 — Compatibilidade:** o app deve funcionar em navegadores modernos de uso geral. A lista mínima de navegadores e versões permanece em aberto.
- **RNF-08 — Privacidade e contas:** o MVP não exige autenticação nem armazena dados em servidor. A eventual persistência local de preferências ou histórico ainda não foi decidida.

## Matriz de Rastreabilidade

A tabela relaciona cada história aos critérios que a verificam e aos requisitos não funcionais que condicionam sua implementação ou validação. Os critérios compartilhados aparecem em mais de uma história quando cobrem comportamentos distintos do fluxo.

| User Story | Requisito funcional | Acceptance Criteria | RNFs relevantes |
| --- | --- | --- | --- |
| **US-01 — Buscar cidade** | RF-01 | AC-01.1, AC-01.2, AC-01.3, AC-01.4, AC-05.2 | RNF-01, RNF-02, RNF-03, RNF-04, RNF-05, RNF-06, RNF-07 |
| **US-02 — Ver clima atual** | RF-02 | AC-02.1, AC-02.2, AC-02.3, AC-02.4, AC-05.1, AC-05.3, AC-05.4 | RNF-01, RNF-02, RNF-03, RNF-04, RNF-05, RNF-06, RNF-07 |
| **US-03 — Consultar previsão** | RF-03 | AC-03.1, AC-03.2, AC-03.3, AC-03.4, AC-05.1, AC-05.3, AC-05.4 | RNF-01, RNF-02, RNF-03, RNF-04, RNF-05, RNF-06, RNF-07 |
| **US-04 — Alternar unidade** | RF-04 | AC-04.1, AC-04.2, AC-04.3, AC-04.4, AC-04.5 | RNF-02, RNF-03, RNF-05, RNF-07 |
| **US-05 — Entender estados e tentar novamente** | RF-05 | AC-05.1, AC-05.2, AC-05.3, AC-05.4, AC-05.5 | RNF-01, RNF-02, RNF-03, RNF-04, RNF-05, RNF-07 |

**Aplicabilidade transversal:** RNF-07 vale para todas as histórias, mesmo onde não foi repetido na coluna. RNF-08 também é uma restrição geral do MVP (sem autenticação ou persistência em servidor); não define persistência local de cidade ou unidade, que continua em aberto.

## Edge Cases

- **Input vazio ou só com espaços:** remover espaços no início e no fim; se não restar texto, impedir o envio da busca, informar que o nome da cidade é obrigatório e não chamar o serviço de geocodificação.
- **Caracteres especiais no nome:** preservar letras acentuadas e nomes válidos com hífen ou apóstrofo, enviando a consulta de forma que esses caracteres sejam interpretados como parte do nome. Para entrada composta apenas por caracteres de controle ou sem conteúdo pesquisável, informar que a busca é inválida e não chamar a API.
- **Cidade inexistente:** quando a busca por um nome válido não corresponder a nenhuma localidade, informar que a cidade não foi encontrada, manter o termo pesquisado disponível para correção e não exibir dados anteriores como se fossem o resultado atual.
- **Geocoding sem resultados:** se a API de geocodificação responder com uma lista vazia, apresentar o estado de ausência de resultados e não solicitar previsão meteorológica para uma localização não resolvida.
- **Cidades homônimas:** carregar a primeira localidade retornada e apresentar as alternativas com o contexto regional/país fornecido pela fonte, permitindo corrigir a escolha por seleção manual.
- **Falha da API:** se geocodificação ou previsão retornar erro, informar que os dados não puderam ser carregados e oferecer nova tentativa quando apropriado. Em falha da previsão após a cidade ser resolvida, manter a cidade identificada e não mostrar dados de outra cidade.
- **Timeout:** quando uma requisição ultrapassar 10 segundos, abortá-la, encerrar o estado de carregamento, informar `A requisição demorou demais.` e oferecer nova tentativa. O limite se aplica à geocodificação e à previsão.
- **Resposta parcial:** apresentar os campos válidos recebidos e marcar campos ausentes como indisponíveis, nunca como zero. Se faltar temperatura ou condição atual, indicar que os dados estão incompletos; não apresentar a consulta como sucesso completo.
- **Previsão incompleta:** manter cada data dentro do intervalo de cinco dias; para dia ou campo sem dados, indicar indisponibilidade sem inventar valores nem deslocar as datas seguintes.
- **Perda de conexão durante uma consulta:** sair do carregamento quando a falha for detectada, explicar que a conexão foi perdida e permitir tentar novamente sem limpar a cidade selecionada.
- **Alternância de unidade durante carregamento ou erro:** manter a unidade escolhida e aplicá-la aos dados quando forem carregados; a troca não deve substituir a cidade selecionada nem ocultar o estado de erro.
- **Diferença de fuso horário ou virada de data:** usar as datas fornecidas para a localidade e não inferir uma data com base apenas no relógio do dispositivo. A regra definitiva de fuso continua pendente na seção Open Questions.
- **Fonte sem horário de atualização:** não afirmar que os dados foram atualizados em um horário específico quando essa informação não estiver disponível.

## Assumptions

- A maioria das consultas ocorrerá com acesso à internet.
- A Open-Meteo fornecerá os dados de geocodificação e previsão necessários para os requisitos do MVP; limites e termos de uso continuam sujeitos a confirmação.
- A apresentação diária da previsão é uma interpretação provisória do requisito de cinco dias e dos valores mínimo/máximo; a necessidade de previsão por hora permanece em aberto.
- A primeira versão não solicitará geolocalização automática, mas essa premissa precisa ser validada.
- Não haverá login nem persistência de dados em servidor, conforme decisão registrada no discovery.
- O público utilizará navegadores modernos; a lista de compatibilidade precisa ser definida.
- As personas, os tempos de sucesso e os resultados esperados de usabilidade são hipóteses, não métricas validadas.

## Risks

| Risco | Probabilidade | Impacto | Mitigação |
| --- | --- | --- | --- |
| Indisponibilidade, lentidão ou limite de requisições da fonte | Média | Alto | Tratar timeout e falhas, comunicar a indisponibilidade e permitir nova tentativa; confirmar limites de uso antes da publicação. |
| Termos, licença ou atribuição da fonte incompatíveis com a publicação | Média | Alto | Validar termos, licença, atribuição e condições de uso da Open-Meteo antes de fechar a entrega. |
| Seleção de localidade incorreta em cidades homônimas | Alta | Alto | Identificar a primeira localidade carregada e exibir alternativas com contexto geográfico para correção manual. |
| Datas exibidas incorretamente por diferença de fuso horário | Média | Alto | Definir o fuso de referência e validar consultas próximas à virada do dia em localidades distintas. |
| Dados desatualizados interpretados como condições em tempo real | Média | Alto | Definir o significado de “clima atual”, indicar horário de atualização quando a fonte fornecer e comunicar limitações. |
| Falha de rede impede a consulta | Média | Médio | Apresentar estados claros de carregamento e erro, preservar a possibilidade de nova tentativa e não exibir dados inválidos. |
| Problemas de uso em telas pequenas ou com tecnologia assistiva | Média | Alto | Testar os fluxos principais em dispositivos móveis, navegação por teclado e leitor de tela; definir critérios de acessibilidade verificáveis. |
| Ambiguidades de escopo causam retrabalho | Alta | Alto | Resolver as perguntas prioritárias antes de aprovar a spec e vincular cada RF a critérios de aceite. |
| Conversão ou apresentação de unidades incorreta | Baixa | Alto | Confirmar regras de unidade e arredondamento e validar os resultados com critérios e testes apropriados. |
| Preferências ou localização são armazenadas ou solicitadas sem expectativa clara | Baixa | Alto | Definir persistência local, privacidade e comportamento de permissões antes de introduzir essas funções. |

## Out of Scope

- Cadastro, login e autenticação de usuários.
- Persistência de dados em servidor.
- Geolocalização automática na primeira versão, até que seja aprovada explicitamente.
- Alertas meteorológicos severos, notificações push ou recomendações automatizadas, pois não fazem parte do briefing confirmado.
- Funcionamento offline ou garantia de dados em cache; a estratégia offline ainda depende de decisão.
- Favoritos, histórico de buscas e persistência local de cidade ou unidade, até que sejam aprovados.
- Previsão por hora na primeira versão, enquanto o requisito de granularidade não for confirmado; a apresentação diária é provisória.
- Idiomas adicionais além de pt-BR, enquanto não forem aprovados.

## Open Questions

1. O que exatamente caracteriza “clima atual”: observação mais recente, condição neste momento ou previsão para as próximas horas?
2. Quais campos, além de temperatura e condição, são obrigatórios no clima atual e em cada dia da previsão?
3. A previsão será somente diária ou também por hora?
4. Alertas de tempo severo fazem parte do escopo futuro ou do MVP?
5. A busca aceitará apenas nome de cidade ou também região, país ou código postal?
6. A busca deve sugerir resultados enquanto a pessoa digita ou ocorrer após envio explícito?
7. Quantos resultados serão exibidos e qual será a regra de ordenação?
8. Quais informações geográficas serão usadas para diferenciar cidades homônimas quando a fonte não fornecer estado/região?
9. A geolocalização automática será oferecida? Como o fluxo deve funcionar se a permissão for negada?
10. O app deve iniciar sem cidade selecionada, com uma cidade padrão ou com uma cidade previamente visitada?
11. Quais são os limites de uso, custos, licença e requisitos de atribuição da Open-Meteo?
12. A alternância C/F afeta apenas temperaturas ou também vento e precipitação? Qual regra de arredondamento será usada?
13. Datas e horários seguirão o fuso da cidade consultada ou o do dispositivo?
14. Com que frequência os dados serão atualizados e o horário da última atualização será exibido?
15. Há necessidade de idiomas além de pt-BR, agora ou em versões futuras?
16. Devem existir favoritos ou histórico de cidades armazenados localmente?
17. Cidade e unidade devem ser lembradas entre visitas? Por quanto tempo e em quais dispositivos?
18. O que o usuário deve poder consultar sem conexão: mensagem de erro, dados recentes em cache ou uma experiência limitada?
19. Quais navegadores, versões e dispositivos precisam ser suportados?
20. Qual versão e quais critérios objetivos de WCAG AA serão usados para validar acessibilidade?
21. Qual perfil de conexão define “conexão típica”, e qual limite numérico define uma busca “rápida”?
22. Como devem ser tratados dados incompletos, erros distintos da fonte e falhas parciais entre geocodificação e previsão?
23. Há requisitos específicos de privacidade, retenção ou exclusão para buscas e preferências locais?
24. Como será feita a publicação e qual disponibilidade é esperada para o serviço?
25. As métricas propostas para as personas são adequadas, e quais critérios de sucesso do produto serão usados para aprovar o MVP?
