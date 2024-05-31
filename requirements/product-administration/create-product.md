## Criar Produto

## Dados

```json
{
  "name": "string",
  "description": "string",
  "price": 0,
  "isShown": true,
  "subCategoryId": "id",
  "image": ["bytes"]
}
```

## Requisitos

- ❎ Um administrador deve conseguir cadastrar um produto.
  - ❎ A imagem do produto deve ser salva em algum storage, depois, a URL desse storage ficara no produto.
  - ❎ Deve ser emitido um evento ao criar um produto novo
