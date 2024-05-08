## Finalizar convite de cadastro

## Dados

```json
{
  "inviteToken": "string",
  "finishSignupData": {
    "password": "string",
    "name": "string",
    "cpf": "string",
    "phone": "string",
    "address": {
      "cep": "string",
      "address": "string",
      "number": "string",
      "state": "string",
      "city": "string"
    }
  }
}
```

## Requisitos

- 🟩 Um usuário convidado deve ser capaz de finalizar o seu cadastro.
  - 🟩 Deve retornar um erro se o convite já tiver expirado
  - 🟩 Deve invalidar o token de convite
  - 🟩 Deve criar uma conta pro usuário
  - 🟩 Deve retornar o **token de autenticação do usuário**
  - 🟩 Uma conta criada a partir de um convite já é **confirmada** automaticamente.
