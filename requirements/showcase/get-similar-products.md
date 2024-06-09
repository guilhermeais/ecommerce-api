## Busca produtos similares
Dado um produto, devemos retornar os produtos similares àquele produto.

## Dados

```json
{
  "total": 0,
  "pages": 0,
  "currentPage": 0,
  "items": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "price": 0,
      "category": {
        "id": "string",
        "name": "string",
        "rootCategory": {
          "id": "string",
          "name": "string",
          "description": "string"
        }
      },
      "image": "string"
    }
  ]
}
```

## Filtros

```json
{
  "productId": "string",
  "limit": 10,
  "page": 1
}
```

## Requisitos

- 🟩 Um usuário logado deve obter os produtos similares ao produto informado.