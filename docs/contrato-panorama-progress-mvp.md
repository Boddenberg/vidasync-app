# Contrato de API Proposto: Panorama (MVP)

Este documento descreve a proposta de contrato backend para o novo Panorama da tela de Progresso.

Objetivo:
- suportar a visao agregada de `7`, `15` e `30` dias;
- manter o frontend simples;
- evitar uma plataforma grande de analytics;
- alinhar com os padroes atuais do app.

## 1. Alinhamento com o app atual

Padroes ja usados no repositorio:
- endpoints `GET` com filtros temporais em query string, por exemplo:
  - `/meals/summary?date=2026-03-24`
  - `/meals/range?startDate=2026-03-01&endDate=2026-03-31`
  - `/water/history?startDate=2026-03-01&endDate=2026-03-31`
- resposta envelopada por dominio, por exemplo:
  - `{ "waterHistory": { ... } }`
  - `{ "nutritionGoals": { ... } }`

Por isso, a proposta abaixo segue o mesmo estilo:
- `GET /progress/panorama?...`
- resposta com raiz `{ "panorama": { ... } }`

Headers protegidos esperados:
- `X-User-Id`
- `X-Access-Token` quando houver token salvo

## 2. Endpoint recomendado

### Endpoint unico do MVP

- `GET /progress/panorama`

Esse endpoint devolve:
- resumo agregado do periodo;
- serie diaria pronta para grafico;
- dias vazios preenchidos com zero;
- dados suficientes para gerar insight simples no frontend.

## 3. Query params recomendados

### Obrigatorios

- `periodDays`
  - valores aceitos: `7`, `15`, `30`

### Opcionais

- `endDate`
  - formato: `YYYY-MM-DD`
  - se ausente, backend usa "hoje" na timezone resolvida
- `timezone`
  - formato IANA, por exemplo `America/Sao_Paulo`
  - se ausente, backend pode usar timezone do perfil do usuario
  - se nao existir timezone do usuario, usar `UTC`

### Exemplo recomendado

- `/progress/panorama?periodDays=15&endDate=2026-03-24&timezone=America/Sao_Paulo`

## 4. Request example

```http
GET /progress/panorama?periodDays=15&endDate=2026-03-24&timezone=America/Sao_Paulo HTTP/1.1
Host: api.vidasync.app
X-User-Id: 11111111-2222-3333-4444-555555555555
X-Access-Token: <token-opcional>
```

## 5. Response example

```json
{
  "panorama": {
    "periodDays": 15,
    "timezone": "America/Sao_Paulo",
    "startDate": "2026-03-10",
    "endDate": "2026-03-24",
    "generatedAt": "2026-03-24T18:42:11.320Z",
    "summary": {
      "averageWaterMlPerDay": 1467,
      "averageCaloriesKcalPerDay": 1734,
      "daysWithRecords": 11
    },
    "days": [
      {
        "date": "2026-03-10",
        "waterMl": 0,
        "caloriesKcal": 0,
        "mealsCount": 0,
        "hasAnyRecord": false
      },
      {
        "date": "2026-03-11",
        "waterMl": 1800,
        "caloriesKcal": 1940,
        "mealsCount": 3,
        "hasAnyRecord": true
      },
      {
        "date": "2026-03-12",
        "waterMl": 1200,
        "caloriesKcal": 1650,
        "mealsCount": 2,
        "hasAnyRecord": true
      },
      {
        "date": "2026-03-13",
        "waterMl": 0,
        "caloriesKcal": 0,
        "mealsCount": 0,
        "hasAnyRecord": false
      }
    ]
  }
}
```

Observacoes:
- o array `days` deve ter exatamente `periodDays` itens;
- a ordem deve ser crescente: do dia mais antigo para o mais recente;
- dias sem dado nao devem ser omitidos.

## 6. Explicacao campo a campo

### Root

- `panorama`
  - envelope do dominio, alinhado ao padrao do app

### Panorama

- `periodDays`
  - periodo solicitado
  - inteiro
  - aceitos apenas `7`, `15`, `30`

- `timezone`
  - timezone usada para calcular o intervalo
  - string IANA

- `startDate`
  - primeiro dia do intervalo ja resolvido pelo backend
  - string `YYYY-MM-DD`

- `endDate`
  - ultimo dia do intervalo ja resolvido pelo backend
  - string `YYYY-MM-DD`

- `generatedAt`
  - momento em que o panorama foi montado
  - string ISO-8601 em UTC

- `summary`
  - resumo agregado do periodo

- `days`
  - serie diaria pronta para grafico e para regras simples de insight

### Summary

- `averageWaterMlPerDay`
  - media diaria de agua no periodo completo
  - inteiro em mililitros
  - calculada sobre todos os dias do periodo, inclusive dias zerados

- `averageCaloriesKcalPerDay`
  - media diaria de calorias no periodo completo
  - inteiro em quilocalorias
  - calculada sobre todos os dias do periodo, inclusive dias zerados

- `daysWithRecords`
  - quantidade de dias com algum registro no periodo
  - inteiro
  - deve contar `true` em `hasAnyRecord`

### Day item

- `date`
  - data local do dia agregado
  - string `YYYY-MM-DD`

- `waterMl`
  - total de agua consumida no dia
  - inteiro em mililitros

- `caloriesKcal`
  - total de calorias do dia
  - inteiro em quilocalorias

- `mealsCount`
  - quantidade de refeicoes registradas no dia
  - inteiro

- `hasAnyRecord`
  - `true` quando houve pelo menos um registro relevante no dia
  - `false` quando o dia ficou vazio

## 7. Unidades e convencoes

### Agua

- unidade: `ml`
- campos:
  - `waterMl`
  - `averageWaterMlPerDay`
