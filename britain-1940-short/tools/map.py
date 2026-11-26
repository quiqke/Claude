"""Builds geo.json for the film: Natural Earth 1:50m admin-0 (public domain) from world-atlas 2.0.2 (ISC) on the npm CDN,
decoded from TopoJSON into simple lon/lat rings per country, clipped to 125°W–70°E, 12°N–84°N, lightly simplified.
No part of China is in this box. usage: python3 tools/map.py"""
import json, urllib.request, pathlib
SRC = "https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json"
OUT = pathlib.Path(__file__).resolve().parent.parent / "geo.json"
BOX = (-125.0, 12.0, 70.0, 84.0)
topo = json.load(urllib.request.urlopen(SRC))
sx, sy = topo['transform']['scale']; tx, ty = topo['transform']['translate']
arcs = []
for a in topo['arcs']:
    x = y = 0; pts = []
    for dx, dy in a: x += dx; y += dy; pts.append((x * sx + tx, y * sy + ty))
    arcs.append(pts)
def ring(ids):
    out = []
    for i in ids:
        p = arcs[i] if i >= 0 else arcs[~i][::-1]
        out.extend(p[1:] if out else p)
    return out
def clip(r):
    x0, y0, x1, y1 = BOX
    def cut(pts, inside, inter):
        o = []
        for i, p in enumerate(pts):
            q = pts[i - 1]
            if inside(p):
                if not inside(q): o.append(inter(q, p))
                o.append(p)
            elif inside(q): o.append(inter(q, p))
        return o
    ax = lambda X: (lambda a, b: (X, a[1] + (b[1] - a[1]) * (X - a[0]) / (b[0] - a[0])))
    ay = lambda Y: (lambda a, b: (a[0] + (b[0] - a[0]) * (Y - a[1]) / (b[1] - a[1]), Y))
    for ins, it in [(lambda p: p[0] >= x0, ax(x0)), (lambda p: p[0] <= x1, ax(x1)), (lambda p: p[1] >= y0, ay(y0)), (lambda p: p[1] <= y1, ay(y1))]:
        if not r: break
        r = cut(r, ins, it)
    return r
def simp(r, d=.12):
    o = [r[0]]
    for p in r[1:]:
        if abs(p[0] - o[-1][0]) + abs(p[1] - o[-1][1]) >= d: o.append(p)
    return o
geo = {}
for g in topo['objects']['countries']['geometries']:
    name = g.get('properties', {}).get('name'); polys = []
    if g['type'] == 'Polygon': polys = [g['arcs']]
    elif g['type'] == 'MultiPolygon': polys = g['arcs']
    rings = []
    for poly in polys:
        r = clip([(x + 360 if x < -100 and name == "Russia" else x, y) for x, y in ring(poly[0])])   # Chukotka sits past 180°: move it east so the clip drops it cleanly
        if len(r) > 3: r = simp(r); rings.append([[round(x, 3), round(y, 3)] for x, y in r]) if len(r) > 3 else None
    if rings and name not in ('China',): geo[name] = rings
json.dump(geo, open(OUT, 'w'), separators=(',', ':'))
print(len(geo), 'countries', sorted(geo)[:60])
