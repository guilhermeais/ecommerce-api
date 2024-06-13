import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import warnings
from scipy.sparse import csc_matrix
from sklearn.neighbors import NearestNeighbors
import joblib
import sys

def configure_settings():
    warnings.filterwarnings('ignore')
    pd.set_option('display.max_rows', 100)
    pd.set_option('display.max_columns', 50)
    plt.rcParams['figure.figsize'] = (15, 6)
    plt.style.use('seaborn-darkgrid')

def load_data(csv_path):
    df = pd.read_csv(csv_path)
    return df

def preprocess_data(df):
    df['produto_venda'] = 1
    return df

def check_duplicates(df):
    columns = df.columns.tolist()
    dataset_duplicates = df[df.duplicated(subset=columns, keep=False)]

    if len(dataset_duplicates) > 0:
        print('\nAmostras redundantes ou inconsistentes:')
        print(dataset_duplicates)
    else:
        print('Não existem valores duplicados')

def create_pivot_table(df):
    pivot_table = df.pivot_table(values='produto_venda', index='id_produto', columns='id_venda')
    pivot_table.fillna(0, inplace=True)
    return pivot_table

def create_sparse_matrix(pivot_table):
    sparse_matrix = csc_matrix(pivot_table)
    return sparse_matrix

def train_model(sparse_matrix, n_neighbors=5, algorithm='brute', metric='minkowski'):
    model = NearestNeighbors(n_neighbors=n_neighbors, algorithm=algorithm, metric=metric)
    model.fit(sparse_matrix)
    return model

def save_model(model, base_path):
    joblib_file = base_path + "modelo.pkl"
    joblib.dump(model, joblib_file)

def save_pivot_table(pivot_table, base_path):
    pivot_table.to_pickle(base_path + "matriz.pkl")

def main():
    if len(sys.argv) != 3:
        print("Usage: python script_name.py <csv_path> <base_path>")
        sys.exit(1)

    csv_path = sys.argv[1]
    base_path = sys.argv[2]

    configure_settings()

    df = load_data(csv_path)
    df = preprocess_data(df)
    check_duplicates(df)

    pivot_table = create_pivot_table(df)
    sparse_matrix = create_sparse_matrix(pivot_table)

    model = train_model(sparse_matrix)

    save_model(model, base_path)
    save_pivot_table(pivot_table, base_path)

if __name__ == "__main__":
    main()
