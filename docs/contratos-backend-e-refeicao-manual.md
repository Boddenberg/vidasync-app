# Contratos de Backend e Proposta de Refeição Manual

Este documento foi montado com base no frontend atual do app.

Objetivo:
- descrever como as requests chegam hoje ao backend;
- listar o formato de resposta que o frontend espera;
- propor como encaixar um modo de "preencher refeição manualmente" sem quebrar o fluxo atual.

## 1. Headers comuns

O cliente HTTP base do app injeta estes headers automaticamente nas rotas protegidas:

- `Content-Type: application/json`
- `X-User-Id: <uuid-do-usuario>` quando o usuário está autenticado
- `X-Access-Token: <token>` quando existe token salvo

Observações:
- `login` e `signup` não dependem de `X-User-Id`.
- se uma rota protegida responder `401` ou `403` nos fluxos de perfil, o frontend entende como sessão expirada.

---

## 2. Feedback

### 2.1. Enviar feedback

Rota usada hoje:

- `POST /feedback`

Body enviado pelo app:

```json
{
  "userName": "Joao Silva",
  "message": "Ao salvar a refeicao, o card some e volta so depois de atualizar a tela.",
  "imageUrl": "https://cdn.exemplo.com/feedbacks/print-123.jpg"
}
```

Observações importantes:

- `userName` é obrigatório no frontend.
- `message` é obrigatório no frontend.
- `imageUrl` é opcional.
- quando existe imagem, o app não manda `base64` para `/feedback`; ele resolve uma URL pública antes e manda essa URL no body.
- além do body, a request também pode chegar com `X-User-Id` e `X-Access-Token`.

Resposta esperada pelo frontend:

```json
{
  "feedback": {
    "id": "fb_123",
    "userId": "11111111-2222-3333-4444-555555555555",
    "userName": "Joao Silva",
    "message": "Ao salvar a refeicao, o card some e volta so depois de atualizar a tela.",
    "imageUrl": "https://cdn.exemplo.com/feedbacks/print-123.jpg",
    "status": "open",
    "developerResponse": null,
    "respondedAt": null,
    "respondedBy": null,
    "responseSeenAt": null,
    "createdAt": "2026-03-17T14:20:00.000Z",
    "updatedAt": "2026-03-17T14:20:00.000Z",
    "date": "17/03/2026",
    "time": "14:20:00"
  }
}
```

Campos obrigatórios para o parser atual do app:

- `id`
- `userId`
- `userName`
- `message`
- `status`
- `createdAt`
- `updatedAt`
- `date`
- `time`

Campos opcionais aceitos:

- `imageUrl`
- `developerResponse`
- `respondedAt`
- `respondedBy`
- `responseSeenAt`

### 2.2. Painel interno de feedback

Rota usada hoje:

- `GET /feedback`

Header adicional:

- `X-Internal-Api-Key: <chave-interna>`

Resposta esperada:

```json
{
  "feedbacks": [
    {
      "id": "fb_123",
      "userId": "11111111-2222-3333-4444-555555555555",
      "userName": "Joao Silva",
      "message": "Mensagem",
      "imageUrl": null,
      "status": "open",
      "developerResponse": null,
      "respondedAt": null,
      "respondedBy": null,
      "responseSeenAt": null,
      "createdAt": "2026-03-17T14:20:00.000Z",
      "updatedAt": "2026-03-17T14:20:00.000Z",
      "date": "17/03/2026",
      "time": "14:20:00"
    }
  ]
}
```

---

## 3. Perfil: trocar usuário e trocar senha

### 3.1. Verificar disponibilidade de usuário

Antes de salvar a troca de usuário, o frontend consulta:

- `GET /auth/profile/username/availability?username=<novoUsuario>`

Headers:

- `X-User-Id`
- `X-Access-Token`

Resposta esperada:

```json
{
  "username": "novoUsuario",
  "available": true,
  "message": "Nome de usuario disponivel."
}
```

Se essa rota não existir e responder `404` ou `405`, o app hoje mostra erro dizendo que o endpoint ainda não existe.

### 3.2. Trocar usuário

Rota usada:

- `PUT /auth/profile/username`

Body enviado:

```json
{
  "username": "novoUsuario",
  "currentPassword": "senhaAtual123"
}
```

