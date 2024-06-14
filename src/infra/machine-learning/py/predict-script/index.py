import joblib
import sys
import argparse
import warnings
import json
import os
from pandas.core.api import DataFrame
warnings.filterwarnings("ignore")

os.environ['OMP_NUM_THREADS'] =  '1'

def load_model_and_matrix(model_path, matrix_path):
    try:
        model = joblib.load(model_path)
        matriz: DataFrame = joblib.load(matrix_path)
        return model, matriz
    except Exception as e:
        print(f"Erro ao carregar o modelo ou a matriz: {e}")
        sys.exit(1)

def get_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("productId", help="O ID do produto para o qual você deseja obter produtos similares", type=str)
    parser.add_argument("modelPath", help="O caminho para o arquivo do modelo", type=str)
    parser.add_argument("matrixPath", help="O caminho para o arquivo da matriz", type=str)
    args = parser.parse_args()

    return args.productId, args.modelPath, args.matrixPath

def validate_product_id(product_id, matriz: DataFrame):
    if product_id not in matriz.index:
        return False
    return True

def select_product(product_id, matriz: DataFrame):
    index = matriz.index.get_loc(product_id)
    product = matriz.iloc[index, :].values.reshape(1, -1)
    return product

def make_prediction(model, product):
    try:
        distances, recommendations = model.kneighbors(product)
        return recommendations
    except Exception as e:
        print(f"Erro ao fazer a previsão: {e}")
        sys.exit(1)

def get_product_ids(recommendations, product_id, matriz: DataFrame):
    product_ids: list[str] = []
 
    for _ in recommendations:
        for index in _:
            similar_product_id = matriz.index[index]
    
            if similar_product_id != product_id:
                product_ids.append(similar_product_id)
    return product_ids

def main():
    product_id, model_path, matrix_path = get_args()
    model, matriz = load_model_and_matrix(model_path, matrix_path)
    is_valid = validate_product_id(product_id, matriz)
    if not is_valid:
        print(json.dumps([]))
        return
    product = select_product(product_id, matriz)
    recommendations = make_prediction(model, product)
    id_products = get_product_ids(recommendations, product_id, matriz)
    print(json.dumps(id_products))

if __name__ == "__main__":
    main()