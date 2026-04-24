"""
transits.py — Ignis Transit Digest Engine

Calculates current planet positions and their aspects to Vision's natal chart.
Outputs the morning digest in pure Aum language — no astrology terms.

Format:
  3 — Work Field     (direct impact on mission/creation/resources)
  6 — Awareness Field (notable actives to know)
  9 — Duration Field  (longest active first, with direct house impact)

Install: pip install kerykeion
Run:     python ignis/natal/transits.py
"""

import json
import os
from datetime import datetime


# ── Aum language mappings ─────────────────────────────────────────────────────

RING_NAMES = {
    'Sun':        'Ring Sun',
    'Moon':       'Ring Moon',
    'Mercury':    'Ring Mercury',
    'Venus':      'Ring Venus',
    'Mars':       'Ring Mars',
    'Jupiter':    'Ring Jupiter',
    'Saturn':     'Ring Saturn',
    'Uranus':     'Ring Uranus',
    'Neptune':    'Ring Neptune',
    'Pluto':      'Ring Pluto',
    'Chiron':     'Ring Chiron',
    'True Node':  'Soul Axis',
    'Mean Node':  'Soul Axis',
}

HOUSE_NAMES = {
    1:  'House Identity',
    2:  'House Values',
    3:  'House Voice',
    4:  'House Home',
    5:  'House Creation',
    6:  'House Service',
    7:  'House Partnership',
    8:  'House Transformation',
    9:  'House Philosophy',
    10: 'House Legacy',
    11: 'House Community',
    12: 'House Subconscious',
}

TORCH_NAMES = {
    1:  'Torch Root',
    2:  'Torch Sacral',
    3:  'Torch Solar',
    4:  'Torch Heart',
    5:  'Torch Throat',
    6:  'Torch ThirdEye',
    7:  'Torch Heart',
    8:  'Torch Sacral',
    9:  'Torch Solar',
    10: 'Torch Root',
    11: 'Torch Throat',
    12: 'Torch Crown',
}

# Energy descriptors — no aspect names, no astrology terms
ASPECT_ENERGY = {
    0:   {'verb': 'merging with',     'tone': 'amplification',   'orb': 8},
    60:  {'verb': 'opening into',     'tone': 'activation',      'orb': 4},
    90:  {'verb': 'pressing against', 'tone': 'friction',        'orb': 6},
    120: {'verb': 'flowing into',     'tone': 'support',         'orb': 6},
    150: {'verb': 'adjusting toward', 'tone': 'recalibration',   'orb': 3},
    180: {'verb': 'pulling from',     'tone': 'tension',         'orb': 8},
}

# Significance weight — used for priority sorting
PLANET_WEIGHT = {
    'Pluto': 10, 'Neptune': 9, 'Uranus': 8, 'Saturn': 8,
    'Chiron': 7, 'Jupiter': 6, 'True Node': 5, 'Mean Node': 5,
    'Mars': 4, 'Sun': 4, 'Venus': 3, 'Mercury': 3, 'Moon': 2,
}

# Houses that directly touch mission, work, resources, output
WORK_HOUSES = {2, 5, 6, 8, 10}

# Approximate duration a planet spends in one house/sign
TRANSIT_DURATION = {
    'Moon':       ('2–3 days',      1),
    'Mercury':    ('2–3 weeks',     2),
    'Venus':      ('3–5 weeks',     3),
    'Sun':        ('4 weeks',       4),
    'Mars':       ('6–7 weeks',     5),
    'True Node':  ('18 months',     6),
    'Mean Node':  ('18 months',     6),
    'Chiron':     ('~2 years',      7),
    'Jupiter':    ('12–13 months',  8),
    'Saturn':     ('2.5 years',     9),
    'Uranus':     ('7 years',       10),
    'Neptune':    ('14 years',      11),
    'Pluto':      ('12–20 years',   12),
}

SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo',
         'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']