Validações já aplicadas no frontend:

- mínimo de 3 caracteres
- máximo de 30 caracteres
- deve começar com letra
- só aceita letras e números
- precisa ser diferente do usuário atual
- precisa informar a senha atual

Resposta que o frontend espera hoje:

```json
{
  "userId": "11111111-2222-3333-4444-555555555555",
  "username": "novoUsuario",
  "profileImageUrl": "https://cdn.exemplo.com/avatar.jpg",
  "accessToken": "token-opcional"
}
```

Observação importante:

- o frontend atual trata a resposta de troca de usuário como `AuthResponse`.
- isso significa que ele espera pelo menos `userId`, `username` e `profileImageUrl` para atualizar o estado local.
- se o backend responder só `{ "success": true }`, o app atual quebra esse fluxo.

### 3.3. Trocar senha

Rota usada:

- `PUT /auth/profile/password`

Body enviado:

```json
{
  "currentPassword": "senhaAtual123",
  "newPassword": "novaSenha123"
}
```

Validações já aplicadas no frontend:

- senha atual obrigatória
- nova senha obrigatória
- confirmação obrigatória
- mínimo de 6 caracteres
- máximo de 64 caracteres
- nova senha deve ser diferente da atual
- confirmação deve bater com a nova senha

Resposta que o frontend espera hoje:

```json
{
  "userId": "11111111-2222-3333-4444-555555555555",
  "username": "usuarioAtual",
  "profileImageUrl": "https://cdn.exemplo.com/avatar.jpg",
  "accessToken": "token-opcional"
}
```

Observação importante:

- hoje o frontend também trata a troca de senha como `AuthResponse`.
- então, pelo código atual, o ideal é a rota devolver o mesmo formato das rotas de login/profile.
- se o backend quiser devolver apenas sucesso simples, o frontend precisará ser ajustado.

### 3.4. Tradução de erros já esperada pelo frontend

O frontend já traduz algumas mensagens do backend. Exemplos:

- `invalid credentials` -> `Usuario ou senha incorretos.`
- `current password invalid` -> `Senha atual incorreta.`
- `already exists` / `already taken` -> `Esse nome de usuario ja esta em uso.`
- `forbidden` -> `Operacao nao permitida. Tente novamente mais tarde.`

---

## 4. Refeição: fluxo atual

Hoje o modal "Registrar refeição" funciona assim:

1. o usuário adiciona ingredientes um a um;
2. o app chama `POST /nutrition/calories` com texto livre;
3. depois salva a refeição em `POST /meals`.

### 4.1. Cálculo nutricional atual

Rota usada:

- `POST /nutrition/calories`

Body atual:

```json
{
  "foods": "100g de arroz, 150g de frango, 1 un de banana"
}
```

### 4.2. Salvar refeição atual

Rota usada:

- `POST /meals`

Body atual:

```json
{
  "foods": "Marmita fitness — 100g de arroz, 150g de frango",
  "mealType": "lunch",
  "date": "2026-03-17",
  "time": "12:35",
  "nutrition": {
    "calories": "540",
    "protein": "38",
    "carbs": "42",
    "fat": "18"
  },
  "image": "data:image/jpeg;base64,..."
}
```

Observações:

- `foods` é uma string livre.
- quando existe nome de prato, o frontend junta assim:
  - `Nome do prato — ingredientes`
- `nutrition` já é enviado no payload de criação.
- isso é importante porque abre espaço para um modo manual sem obrigar uma rota nova.

Resposta esperada pelo frontend:

```json
{
  "meal": {
    "id": "meal_123",
    "foods": "Marmita fitness — 100g de arroz, 150g de frango",
    "mealType": "lunch",
    "date": "2026-03-17",
    "time": "12:35",
    "nutrition": {
      "calories": "540",
      "protein": "38",
      "carbs": "42",
      "fat": "18"
    },
    "imageUrl": "https://cdn.exemplo.com/meals/meal_123.jpg",
    "createdAt": "2026-03-17T12:35:00.000Z"
  }
}
```

---

## 5. Proposta: "Registrar manualmente" de verdade

### 5.1. O problema atual

Hoje "registrar manualmente" ainda significa:

- digitar ingrediente por ingrediente;
- mandar para cálculo automático;
- só então salvar.

