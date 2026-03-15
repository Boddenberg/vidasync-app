# Tutorial: Como alimentar o centro de notificações do app

Este arquivo descreve o contrato que o frontend espera para:

- listar notificações do usuário
- mostrar contador de não lidas no sino da home
- marcar uma ou várias notificações como lidas

Header obrigatório em todos os endpoints:

```http
X-User-Id: <uuid-do-usuario>
```

---

## 1. Objetivo do fluxo

Com esse contrato, o frontend consegue:

- trocar a engrenagem duplicada da home por um sino
- mostrar badge com quantidade de notificações não lidas
- abrir uma central com cards visuais
- exibir imagem opcional enviada pelo backend
- navegar para uma área do app quando a notificação tiver ação
- marcar item individual ou tudo como lido

Importante:

- o frontend funciona melhor se o backend já devolver `unreadCount`
- se `unreadCount` não vier, o frontend calcula pelo `readAt == null`
- `actionRoute` é opcional
- `imageUrl` é opcional e pode usar o mesmo padrão de URL pública já usado nas outras imagens

---

## 2. Listar notificações

Endpoint:

```http
GET /notifications
X-User-Id: <user-id>
```

Resposta esperada:

```json
{
  "unreadCount": 2,
  "notifications": [
    {
      "id": "uuid-1",
      "title": "Resposta da equipe",
      "message": "Respondemos seu feedback sobre o envio de foto. Já pode testar novamente.",
      "type": "INFO",
      "imageUrl": null,
      "actionLabel": "Abrir feedback",
      "actionRoute": "/feedback",
      "readAt": null,
      "createdAt": "2026-03-15T16:20:00.000Z",
      "date": "2026-03-15",
      "time": "16:20:00"
    },
    {
      "id": "uuid-2",
      "title": "Meta concluída",
      "message": "Você bateu sua meta de hidratação ontem. Continue assim.",
      "type": "SUCCESS",
      "imageUrl": "https://meu-bucket.s3.amazonaws.com/notifications/water-badge.png",
      "actionLabel": "Ver progresso",
      "actionRoute": "/(tabs)/history",
      "readAt": "2026-03-15T10:00:00.000Z",
      "createdAt": "2026-03-14T22:10:00.000Z",
      "date": "2026-03-14",
      "time": "22:10:00"
    }
  ]
}
```

Campos esperados por item:

- `id`: obrigatório
- `title`: obrigatório
- `message`: obrigatório
- `type`: opcional, mas recomendado
- `imageUrl`: opcional
- `actionLabel`: opcional
- `actionRoute`: opcional
- `readAt`: opcional, `null` quando ainda não foi lida
- `createdAt`: obrigatório
- `date`: opcional
- `time`: opcional

Valores aceitos em `type`:

- `INFO`
- `SUCCESS`
- `WARNING`
- `ALERT`

Como o front usa esses campos:

- `type` controla cor e ícone do card
- `imageUrl` mostra uma imagem no corpo da notificação
- `actionLabel` aparece como chip no card
- `actionRoute` define para onde o app navega ao tocar na notificação
- `readAt = null` conta como não lida

Rotas de ação recomendadas:

- `/(tabs)/history`
- `/feedback`
- `/tools/imc`
- `/(tabs)/explore`

Observações:

- o backend pode devolver em ordem do mais recente para o mais antigo
- mesmo assim o frontend reordena por `createdAt` por segurança

---

## 3. Marcar notificação como lida

Endpoint:

```http
POST /notifications/read
Content-Type: application/json
X-User-Id: <user-id>
```

Para marcar um item:

```json
{
  "notificationIds": ["uuid-1"]
}
```

Para marcar vários:

```json
{
  "notificationIds": ["uuid-1", "uuid-2", "uuid-3"]
}
```

Para marcar tudo:

```json
{
  "markAll": true
}
```

Resposta recomendada:

```json
{
  "unreadCount": 0,
  "notifications": [
    {
      "id": "uuid-1",
      "title": "Resposta da equipe",
      "message": "Respondemos seu feedback sobre o envio de foto. Já pode testar novamente.",
      "type": "INFO",
      "imageUrl": null,
      "actionLabel": "Abrir feedback",
      "actionRoute": "/feedback",
      "readAt": "2026-03-15T16:25:00.000Z",
      "createdAt": "2026-03-15T16:20:00.000Z",
      "date": "2026-03-15",
      "time": "16:20:00"
    }
  ]
}
```

Se o backend preferir, pode responder só:

```json
{
  "unreadCount": 0
}
```

Mas o ideal é devolver a lista atualizada.

---

## 4. Regras de negócio sugeridas

- nova notificação nasce com `readAt = null`
- ao marcar como lida, grave `readAt` com timestamp UTC
- o `unreadCount` deve considerar apenas itens com `readAt = null`
- `actionRoute` deve ser uma rota válida do app
- `imageUrl` pode ser `null`
- o backend pode usar esse sistema tanto para mensagens manuais quanto automáticas

Exemplos de uso:

- resposta da equipe para feedback
- aviso de manutenção
- recado sobre nova funcionalidade
- lembrete de completar cadastro
- mensagem com imagem de campanha, onboarding ou status

---

## 5. Exemplo simples de entidade

Estrutura sugerida no banco:

```json
{
  "id": "uuid",
  "userId": "uuid-do-usuario",
  "title": "string",
  "message": "string",
  "type": "INFO | SUCCESS | WARNING | ALERT",
  "imageUrl": "string|null",
  "actionLabel": "string|null",
  "actionRoute": "string|null",
  "readAt": "timestamp|null",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

Se quiser, você também pode manter:

- `sentBy`
- `source`
- `metadata`
- `expiresAt`

O frontend atual não depende desses campos extras.

---

## 6. Fluxo recomendado

1. O app chama `GET /notifications` ao entrar na home.
2. O backend devolve a lista e `unreadCount`.
3. O frontend mostra o badge no sino.
4. Ao tocar em uma notificação não lida, o frontend chama `POST /notifications/read`.
5. Se a notificação tiver `actionRoute`, o app navega depois da leitura.
6. Ao tocar em `Marcar tudo como lido`, o frontend chama `POST /notifications/read` com `markAll: true`.

---

## 7. Resumo rápido

- `GET /notifications`: lista notificações e contador de não lidas
- `POST /notifications/read`: marca uma, várias ou todas como lidas

---

## 8. Observação importante

Hoje o frontend trata `404`, `405` e `501` como “recurso ainda indisponível” e mostra estado vazio, sem quebrar a home.

Assim, você pode subir a UI primeiro e ligar o backend depois.