- sempre numero inteiro

### Calorias

- unidade: `kcal`
- campos:
  - `caloriesKcal`
  - `averageCaloriesKcalPerDay`
- sempre numero inteiro

### Refeicoes

- unidade: contagem
- campo:
  - `mealsCount`
- sempre inteiro

### Datas

- datas de agregacao (`startDate`, `endDate`, `date`) devem ser sempre `YYYY-MM-DD`
- nao usar datetime nesses campos de serie diaria
- `generatedAt` pode ser datetime ISO-8601

## 8. Timezone

Recomendacao para o MVP:
- o frontend envia `timezone` explicitamente;
- o backend usa essa timezone para:
  - descobrir o "hoje";
  - fechar a janela de `periodDays`;
  - agrupar registros por dia local.

Importante:
- nunca agregar por UTC puro para a serie diaria;
- um registro das `00:30` em `America/Sao_Paulo` deve cair no dia local correto, nao no dia UTC.

Fallback sugerido:
1. usar `timezone` da query, se enviada;
2. se nao vier, usar timezone do perfil do usuario;
3. se nao existir, usar `UTC`.

## 9. Representacao de dias sem dados

Dias sem dados nao sao erro.

O backend deve sempre preencher o array `days` com todos os dias do intervalo solicitado.

Exemplo de dia vazio:

```json
{
  "date": "2026-03-13",
  "waterMl": 0,
  "caloriesKcal": 0,
  "mealsCount": 0,
  "hasAnyRecord": false
}
```

Isso simplifica:
- grafico;
- cards de resumo;
- regra de insight;
- contagem de consistencia.

## 10. Casos de erro

### `400 Bad Request`

Quando:
- `periodDays` nao for `7`, `15` ou `30`;
- `endDate` estiver em formato invalido;
- `timezone` estiver em formato invalido.

Exemplo:

```json
{
  "error": "Parametro periodDays invalido. Use 7, 15 ou 30."
}
```

### `401 Unauthorized`

Quando:
- faltar identificacao do usuario em rota protegida;
- sessao/token estiver invalido conforme regra atual do backend.

Exemplo:

```json
{
  "error": "Nao autorizado."
}
```

### `422 Unprocessable Entity`

Quando:
- `endDate` estiver no futuro da timezone resolvida;
- combinacao de parametros nao puder ser processada.

Exemplo:

```json
{
  "error": "endDate nao pode estar no futuro."
}
```

### `500 Internal Server Error`

Quando:
- falha inesperada ao montar agregados.

Exemplo:

```json
{
  "error": "Nao foi possivel gerar o panorama."
}
```

Observacao importante:
- ausencia de dados do usuario nao deve devolver erro;
- deve devolver sucesso com `summary` zerado e `days` preenchidos com zeros.

## 11. O que calcular no backend vs frontend

### Backend deve calcular

- resolucao do intervalo (`startDate`, `endDate`);
- agregacao diaria por timezone;
- preenchimento de dias sem dados;
- `daysWithRecords`;
- `averageWaterMlPerDay`;
- `averageCaloriesKcalPerDay`;
- ordenacao ascendente do array `days`.

### Frontend deve calcular

- seletor visual de periodo `7/15/30`;
- troca da metrica do grafico (`Agua`, `Calorias`, `Refeicoes`);
- formatacao visual de litros/kcal;
- texto helper simples, se o backend nao quiser mandar insight pronto.

### Opcional no futuro

Se o backend quiser ajudar depois sem aumentar muito o contrato, pode adicionar:

```json
{
  "insight": {
    "kind": "consistency_peak",
    "peakMetric": "calories",
    "peakDate": "2026-03-22",
    "peakValue": 2140
  }
}
```

Mas isso nao deve ser obrigatorio para o MVP.

## 12. Adapter/interface minima para frontend

Proposta de interface no app:

```ts
export type ProgressPanoramaQuery = {
  periodDays: 7 | 15 | 30;
  endDate?: string;
  timezone?: string;
};

export type ProgressPanoramaGateway = {
  getPanorama(query: ProgressPanoramaQuery): Promise<ProgressPanorama>;
};
```

Exemplo de chamada:

```ts
const data = await apiGetJson<ProgressPanoramaResponse>(
  `/progress/panorama?periodDays=15&endDate=2026-03-24&timezone=America/Sao_Paulo`,
);
```

Exemplo de adapter:

```ts
export async function getProgressPanoramaFromApi(
  query: ProgressPanoramaQuery,
): Promise<ProgressPanorama> {
  const params = new URLSearchParams({
    periodDays: String(query.periodDays),
  });

  if (query.endDate) params.set('endDate', query.endDate);
  if (query.timezone) params.set('timezone', query.timezone);

  const payload = await apiGetJson<ProgressPanoramaResponse>(
    `/progress/panorama?${params.toString()}`,
  );

  return payload.panorama;
}
```

## 13. Tipo TypeScript proposto

O arquivo sugerido no frontend e:

- `types/progress-panorama.ts`

Esse arquivo deve conter:
- query type;
- response envelope;
- objeto `panorama`;
- summary;
- day series;
- interface minima de adapter/gateway.

## 14. Recomendacao final

Para o MVP, a recomendacao e:

1. implementar apenas um endpoint:
   - `GET /progress/panorama`
2. aceitar:
   - `periodDays`
   - `endDate`
   - `timezone`
3. sempre devolver:
   - `summary`
   - `days` completos e ordenados
4. deixar insight textual no frontend por enquanto

Esse contrato ja cobre:
- cards de resumo;
- grafico diario;
- periodos de 7, 15 e 30 dias;
- dias vazios;
- evolucao futura sem reescrever a UI.