# Kerykeion planet attribute names
PLANET_ATTRS = {
    'Sun': 'sun', 'Moon': 'moon', 'Mercury': 'mercury', 'Venus': 'venus',
    'Mars': 'mars', 'Jupiter': 'jupiter', 'Saturn': 'saturn',
    'Uranus': 'uranus', 'Neptune': 'neptune', 'Pluto': 'pluto',
    'Chiron': 'chiron', 'True Node': 'mean_node',
}


# ── Geometry ──────────────────────────────────────────────────────────────────

def to_abs(sign, degree):
    """Sign + degree → 0–360 ecliptic position."""
    return SIGNS.index(sign) * 30 + degree


def find_aspect(deg1, deg2):
    """Return (angle, orb) for the tightest major aspect, or None."""
    diff = abs(deg1 - deg2) % 360
    if diff > 180:
        diff = 360 - diff
    best = None
    for angle, info in ASPECT_ENERGY.items():
        orb = abs(diff - angle)
        if orb <= info['orb']:
            if best is None or orb < best[1]:
                best = (angle, round(orb, 1))
    return best


def transit_house(transit_abs, house_cusps_abs):
    """
    Return house number (1-12) for a transit degree.
    house_cusps_abs: {house_int: abs_degree}
    """
    # Sort cusps by degree
    ordered = sorted(house_cusps_abs.items(), key=lambda x: x[1])
    result = ordered[-1][0]  # default to last house (wraps at 0°)
    for house_num, cusp_deg in ordered:
        if transit_abs >= cusp_deg:
            result = house_num
    return result


# ── Core calculation ──────────────────────────────────────────────────────────

def get_current_positions():
    """Return {planet_name: abs_degree} for today via kerykeion."""
    try:
        from kerykeion import AstrologicalSubject
    except ImportError:
        raise RuntimeError("kerykeion not installed. Run: pip install kerykeion")

    now = datetime.utcnow()
    # Location doesn't affect geocentric planet degrees — London UTC used
    sky = AstrologicalSubject(
        "Transit", now.year, now.month, now.day,
        now.hour, now.minute, "London", 51.5, 0.0, "UTC",
    )

    positions = {}
    for planet, attr in PLANET_ATTRS.items():
        try:
            obj = getattr(sky, attr, None)
            if obj is None:
                continue
            # kerykeion >= 4.x uses abs_pos; fallback to manual calc
            if hasattr(obj, 'abs_pos'):
                positions[planet] = float(obj.abs_pos)
            elif hasattr(obj, 'position') and hasattr(obj, 'sign'):
                positions[planet] = to_abs(obj.sign, float(obj.position))
        except Exception:
            pass
    return positions


def build_natal_abs(natal):
    """Convert natal planet degrees to absolute 0–360."""
    result = {}
    for name, data in natal['planets'].items():
        if name in ('North Node', 'Lilith'):
            continue
        result[name] = to_abs(data['sign'], data['degree'])
    return result


def build_cusp_abs(natal):
    """Convert natal house cusps to absolute degrees."""
    return {
        int(h): to_abs(data['sign'], data['degree'])
        for h, data in natal['houses'].items()
    }


# ── Format ────────────────────────────────────────────────────────────────────

def format_event(t_planet, t_house, aspect_angle, n_planet, n_house, orb):
    """One transit line in Aum language."""
    ring_t   = RING_NAMES.get(t_planet, t_planet)
    ring_n   = RING_NAMES.get(n_planet, n_planet)
    house_t  = HOUSE_NAMES.get(t_house, f'House {t_house}')
    house_n  = HOUSE_NAMES.get(n_house, f'House {n_house}')
    torch_n  = TORCH_NAMES.get(n_house, '')
    info     = ASPECT_ENERGY[aspect_angle]
    dur, _   = TRANSIT_DURATION.get(t_planet, ('variable', 99))
    orb_str  = 'exact' if orb <= 0.5 else f'{orb}° orb'

    same_house = (t_house == n_house)
    location = f"moving through {house_t}" if same_house else f"in {house_t}"

    return (
        f"{ring_t} {location} — {info['verb']} {ring_n} "
        f"[{house_n} · {torch_n}] · {info['tone']} · {orb_str} · {dur}"
    )


