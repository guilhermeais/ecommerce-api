## Convite de Cadastro
## Dados
```json
{
  "email": "user@example.com",
  "name": "string"
}
```

## Requisitos
- ❎ Um usuário master ou administrador deve conseguir convidar uma outra pessoa para ser administradora.
    - ❎ Deve retornar um erro se o e-mail for inválido.
    - ❎ Deve gerar um convite para o email que foi convidado, contendo o email e o nome da pessaoa pessoa que foi convidada.
    - ❎ Deve deve enviar um email para a pessoal que foi convidada, contendo **"Olá `{{name}}`, você foi convidade para administrar o pia-labs ecommerce, [clique aqui]() para finalizar seu cadastro :)!"**