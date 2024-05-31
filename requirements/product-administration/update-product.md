## Atualizar Produto

## Dados

```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "price": 0,
  "isShown": true,
  "subCategoryId": "id",
  "image": ["bytes"]
}
```

## Requisitos

- ❎ Um administrador deve conseguir atualizar um produto existente.
  - ❎ A imagem do produto deve ser salva em algum storage, depois, a URL desse storage ficara no produto.
  - ❎ Deve ser emitido um evento ao atualizar um produto
  - ❎ (Nice To Have) Se a imagem for atualizada, apagar a imagem antiga
