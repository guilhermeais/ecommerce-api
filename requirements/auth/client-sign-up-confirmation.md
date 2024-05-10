## Confirmação de conta do Usuário/Comprador

## Dados
```json
{
  "confirmationToken": ""
}
```

## Requisitos
- 🟩 Um usuário/comprador deve conseguir confirmar sua conta.
    - 🟩 Ao finalizar o cadastro, devemos gerar um token de confirmação para esse usuário.
    - 🟩 Enviar token de confirmação pelo email, dizendo: "Olá, XPTO. Confirme sua conta [clicando aqui]()"
    - 🟩 Devemos ter uma rota que confirma a conta do usuário através do token de confirmação recebido no email. Essa rota irá receber o token, invalidar esse token na base de dados e marcar a conta do usuário como **confirmada**.