Mas a necessidade agora é outra:

- digitar o nome do prato;
- informar ingredientes e gramaturas;
- preencher calorias, proteína, carboidrato e gordura na mão;
- salvar sem depender do cálculo automático.

### 5.2. Recomendação de produto/UI

A opção "Registrar refeição" pode abrir dois modos:

- `Calcular macros`
- `Preencher manualmente`

No modo `Preencher manualmente`, os campos seriam:

- nome do prato
- lista de ingredientes
- gramatura por ingrediente
- calorias
- proteína
- carboidratos
- gordura
- foto opcional
- data
- horário
- tipo de refeição

### 5.3. Melhor caminho técnico: reaproveitar o endpoint atual de refeições

A melhor opção para a primeira versão é:

- não criar endpoint novo;
- usar o mesmo `POST /meals`;
- parar de chamar `/nutrition/calories` quando o usuário escolher o modo manual;
- montar `nutrition` diretamente a partir do que ele digitou.

Exemplo de body para o modo manual:

```json
{
  "foods": "Bolo de banana — 120g de banana, 80g de aveia, 2 un de ovo",
  "mealType": "breakfast",
  "date": "2026-03-17",
  "time": "08:10",
  "nutrition": {
    "calories": "430",
    "protein": "18",
    "carbs": "52",
    "fat": "14"
  },
  "image": "data:image/jpeg;base64,..."
}
```

Vantagens:

- quase zero impacto no backend se ele já aceita `nutrition` no `POST /meals`;
- zero quebra no app;
- mesma resposta continua servindo;
- a mudança fica concentrada na UI e no fluxo do modal.

### 5.4. O único ponto para confirmar no backend

Para essa abordagem funcionar bem, o backend precisa:

- aceitar o `nutrition` vindo do cliente;
- persistir esse `nutrition` sem obrigar recalcular a partir de `foods`.

Se hoje o backend ignora `nutrition` e sempre recalcula, então será necessário adicionar uma regra como:

- quando vier `source = "manual"`, confiar no `nutrition` enviado;
- ou, mais simples, quando vier `nutrition`, salvar exatamente esse valor.

### 5.5. Recomendação de contrato para deixar isso mais explícito

Mesmo sem ser obrigatório para a V1, eu recomendo aceitar estes campos extras:

```json
{
  "source": "manual",
  "dishName": "Bolo de banana",
  "ingredients": [
    { "name": "banana", "amount": "120", "unit": "g" },
    { "name": "aveia", "amount": "80", "unit": "g" },
    { "name": "ovo", "amount": "2", "unit": "un" }
  ]
}
```

Com isso:

- `foods` continua existindo para compatibilidade;
- `dishName` e `ingredients` ficam estruturados para futuro;
- `source` permite separar refeição calculada de refeição manual.

### 5.6. Sugestão de compatibilidade

Se o backend aceitar esses novos campos, a rota pode continuar respondendo do mesmo jeito:

```json
{
  "meal": {
    "id": "meal_123",
    "foods": "Bolo de banana — 120g de banana, 80g de aveia, 2 un de ovo",
    "mealType": "breakfast",
    "date": "2026-03-17",
    "time": "08:10",
    "nutrition": {
      "calories": "430",
      "protein": "18",
      "carbs": "52",
      "fat": "14"
    },
    "imageUrl": null,
    "createdAt": "2026-03-17T08:10:00.000Z"
  }
}
```

Assim, o frontend atual continua compatível.

---

## 6. Recomendação final

### Para backend agora

Implementar/confirmar:

- `POST /feedback`
- `GET /feedback` com `X-Internal-Api-Key`
- `GET /auth/profile/username/availability`
- `PUT /auth/profile/username`
- `PUT /auth/profile/password`

E manter como resposta de perfil:

- `userId`
- `username`
- `profileImageUrl`
- `accessToken` opcional

### Para a refeição manual

Minha recomendação é:

1. criar no frontend um segundo modo dentro de `Registrar refeição`;
2. reaproveitar `POST /meals`;
3. enviar `nutrition` preenchido manualmente;
4. opcionalmente enriquecer o contrato com `source`, `dishName` e `ingredients`.

Isso resolve a necessidade sem exigir uma nova rota logo de início.
