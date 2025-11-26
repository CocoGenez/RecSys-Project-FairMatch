import numpy as np

def ndcg_at_k(k=10):
    true_rel = np.array([1] + [0]*(k-1))
    scores = np.random.rand(k)
    order = np.argsort(scores)[::-1]
    true_sorted = true_rel[order]

    dcg = np.sum(true_sorted / np.log2(np.arange(2, k+2)))
    idcg = 1 / np.log2(2)
    return dcg / idcg

print("NDCG@10 (mock):", ndcg_at_k())
