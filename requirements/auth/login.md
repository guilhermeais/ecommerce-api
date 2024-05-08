## Login
## Dados
```json
{
  "email": "user@example.com",
  "password": "string",
}
```

## Requisitos
- 🟩 Um usuário que já tem conta deve conseguir logar no sistema.
    - 🟩 Deve retornar o **token de autenticação** do usuário
    - 🟩 Deve retornar um erro se o usuário não existir
    - 🟩 Deve retornar um erro se a senha ou email forem inválidos