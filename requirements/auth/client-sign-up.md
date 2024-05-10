## Cadastro de Usuário/Comprador
## Dados
```json
{
  "email": "user@example.com",
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
```

## Requisitos
- 🟩 Cadastrar Usuário/Comprador
- 🟩 Um usuário/comprador deve conseguir se cadastrar no ecommerce
    - ❎ Teremos uma conta por email, caso tente cadastrar um e-mail repetido, obteremos erro.
    - ❎ O email deve ser válido.
    - ❎ A senha deve ser hasheada ao salvar na base de dados.
    - ❎ Ao finalizar o cadastro, devemos retornar o **token de autenticação** ao usuário.
    - ❎ Ao finalizar o cadastro, deve ser emitido um evento user.created