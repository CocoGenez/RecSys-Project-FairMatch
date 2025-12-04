# models/fairness_reranker.py

from collections import Counter, defaultdict
from typing import List, Dict, Any


def rerank_conditional_demographic_parity(
    candidates: List[Dict[str, Any]],
    k: int,
    protected_attr: str = "group",
    min_qualified_score: float = 0.0,
    coverage_weight: float = 5.0,
) -> List[Dict[str, Any]]:
    """
    Fairness-aware reranker implementing a simplified version of:
      - Conditional Demographic Parity (CDP) on a ranked shortlist
      - + a coverage-based boost for under-exposed items.

    Expected fields in each candidate dict:
      - "score": float  (base relevance score)
      - "qualified": bool  (filter for CDP conditioning)
      - protected_attr (e.g. "group"): fairness group label
      - "job_id" or "id": unique identifier
      - "exposure_count": int (how many times this job was shown before)

    Parameters
    ----------
    candidates : list of dict
        Ranked list from the base model (higher score = more relevant).
    k : int
        Size of the shortlist to produce.
    protected_attr : str, default "group"
        Attribute on which to enforce group fairness.
    min_qualified_score : float, default 0.0
        Only candidates with score >= this value and qualified==True
        are considered by the reranker.
    coverage_weight : float, default 5.0
        Strength of coverage boost (bigger => more rotation of unseen jobs).

    Returns
    -------
    shortlist : list of dict
        Reranked top-k items, fairness + coverage aware.
    """

    # -----------------------------
    # 1. Filter by qualification + minimal relevance
    # -----------------------------
    qualified = [
        c for c in candidates
        if c.get("qualified", True) and c.get("score", 0.0) >= min_qualified_score
    ]

    if not qualified:
        print("[FAIRNESS] No qualified candidates; falling back to pure relevance top-k.")
        return sorted(
            candidates, key=lambda x: x.get("score", 0.0), reverse=True
        )[:k]

    # -----------------------------
    # 1bis. Coverage boost: compute FAIR_SCORE
    # -----------------------------
    # Items with low exposure_count get a higher boost so they have a better
    # chance of entering the top-k, improving coverage / exploration.
    for c in qualified:
        base_score = float(c.get("score", 0.0))
        exposure = float(c.get("exposure_count", 0))
        # inverse-propensity-style: 1 / (exposure + 1)
        coverage_boost = coverage_weight * (1.0 / (exposure + 1.0))
        fair_score = base_score + coverage_boost
        c["fair_score"] = fair_score

    # -----------------------------
    # 2. Compute target group proportions (CDP target)
    # -----------------------------
    groups = [c.get(protected_attr, "unknown") for c in qualified]
    group_counts = Counter(groups)
    total_qualified = len(qualified)

    group_proportions = {
        g: group_counts[g] / total_qualified for g in group_counts
    }

    print(
        f"[FAIRNESS/CDP] Qualified={total_qualified}, "
        f"groups={dict(group_counts)}, "
        f"target_proportions={group_proportions}"
    )

    # -----------------------------
    # 3. Pre-sort candidates by group & FAIR_SCORE (rank-awareness)
    # -----------------------------
    by_group = defaultdict(list)
    for c in qualified:
        g = c.get(protected_attr, "unknown")
        by_group[g].append(c)

    for g, items in by_group.items():
        items.sort(key=lambda x: x.get("fair_score", 0.0), reverse=True)

    # -----------------------------
    # 4. Build shortlist with det-greedy selection (skew minimization)
    # -----------------------------
    shortlist: List[Dict[str, Any]] = []
    taken_per_group = Counter()
    used_ids = set()

    def _get_id(item: Dict[str, Any]):
        # Use job_id if present, otherwise fall back to id
        return item.get("job_id") or item.get("id")

    for position in range(1, k + 1):
        # Remaining quota per group at this position
        remaining_quota = {}
        for g in group_proportions:
            ideal = group_proportions[g] * position
            remaining_quota[g] = ideal - taken_per_group[g]

        # Choose group with highest remaining quota
        target_group = max(remaining_quota, key=remaining_quota.get)
        next_c = None

        # If that group still "deserves" more items, try to pick from it
        if remaining_quota[target_group] > 0:
            next_c = _pop_next_from_group(by_group, target_group, used_ids, _get_id)

        # If nothing available in that group, pick best global candidate
        if next_c is None:
            next_c = _pop_best_global(by_group, used_ids, _get_id)

        if next_c is None:
            break

        shortlist.append(next_c)
        cid = _get_id(next_c)
        used_ids.add(cid)
        taken_per_group[next_c.get(protected_attr, "unknown")] += 1

    print(
        f"[FAIRNESS/CDP] Final shortlist size={len(shortlist)}, "
        f"taken_per_group={dict(taken_per_group)}"
    )

    return shortlist


def _pop_next_from_group(by_group, group_key, used_ids, get_id_fn):
    """
    Pick the next candidate from a specific group that hasn't been used yet.
    """
    candidates = by_group.get(group_key, [])
    while candidates:
        c = candidates.pop(0)
        cid = get_id_fn(c)
        if cid not in used_ids:
            return c
    return None


def _pop_best_global(by_group, used_ids, get_id_fn):
    """
    Fallback: among all groups, pick the remaining candidate
    with the highest FAIR_SCORE that hasn't been used yet.
    """
    best = None
    best_group = None

    for g, group_candidates in by_group.items():
        for c in group_candidates:
            cid = get_id_fn(c)
            if cid in used_ids:
                continue
            if best is None or c.get("fair_score", 0.0) > best.get("fair_score", 0.0):
                best = c
                best_group = g

    if best is not None and best_group is not None:
        by_group[best_group].remove(best)

    return best
