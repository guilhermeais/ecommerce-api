import joblib
import sys
import argparse
import warnings
warnings.filterwarnings("ignore")

def load_model_and_matrix(model_path, matrix_path):
    try:
        model = joblib.load(model_path)
        matriz = joblib.load(matrix_path)
        return model, matriz
    except Exception as e:
        print(f"Erro ao carregar o modelo ou a matriz: {e}")
        sys.exit(1)

def get_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("productId", help="O ID do produto para o qual você deseja obter produtos similares", type=int)
    parser.add_argument("modelPath", help="O caminho para o arquivo do modelo", type=str)
    parser.add_argument("matrixPath", help="O caminho para o arquivo da matriz", type=str)
    args = parser.parse_args()

    return args.productId, args.modelPath, args.matrixPath

def validate_index(index, matriz):
    if index < 0 or index >= len(matriz):
        print("Índice fora do intervalo")
        sys.exit(1)

def select_product(index, matriz):
    return matriz.iloc[index, :].values.reshape(1, -1)

def make_prediction(model, product):
    try:
        distances, recommendations = model.kneighbors(product)
        return recommendations
    except Exception as e:
        print(f"Erro ao fazer a previsão: {e}")
        sys.exit(1)

def get_product_ids(recommendations, index):
    id_products: list[int] = []
 
    for _ in recommendations:
        for item in _:
            if item != index:
                id_products.append(item + 1)
    return id_products

def main():
    product_id, model_path, matrix_path = get_args()
    model, matriz = load_model_and_matrix(model_path, matrix_path)
    validate_index(product_id, matriz)
    product = select_product(product_id, matriz)
    recommendations = make_prediction(model, product)
    id_products = get_product_ids(recommendations, product_id)
    print(id_products)

if __name__ == "__main__":
    main()