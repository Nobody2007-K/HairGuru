"""
HAIRGURU - Database Helper Functions
--------------------------------------
Reusable functions for the HAIRGURU backend to interact with PostgreSQL.
"""

import psycopg2
import psycopg2.extras
from db_config import DB_CONFIG


def get_connection():
    """Return a new PostgreSQL connection to hairguru_db."""
    return psycopg2.connect(
        host=DB_CONFIG["host"],
        port=DB_CONFIG["port"],
        database=DB_CONFIG["database"],
        user=DB_CONFIG["user"],
        password=DB_CONFIG["password"],
    )


# ----------------------------------------------------------------
# Face Shapes
# ----------------------------------------------------------------

def get_all_face_shapes():
    """Return all face shapes as a list of dicts."""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT * FROM face_shapes ORDER BY id;")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return rows


def get_face_shape_by_name(name: str):
    """Return a single face shape by name."""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT * FROM face_shapes WHERE name = %s;", (name,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    return row


# ----------------------------------------------------------------
# Hairstyles
# ----------------------------------------------------------------

def get_all_hairstyles():
    """Return all hairstyles."""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT * FROM hairstyles ORDER BY id;")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return rows


def get_recommended_hairstyles(face_shape_name: str):
    """
    Return recommended hairstyles for a given face shape name,
    ordered by relevance score descending.
    """
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT h.*, fsr.score
        FROM hairstyles h
        JOIN face_shape_recommendations fsr ON fsr.hairstyle_id = h.id
        JOIN face_shapes fs ON fs.id = fsr.face_shape_id
        WHERE fs.name = %s
        ORDER BY fsr.score DESC, h.name;
    """, (face_shape_name,))
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return rows


def get_avoid_hairstyles(face_shape_name: str):
    """
    Return hairstyles to avoid for a given face shape name,
    along with the reason.
    """
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT h.*, fsa.reason
        FROM hairstyles h
        JOIN face_shape_avoid fsa ON fsa.hairstyle_id = h.id
        JOIN face_shapes fs ON fs.id = fsa.face_shape_id
        WHERE fs.name = %s
        ORDER BY h.name;
    """, (face_shape_name,))
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return rows


def get_recommendations_for_top2(shape1_name: str, shape2_name: str,
                                  prob1: float, prob2: float):
    """
    Blend recommendations from two face shapes weighted by their
    prediction probabilities. Returns sorted list of hairstyle dicts
    with a 'blended_score' key.
    """
    recs1 = get_recommended_hairstyles(shape1_name)
    recs2 = get_recommended_hairstyles(shape2_name)

    p_sum = prob1 + prob2 if (prob1 + prob2) > 0 else 1.0
    w1, w2 = prob1 / p_sum, prob2 / p_sum

    scores = {}
    results = {}

    for r in recs1:
        key = r["name"]
        scores[key] = scores.get(key, 0.0) + float(r["score"]) * w1
        results[key] = dict(r)

    for r in recs2:
        key = r["name"]
        scores[key] = scores.get(key, 0.0) + float(r["score"]) * w2
        results[key] = dict(r)

    # Attach blended score and sort
    for key in results:
        results[key]["blended_score"] = round(scores[key], 4)

    sorted_recs = sorted(results.values(),
                         key=lambda x: x["blended_score"], reverse=True)
    return sorted_recs


# ----------------------------------------------------------------
# User Analysis
# ----------------------------------------------------------------

def save_analysis(user_id: str, image_path: str,
                  probs: dict, primary_shape_id: int,
                  secondary_shape_id: int):
    """
    Save a face analysis result.

    Parameters
    ----------
    user_id : str (UUID)
    image_path : str
    probs : dict  e.g. {"Heart": 0.20, "Oblong": 0.25, ...}
    primary_shape_id : int
    secondary_shape_id : int

    Returns
    -------
    int : the new analysis id
    """
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO user_analyses
            (user_id, image_path,
             prob_heart, prob_oblong, prob_oval, prob_round, prob_square,
             primary_shape_id, secondary_shape_id)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id;
    """, (
        user_id, image_path,
        probs.get("Heart", 0), probs.get("Oblong", 0),
        probs.get("Oval", 0), probs.get("Round", 0),
        probs.get("Square", 0),
        primary_shape_id, secondary_shape_id,
    ))
    analysis_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    return analysis_id


def get_user_analyses(user_id: str):
    """Return all analyses for a user, newest first."""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT ua.*,
               fs1.name AS primary_shape_name,
               fs2.name AS secondary_shape_name
        FROM user_analyses ua
        LEFT JOIN face_shapes fs1 ON fs1.id = ua.primary_shape_id
        LEFT JOIN face_shapes fs2 ON fs2.id = ua.secondary_shape_id
        WHERE ua.user_id = %s
        ORDER BY ua.analyzed_at DESC;
    """, (user_id,))
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return rows


# ----------------------------------------------------------------
# Favorites
# ----------------------------------------------------------------

def add_favorite(user_id: str, hairstyle_id: int):
    """Save a hairstyle to user's favorites."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO user_favorites (user_id, hairstyle_id)
        VALUES (%s, %s)
        ON CONFLICT DO NOTHING;
    """, (user_id, hairstyle_id))
    conn.commit()
    cur.close()
    conn.close()


def remove_favorite(user_id: str, hairstyle_id: int):
    """Remove a hairstyle from user's favorites."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        DELETE FROM user_favorites
        WHERE user_id = %s AND hairstyle_id = %s;
    """, (user_id, hairstyle_id))
    conn.commit()
    cur.close()
    conn.close()


def get_favorites(user_id: str):
    """Get all favorited hairstyles for a user."""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT h.*, uf.saved_at
        FROM hairstyles h
        JOIN user_favorites uf ON uf.hairstyle_id = h.id
        WHERE uf.user_id = %s
        ORDER BY uf.saved_at DESC;
    """, (user_id,))
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return rows


# ----------------------------------------------------------------
# Feedback
# ----------------------------------------------------------------

def save_feedback(user_id: str, analysis_id: int,
                  hairstyle_id: int, rating: int, comment: str = None):
    """Save user feedback on a recommendation."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO user_feedback
            (user_id, analysis_id, hairstyle_id, rating, comment)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id;
    """, (user_id, analysis_id, hairstyle_id, rating, comment))
    fid = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    return fid


# ----------------------------------------------------------------
# Quick demo
# ----------------------------------------------------------------
if __name__ == "__main__":
    print("=== HAIRGURU DB Helper Demo ===\n")

    # Show face shapes
    shapes = get_all_face_shapes()
    print("Face Shapes:")
    for s in shapes:
        print(f"  {s['id']}. {s['name']:10s} - {s['note']}")

    # Show recommendations for "Square"
    print("\nRecommended for Square face:")
    recs = get_recommended_hairstyles("Square")
    for r in recs:
        print(f"  [+] {r['name']}")

    # Show avoids for "Round"
    print("\nAvoid for Round face:")
    avoids = get_avoid_hairstyles("Round")
    for a in avoids:
        print(f"  [-] {a['name']} - {a['reason']}")

    # Blended recommendation (simulating model output)
    print("\nBlended Recommendations (Square 45%, Oblong 26%):")
    blended = get_recommendations_for_top2("Square", "Oblong", 0.45, 0.26)
    for b in blended:
        print(f"  [*] {b['name']} (score: {b['blended_score']})")