def score_event(t_planet, n_house, aspect_angle, orb):
    """Priority score for sorting."""
    aspect_weight = {0: 2.0, 180: 1.8, 90: 1.5, 120: 1.0, 60: 1.2, 150: 0.8}
    tightness = max(0.1, 1.0 - orb / 10)
    return (
        PLANET_WEIGHT.get(t_planet, 3)
        * aspect_weight.get(aspect_angle, 1.0)
        * tightness
        * (1.4 if n_house in WORK_HOUSES else 1.0)
    )


# ── Main ──────────────────────────────────────────────────────────────────────

def build_digest(natal_path=None):
    if natal_path is None:
        natal_path = os.path.join(os.path.dirname(__file__), 'vision_natal.json')

    with open(natal_path) as f:
        natal = json.load(f)

    transit_pos = get_current_positions()
    natal_abs   = build_natal_abs(natal)
    cusp_abs    = build_cusp_abs(natal)

    events = []
    for t_planet, t_deg in transit_pos.items():
        t_house = transit_house(t_deg, cusp_abs)
        for n_planet, n_deg in natal_abs.items():
            result = find_aspect(t_deg, n_deg)
            if result:
                angle, orb = result
                n_house = natal['planets'][n_planet]['house']
                text    = format_event(t_planet, t_house, angle, n_planet, n_house, orb)
                score   = score_event(t_planet, n_house, angle, orb)
                dur_rank = TRANSIT_DURATION.get(t_planet, ('', 99))[1]
                events.append({
                    'text':     text,
                    'score':    score,
                    'is_work':  n_house in WORK_HOUSES,
                    'dur_rank': dur_rank,
                    't_planet': t_planet,
                    'n_house':  n_house,
                })

    if not events:
        return None

    events.sort(key=lambda e: e['score'], reverse=True)

    # 3 — Work Field (highest-score work-house transits)
    work  = [e for e in events if e['is_work']][:3]
    used  = set(id(e) for e in work)
    # fill if fewer than 3 work transits active
    for e in events:
        if len(work) >= 3:
            break
        if id(e) not in used:
            work.append(e)
            used.add(id(e))

    # 6 — Awareness Field (next highest, not already in work)
    aware = []
    for e in events:
        if len(aware) >= 6:
            break
        if id(e) not in used:
            aware.append(e)
            used.add(id(e))

    # 9 — Duration Field (remaining, sorted longest → shortest)
    remaining = [e for e in events if id(e) not in used]
    remaining.sort(key=lambda e: e['dur_rank'], reverse=True)
    duration = remaining[:9]

    return {
        'date':          datetime.utcnow().strftime('%Y-%m-%d'),
        'work_field':    [e['text'] for e in work],
        'aware_field':   [e['text'] for e in aware],
        'duration_field':[e['text'] for e in duration],
    }


def print_digest(data):
    if data is None:
        print("No major transits active.")
        return

    print(f"\n── TRANSIT DIGEST  {data['date']} ──────────────────────────────\n")

    print("▸ WORK FIELD  [3 — direct impact on mission]\n")
    for i, t in enumerate(data['work_field'], 1):
        print(f"  {i}.  {t}")

    print("\n▸ AWARENESS FIELD  [6 — active, know these]\n")
    for i, t in enumerate(data['aware_field'], 1):
        print(f"  {i}.  {t}")

    print("\n▸ DURATION FIELD  [9 — longest active first, where it lands]\n")
    for i, t in enumerate(data['duration_field'], 1):
        print(f"  {i}.  {t}")

    print("\n────────────────────────────────────────────────────────────────\n")


if __name__ == '__main__':
    try:
        data = build_digest()
        print_digest(data)
    except RuntimeError as e:
        print(f"\n[transits.py] {e}\n")
    except Exception as e:
        print(f"\n[transits.py] Error: {e}\n")
        raise
