## Finalizar convite de cadastro

## Dados

```json
{
  "name": "string",
  "email": "user@example.com",
  "password": "string",
  "maritalStatus": "single",
  "role": "admin",
  "address": {
    "cep": "string",
    "address": "string",
    "number": "string",
    "state": "string",
    "city": "string"
  },
  "isConfirmed": true
}
```

## Requisitos

- 🟩 Um usuário logado deve conseguir visualizar suas informações
  - 🟩 Deve retornar um erro de não autenticado caso o usuário não esteja logado
