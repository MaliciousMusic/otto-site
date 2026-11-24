"""Otto Cells: a variable colour font drawn entirely in code. python3 tools/font/build.py

Every letter is strokes of one thickness with round ends. Round letters are cells and carry a face.
Axes: wght 400-700 · FACE 0-1 (0 = no face, the default) · BLKA BLKB BLKC 0-1 (blink, one per cast)
      GAZX GAZY -1..1 (where they look) · MOOD 0-1 (smile <-> oh)
Advances never change along any axis, so animating never moves the text.
"""
import math, sys
from pathlib import Path
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.designspaceLib import DesignSpaceDocument, SourceDescriptor
from fontTools.varLib import build as varbuild
from fontTools.colorLib.builder import buildCOLR, buildCPAL
from fontTools.feaLib.builder import addOpenTypeFeaturesFromString

OUT = Path(__file__).resolve().parents[2] / 'src/assets/fonts'
XH, CAP, ASC, DSC = 560, 740, 780, -215
OV = 10                       # round letters overshoot
R = XH / 2 + OV               # outer radius of a lowercase cell
SBR, SBS = 34, 58             # side bearing, round and straight
cos = lambda a: math.cos(math.radians(a))
sin = lambda a: math.sin(math.radians(a))

# ---------- strokes -------------------------------------------------------
def line(x0, y0, x1, y1):
    d = math.hypot(x1 - x0, y1 - y0)
    u = ((x1 - x0) / d, (y1 - y0) / d)
    return [((x0, y0), u), ((x1, y1), u)]

def arc(cx, cy, rx, ry, a0, a1, n=None):
    n = n or max(2, math.ceil(abs(a1 - a0) / 24))
    s = 1 if a1 > a0 else -1
    out = []
    for i in range(n + 1):
        a = a0 + (a1 - a0) * i / n
        tx, ty = -rx * sin(a) * s, ry * cos(a) * s
        d = math.hypot(tx, ty)
        out.append(((cx + rx * cos(a), cy + ry * sin(a)), (tx / d, ty / d)))
    return out

def path(*parts):
    out = []
    for p in parts:
        if out and math.dist(out[-1][0], p[0][0]) < 2:
            p = p[1:]
        out += p
    return out

def meet(p, u, q, v):
    det = u[0] * v[1] - u[1] * v[0]
    if abs(det) < .02:
        return ((p[0] + q[0]) / 2, (p[1] + q[1]) / 2)
    k = ((q[0] - p[0]) * v[1] - (q[1] - p[1]) * v[0]) / det
    return (p[0] + u[0] * k, p[1] + u[1] * k)

def side(knots, d):
    """Offset knots by d to the left, as [on, off, on, off, ... on]."""
    pts = [((p[0] - u[1] * d, p[1] + u[0] * d), u) for p, u in knots]
    out = [pts[0][0]]
    for (p, u), (q, v) in zip(pts, pts[1:]):
        out += [meet(p, u, q, v), q]
    return out

def cap(p, u, h):
    a0 = math.degrees(math.atan2(u[0], -u[1]))          # left normal, turning clockwise to the right normal
    return side(arc(p[0], p[1], h, h, a0, a0 - 180, 4), 0)

def stroke(knots, t):
    h = t / 2
    left, right = side(knots, h), side(knots, -h)[::-1]
    (p0, u0), (p1, u1) = knots[0], knots[-1]
    return [left + cap(p1, u1, h)[1:-1] + right + cap(p0, (-u0[0], -u0[1]), h)[1:-1]]

def ellipse(cx, cy, rx, ry, cw=True, n=12):
    k = arc(cx, cy, rx, ry, 90, 90 - 360, n) if cw else arc(cx, cy, rx, ry, 90, 450, n)
    return side(k, 0)[:-1]

def ring(cx, cy, rx, ry, t):                            # rx, ry: centre line
    return [ellipse(cx, cy, rx + t / 2, ry + t / 2), ellipse(cx, cy, rx - t / 2, ry - t / 2, False)]

def dot(cx, cy, r):
    return [ellipse(cx, cy, r, r, n=8)]

# ---------- letters: name -> (advance, contours, faces[(cx, cy, scale)]) ----
G, UNI = {}, {}
def glyph(name, ch, adv, *faces):
    def deco(f):
        G[name] = (adv, f, faces)
        for c in ch: UNI[ord(c)] = name
        return f
    return deco

BW = 2 * R                                              # bowl width
CY = XH / 2
CXL = SBR + R                                           # bowl centre, bowl on the left
CXR = SBS + R                                           # bowl centre, stem on the left
bowl = lambda cx, t: ring(cx, CY, R - t / 2, R - t / 2, t)
stem = lambda x, y0, y1, t: stroke(line(x, y0 + t / 2, x, y1 - t / 2), t)

@glyph('o', 'o', SBR * 2 + BW, (CXL, CY, 1))
def _(t): return bowl(CXL, t)
@glyph('a', 'a', SBR + BW + SBS, (CXL, CY, 1))
def _(t): return bowl(CXL, t) + stem(CXL + R - t / 2, 0, XH, t)
@glyph('d', 'd', SBR + BW + SBS, (CXL, CY, 1))
def _(t): return bowl(CXL, t) + stem(CXL + R - t / 2, 0, ASC, t)
@glyph('q', 'q', SBR + BW + SBS, (CXL, CY, 1))
def _(t): return bowl(CXL, t) + stem(CXL + R - t / 2, DSC, XH, t)
@glyph('b', 'b', SBS + BW + SBR, (CXR, CY, 1))
def _(t): return bowl(CXR, t) + stem(CXR - R + t / 2, 0, ASC, t)
@glyph('p', 'p', SBS + BW + SBR, (CXR, CY, 1))
def _(t): return bowl(CXR, t) + stem(CXR - R + t / 2, DSC, XH, t)
def tail(x, top, t, w=230):
    h = t / 2
    return stroke(path(line(x, top - h, x, 10), arc(x - w, 10, w, 10 - DSC - h + 8, 0, -128)), t)
@glyph('g', 'g', SBR + BW + SBS, (CXL, CY, 1))
def _(t): return bowl(CXL, t) + tail(CXL + R - t / 2, XH, t)
@glyph('c', 'c', SBR + BW - 40, (CXL, CY, 1))
def _(t): return stroke(arc(CXL, CY, R - t / 2, R - t / 2, 46, 314), t)
@glyph('e', 'e', SBR * 2 + BW - 8)
def _(t):
    r = R - t / 2
    return stroke(path(line(CXL - r + 2, CY - 18, CXL + r, CY - 18)), t * .94) + stroke(arc(CXL, CY, r, r, -4, 316), t)
def arch(x0, x1, t, y0=0):
    h, r = t / 2, (x1 - x0) / 2
    return stroke(path(line(x0, y0 + h, x0, XH + OV - h - r), arc((x0 + x1) / 2, XH + OV - h - r, r, r, 180, 0), line(x1, XH + OV - h - r, x1, h)), t)
def cup(x0, x1, t, top=XH):
    h, r = t / 2, (x1 - x0) / 2
    return stroke(path(line(x0, top - h, x0, r + h - OV), arc((x0 + x1) / 2, r + h - OV, r, r, 180, 360), line(x1, r + h - OV, x1, top - h)), t)
NW = 480
@glyph('n', 'n', SBS * 2 + NW - 6)
def _(t): return stem(SBS + t / 2, 0, XH, t) + arch(SBS + t / 2, SBS + NW - t / 2, t)
@glyph('h', 'h', SBS * 2 + NW - 6)
def _(t): return stem(SBS + t / 2, 0, ASC, t) + arch(SBS + t / 2, SBS + NW - t / 2, t)
@glyph('m', 'm', SBS * 2 + 740)
def _(t):
    a, m, b = SBS + t / 2, SBS + 370, SBS + 740 - t / 2
    return stem(a, 0, XH, t) + arch(a, m, t) + arch(m, b, t)
@glyph('u', 'u', SBS * 2 + NW - 6)
def _(t): return cup(SBS + t / 2, SBS + NW - t / 2, t) + stem(SBS + NW - t / 2, 0, XH, t)
@glyph('y', 'y', SBS * 2 + NW - 6)
def _(t): return cup(SBS + t / 2, SBS + NW - t / 2, t) + tail(SBS + NW - t / 2, XH, t, 190)
@glyph('w', 'w', SBS * 2 + 740)
def _(t):
    a, m, b = SBS + t / 2, SBS + 370, SBS + 740 - t / 2
    return cup(a, m, t) + cup(m, b, t)
@glyph('r', 'r', SBS + 338)
def _(t):
    x, h, r = SBS + t / 2, t / 2, 215 - t / 2
    return stem(x, 0, XH, t) + stroke(path(line(x, h, x, XH + OV - h - r), arc(x + r, XH + OV - h - r, r, r, 180, 52)), t)
@glyph('i', '', SBS * 2 + 102)
def _(t): return stem(SBS + 51, 0, XH, t) + dot(SBS + 51, 715, 34 + t * .3)
@glyph('dotlessi', 'ı', SBS * 2 + 102)
def _(t): return stem(SBS + 51, 0, XH, t)
UNI[ord('i')] = 'i'
@glyph('j', 'j', SBS * 2 + 112)
def _(t): return tail(SBS + 61, XH, t, 165) + dot(SBS + 61, 715, 34 + t * .3)
@glyph('l', 'l', SBS + 225)
def _(t):
    x, h, r = SBS + t / 2, t / 2, 150 - t / 2
    return stroke(path(line(x, ASC - h, x, r + h), arc(x + r, r + h, r, r, 180, 290)), t)
@glyph('t', 't', 390)
def _(t):
    x, h, r = 112 + t / 2, t / 2, 195 - t / 2
    return stroke(path(line(x, 730 - h, x, r + h - OV), arc(x + r, r + h - OV, r, r, 180, 296)), t) + stroke(line(26 + h, XH - h, 356 - h, XH - h), t)
@glyph('f', 'f', 370)
def _(t):
    x, h, r = 104 + t / 2, t / 2, 205 - t / 2
    return stroke(path(line(x, h, x, ASC + 4 - h - r), arc(x + r, ASC + 4 - h - r, r, r, 180, 58)), t) + stroke(line(26 + h, XH - h, 344 - h, XH - h), t)
@glyph('k', 'k', SBS + 452)
def _(t):
    x, h = SBS + t / 2, t / 2
    return stem(x, 0, ASC, t) + stroke(line(x + 20, 235, SBS + 415 - h, XH - h), t) + stroke(line(x + 130, 310, SBS + 432 - h, h), t)
def ess(cx, w, top, bot, t):
    h = t / 2; mid = (top + bot) / 2; rx = w / 2 - h
    r1, r2 = (top - mid) / 2 - h / 2 + 0, (mid - bot) / 2 - h / 2
    return stroke(path(arc(cx, mid + r1, rx * .95, r1, 32, 270), arc(cx, mid - r2, rx, r2, 90, -148)), t)
@glyph('s', 's', 492)
def _(t): return ess(246, 420, XH + OV, -OV, t)
@glyph('v', 'v', 540)
def _(t):
    h = t / 2
    return stroke(line(24 + h, XH - h, 270, h), t) + stroke(line(270, h, 516 - h, XH - h), t)
@glyph('x', 'x', 520)
def _(t):
    h = t / 2
    return stroke(line(26 + h, XH - h, 494 - h, h), t) + stroke(line(26 + h, h, 494 - h, XH - h), t)
@glyph('z', 'z', 500)
def _(t):
    h = t / 2
    return stroke(line(36 + h, XH - h, 462 - h, XH - h), t) + stroke(line(462 - h, XH - h, 36 + h, h), t) + stroke(line(36 + h, h, 464 - h, h), t)

# capitals
CR = CAP / 2 + OV; CC = CAP / 2; CS = 34 + CR
@glyph('O', 'O', 68 + 2 * CR, (CS, CC, 1.3))
def _(t): return ring(CS, CC, CR - t / 2, CR - t / 2, t)
@glyph('Q', 'Q', 68 + 2 * CR, (CS, CC, 1.3))
def _(t): return ring(CS, CC, CR - t / 2, CR - t / 2, t) + stroke(line(CS + 185, 135, CS + 320 - t / 2, -30 + t / 2), t)
@glyph('C', 'C', 2 * CR - 36, (CS, CC, 1.3))
def _(t): return stroke(arc(CS, CC, CR - t / 2, CR - t / 2, 48, 312), t)
@glyph('G', 'G', 2 * CR + 34, (CS - 62, CC + 62, .98))
def _(t):
    r = CR - t / 2
    return stroke(arc(CS, CC, r, r, 48, 360), t) + stroke(line(CS + 140, CC, CS + r, CC), t)
def dee(x0, x1, y0, y1, t, flat):
    h = t / 2; ry = (y1 - y0) / 2 - h; m = x0 + flat
    return stroke(path(line(x0 + h, y1 - h, m, y1 - h), arc(m, (y0 + y1) / 2, x1 - h - m, ry, 90, -90), line(m, y0 + h, x0 + h, y0 + h)), t)
@glyph('D', 'D', SBS + 660 + 34, (SBS + 330, CC, 1.2))
def _(t): return stem(SBS + t / 2, 0, CAP, t) + dee(SBS, SBS + 660, 0, CAP, t, 290)
@glyph('A', 'A', 2 * SBS + 600)
def _(t):
    h = t / 2; x0, x1 = SBS + h, SBS + 600 - h; r = (x1 - x0) / 2
    return stroke(path(line(x0, h, x0, CAP + OV - h - r), arc((x0 + x1) / 2, CAP + OV - h - r, r, r, 180, 0), line(x1, CAP + OV - h - r, x1, h)), t) + stroke(line(x0, 285, x1, 285), t * .94)
@glyph('B', 'B', SBS + 540 + 30)
def _(t): return stem(SBS + t / 2, 0, CAP, t) + dee(SBS, SBS + 500, 395 - t / 2, CAP, t, 320) + dee(SBS, SBS + 540, 0, 395 + t / 2, t, 330)
@glyph('E', 'E', SBS + 485)
def _(t):
    h = t / 2; x = SBS + h; f = lambda y, w: stroke(line(x, y, SBS + w - h, y), t)
    return stem(x, 0, CAP, t) + f(CAP - h, 455) + f(CC, 410) + f(h, 455)
@glyph('F', 'F', SBS + 465)
def _(t):
    h = t / 2; x = SBS + h; f = lambda y, w: stroke(line(x, y, SBS + w - h, y), t)
    return stem(x, 0, CAP, t) + f(CAP - h, 450) + f(CC - 10, 400)
@glyph('H', 'H', 2 * SBS + 590)
def _(t): return stem(SBS + t / 2, 0, CAP, t) + stem(SBS + 590 - t / 2, 0, CAP, t) + stroke(line(SBS + t / 2, CC, SBS + 590 - t / 2, CC), t)
@glyph('I', 'I', 2 * SBS + 102)
def _(t): return stem(SBS + 51, 0, CAP, t)
@glyph('J', 'J', 30 + 400 + SBS)
def _(t):
    h = t / 2; r = 200 - h; x = 430 - h
    return stroke(path(line(x, CAP - h, x, r + h - OV), arc(x - r, r + h - OV, r, r, 0, -165)), t)
@glyph('K', 'K', SBS + 570)
def _(t):
    h = t / 2; x = SBS + h
    return stem(x, 0, CAP, t) + stroke(line(x + 10, 300, SBS + 535 - h, CAP - h), t) + stroke(line(x + 165, 420, SBS + 550 - h, h), t)
@glyph('L', 'L', SBS + 445)
def _(t):
    h = t / 2; x = SBS + h; r = 150 - h
    return stroke(path(line(x, CAP - h, x, r + h), arc(x + r, r + h, r, r, 180, 270), line(x + r, h, SBS + 425 - h, h)), t)
@glyph('M', 'M', 2 * SBS + 720)
def _(t):
    h = t / 2; a, b, m = SBS + h, SBS + 720 - h, SBS + 360
    return stem(a, 0, CAP, t) + stem(b, 0, CAP, t) + stroke(line(a, CAP - h, m, 230), t) + stroke(line(m, 230, b, CAP - h), t)
@glyph('N', 'N', 2 * SBS + 610)
def _(t):
    h = t / 2; a, b = SBS + h, SBS + 610 - h
    return stem(a, 0, CAP, t) + stem(b, 0, CAP, t) + stroke(line(a, CAP - h, b, h), t)
@glyph('P', 'P', SBS + 530 + 26)
def _(t): return stem(SBS + t / 2, 0, CAP, t) + dee(SBS, SBS + 530, 290, CAP, t, 305)
@glyph('R', 'R', SBS + 560 + 20)
def _(t): return stem(SBS + t / 2, 0, CAP, t) + dee(SBS, SBS + 530, 290, CAP, t, 305) + stroke(line(SBS + 320, 290 + t / 2, SBS + 552 - t / 2, t / 2), t)
@glyph('S', 'S', 585)
def _(t): return ess(292, 505, CAP + OV, -OV, t)
@glyph('T', 'T', 580)
def _(t): return stem(290, 0, CAP, t) + stroke(line(26 + t / 2, CAP - t / 2, 554 - t / 2, CAP - t / 2), t)
@glyph('U', 'U', 2 * SBS + 600)
def _(t): return cup(SBS + t / 2, SBS + 600 - t / 2, t, CAP)
@glyph('V', 'V', 650)
def _(t): return stroke(line(22 + t / 2, CAP - t / 2, 325, t / 2), t) + stroke(line(325, t / 2, 628 - t / 2, CAP - t / 2), t)
@glyph('W', 'W', 2 * SBS + 800)
def _(t): return cup(SBS + t / 2, SBS + 400, t, CAP) + cup(SBS + 400, SBS + 800 - t / 2, t, CAP)
@glyph('X', 'X', 630)
def _(t): return stroke(line(26 + t / 2, CAP - t / 2, 604 - t / 2, t / 2), t) + stroke(line(26 + t / 2, t / 2, 604 - t / 2, CAP - t / 2), t)
@glyph('Y', 'Y', 620)
def _(t): return stroke(line(22 + t / 2, CAP - t / 2, 310, 330), t) + stroke(line(310, 330, 598 - t / 2, CAP - t / 2), t) + stem(310, 0, 330 + t / 2, t)
@glyph('Z', 'Z', 590)
def _(t):
    h = t / 2
    return stroke(line(40 + h, CAP - h, 550 - h, CAP - h), t) + stroke(line(550 - h, CAP - h, 40 + h, h), t) + stroke(line(40 + h, h, 552 - h, h), t)

# figures
FW = 610
@glyph('zero', '0', FW, (305, CC, 1.05))
def _(t): return ring(305, CC, 268 - t / 2, CR - t / 2, t)
@glyph('one', '1', 420)
def _(t): return stem(250, 0, CAP, t) + stroke(line(250, CAP - t / 2, 70 + t / 2, 590), t)
@glyph('two', '2', 570)
def _(t):
    h = t / 2; r = 235 - h; cx, cy = 280, CAP + OV - h - r
    a = -38
    return stroke(path(arc(cx, cy, r, r, 168, a)), t) + stroke(line(cx + r * cos(a), cy + r * sin(a), 62 + h, h), t) + stroke(line(62 + h, h, 520 - h, h), t)
@glyph('three', '3', 570)
def _(t):
    h = t / 2; r1 = (CAP + OV - 395) / 2 - h / 2 + 0; r2 = (395 + OV) / 2 - h / 2
    return stroke(arc(275, 395 + r1 - 0 , r1 * 1.18, r1, 155, -90), t) + stroke(arc(275, 395 - r2, r2 * 1.22, r2, 90, -155), t)
@glyph('four', '4', 620)
def _(t):
    h = t / 2
    return stem(425, 0, CAP, t) + stroke(line(425, CAP - h, 45 + h, 215), t) + stroke(line(45 + h, 215, 580 - h, 215), t)
@glyph('five', '5', 575)
def _(t):
    h = t / 2; r = 245 - h
    return stroke(line(125, CAP - h, 495 - h, CAP - h), t) + stroke(line(125, CAP - h, 102, 420), t) + stroke(arc(275, 245 - OV, r, r, 135, -148), t)
@glyph('six', '6', 590, (295, 250 - OV, .82))
def _(t):
    h = t / 2; r = 250 - h; x = 295 - r
    return ring(295, 250 - OV, r, r, t) + stroke(arc(x + 390, 250 - OV, 390, CAP - 250 + OV - h, 180, 112), t)
@glyph('seven', '7', 540)
def _(t):
    h = t / 2
    return stroke(line(45 + h, CAP - h, 500 - h, CAP - h), t) + stroke(line(500 - h, CAP - h, 190, h), t)
@glyph('eight', '8', 590, (295, 215, .7), (295, 560, .5))
def _(t):
    h = t / 2
    return ring(295, 215, 245 - h, 225 - h, t) + ring(295, 568, 195 - h, 182 - h, t)
@glyph('nine', '9', 590, (295, CAP - 250 + OV, .82))
def _(t):
    h = t / 2; r = 250 - h; x = 295 + r
    return ring(295, CAP - 250 + OV, r, r, t) + stroke(arc(x - 390, CAP - 250 + OV, 390, CAP - 250 + OV - h, 0, -68), t)

# the logo as a pair: two cells joined by a bridge
B2 = CXL + 2 * R + 14
@glyph('o_o', '', SBR * 2 + 4 * R + 14, (CXL, CY, 1, 'A'), (B2, CY, 1, 'B'))
def _(t):
    # one outline around both cells; the waist is a pair of fillets, as in the logo
    d, mx = (B2 - CXL) / 2, (CXL + B2) / 2
    def outline(r, w, cw):
        k = (d * d + w * w - r * r) / (2 * (r - w))      # fillet radius: tangent to the cell, w from the axis
        ang = math.degrees(math.atan2(w + k, d))
        pts = []
        for seg in (arc(CXL, CY, r, r, ang, 360 - ang, 14), arc(mx, CY - w - k, k, k, 180 - ang, ang, 6),
                    arc(B2, CY, r, r, 180 + ang, 540 - ang, 14), arc(mx, CY + w + k, k, k, 360 - ang, 180 + ang, 6)):
            e = side(seg, 0)
            pts += e if not pts else e[1:]
        pts = pts[:-1]
        return [pts[0]] + pts[1:][::-1] if cw else pts
    out, inn = outline(R, 107, True), outline(R - t, 107 - t * .56, False)
    return [out, inn]

# punctuation and signs
def simple(name, ch, adv, f): glyph(name, ch, adv)(f)
D = lambda t: 26 + t * .36
simple('space', ' \u00a0', 250, lambda t: [])
simple('period', '.', 190, lambda t: dot(95, D(t), D(t)))
simple('comma', ',', 190, lambda t: stroke(line(105, 50, 68, -80), t))
simple('colon', ':', 200, lambda t: dot(100, D(t), D(t)) + dot(100, 440, D(t)))
simple('semicolon', ';', 200, lambda t: stroke(line(110, 50, 73, -80), t) + dot(106, 440, D(t)))
simple('exclam', '!', 220, lambda t: dot(110, D(t), D(t)) + stroke(line(110, 240, 110, CAP - t / 2), t))
def q(t):
    h = t / 2; r = 205 - h
    return dot(255, D(t), D(t)) + stroke(path(arc(255, CAP + OV - h - r, r, r, 165, -90)), t) + stroke(line(255, CAP + OV - h - 2 * r, 255, 238), t)
simple('question', '?', 510, q)
simple('quotesingle', "'", 170, lambda t: stroke(line(85, CAP - t / 2, 85, 570), t * .9))
simple('quotedbl', '"', 310, lambda t: stroke(line(85, CAP - t / 2, 85, 570), t * .9) + stroke(line(225, CAP - t / 2, 225, 570), t * .9))
qr = lambda x, t: stroke(line(x + 20, CAP - t / 2, x - 18, 575), t * .95)
ql = lambda x, t: stroke(line(x + 20, 575, x - 18, CAP - t / 2), t * .95)
ql = lambda x, t: stroke(line(x - 20, 575, x + 18, CAP - t / 2), t * .95)
simple('quoteright', '\u2019', 190, lambda t: qr(95, t))
simple('quoteleft', '\u2018', 190, lambda t: ql(95, t))
simple('quotedblright', '\u201d', 330, lambda t: qr(95, t) + qr(235, t))
simple('quotedblleft', '\u201c', 330, lambda t: ql(95, t) + ql(235, t))
bar = lambda y, x0, x1, t: stroke(line(x0 + t / 2, y, x1 - t / 2, y), t)
simple('hyphen', '-\u2010\u2011', 340, lambda t: bar(CY, 30, 310, t))
simple('endash', '\u2013', 520, lambda t: bar(CY, 30, 490, t))
simple('emdash', '\u2014', 800, lambda t: bar(CY, 30, 770, t))
simple('underscore', '_', 520, lambda t: bar(-90, 0, 520, t))
simple('plus', '+', 520, lambda t: bar(340, 30, 490, t) + stroke(line(260, 110 + t / 2, 260, 570 - t / 2), t))
simple('minus', '\u2212', 520, lambda t: bar(340, 30, 490, t))
simple('equal', '=', 520, lambda t: bar(440, 40, 480, t) + bar(225, 40, 480, t))
simple('multiply', '\u00d7', 500, lambda t: stroke(line(80, 170, 420, 510), t) + stroke(line(80, 510, 420, 170), t))
simple('divide', '\u00f7', 520, lambda t: bar(340, 30, 490, t) + dot(260, 560, D(t) * .9) + dot(260, 120, D(t) * .9))
simple('less', '<', 500, lambda t: stroke(line(430, 560, 80, 340), t) + stroke(line(80, 340, 430, 120), t))
simple('greater', '>', 500, lambda t: stroke(line(70, 560, 420, 340), t) + stroke(line(420, 340, 70, 120), t))
simple('asterisk', '*', 440, lambda t: sum((stroke(line(220 - 130 * cos(a), 570 - 130 * sin(a), 220 + 130 * cos(a), 570 + 130 * sin(a)), t * .8) for a in (90, 30, 150)), []))
simple('slash', '/', 440, lambda t: stroke(line(40 + t / 2, -40, 400 - t / 2, CAP + 20), t))
simple('backslash', '\\', 440, lambda t: stroke(line(40 + t / 2, CAP + 20, 400 - t / 2, -40), t))
simple('bar', '|', 220, lambda t: stroke(line(110, -120, 110, CAP + 60), t))
simple('parenleft', '(', 320, lambda t: stroke(arc(480, 330, 400 - t / 2, 560, 138, 222), t))
simple('parenright', ')', 320, lambda t: stroke(arc(-160, 330, 400 - t / 2, 560, 42, -42), t))
def brk(m):
    def f(t):
        h = t / 2; X = (lambda x: 330 - x) if m else (lambda x: x)
        return stroke(line(X(80 + h), -60, X(80 + h), CAP + 20), t) + stroke(line(X(80 + h), CAP + 20, X(285 - h), CAP + 20), t) + stroke(line(X(80 + h), -60, X(285 - h), -60), t)
    return f
simple('bracketleft', '[', 330, brk(0)); simple('bracketright', ']', 330, brk(1))
def brace(m):
    def f(t):
        h = t / 2; X = (lambda x: 360 - x) if m else (lambda x: x)
        s = lambda y0, y1, y2: stroke(line(X(290 - h), y0, X(190), y1), t) + stroke(line(X(190), y1, X(190), y2), t)
        return s(CAP + 20, 690, 420) + s(-60, -10, 260) + stroke(line(X(190), 420, X(80), 340), t) + stroke(line(X(190), 260, X(80), 340), t)
    return f
simple('braceleft', '{', 360, brace(0)); simple('braceright', '}', 360, brace(1))
simple('numbersign', '#', 620, lambda t: bar(500, 40, 590, t * .85) + bar(240, 30, 580, t * .85) + stroke(line(190, 40, 260, 700), t * .85) + stroke(line(370, 40, 440, 700), t * .85))
simple('percent', '%', 760, lambda t: ring(190, 560, 155 - t * .4, 155 - t * .4, t * .8) + ring(570, 180, 155 - t * .4, 155 - t * .4, t * .8) + stroke(line(560, CAP - 40, 200, 40), t * .85))
def amp(t):
    h = t / 2
    return ring(260, 555, 175 - h, 175 - h, t) + stroke(arc(265, 215, 225 - h, 225 - h, 110, 405), t) + stroke(line(180, 440, 560 - h, h), t)
simple('ampersand', '&', 600, amp)
simple('at', '@', 900, lambda t: ring(430, 300, 165 - t * .4, 165 - t * .4, t * .8) + stroke(path(line(595 - t * .4, 440, 595 - t * .4, 260), arc(675 - t * .4, 260, 80, 80, 180, 350)), t * .8) + stroke(arc(450, 300, 400 - t * .4, 400 - t * .4, -8, 312), t * .8))
simple('dollar', '$', 585, lambda t: ess(292, 505, CAP + OV, -OV, t) + stroke(line(292, CAP, 292, CAP + 70), t * .9) + stroke(line(292, 0, 292, -70), t * .9))
simple('Euro', '\u20ac', 660, lambda t: stroke(arc(400, CC, 300 - t / 2, CR - t / 2, 50, 310), t) + bar(440, 30, 470, t * .85) + bar(290, 30, 440, t * .85))
simple('sterling', '\u00a3', 560, lambda t: stroke(path(arc(335, 560, 165 - t / 2 + 20, 190 - t / 2, 30, 180), line(150 + t / 2, 560, 150 + t / 2, t / 2)), t) + bar(350, 40, 400, t * .85) + bar(t / 2, 50, 520, t))
simple('guillemotleft', '\u00ab', 500, lambda t: sum((stroke(line(x + 130, 440, x, 280), t * .9) + stroke(line(x, 280, x + 130, 120), t * .9) for x in (85, 275)), []))
simple('guillemotright', '\u00bb', 500, lambda t: sum((stroke(line(x - 130, 440, x, 280), t * .9) + stroke(line(x, 280, x - 130, 120), t * .9) for x in (225, 415)), []))
simple('degree', '\u00b0', 330, lambda t: ring(165, 600, 120 - t * .35, 120 - t * .35, t * .7))
simple('periodcentered', '\u00b7', 220, lambda t: dot(110, CY, D(t)))
simple('bullet', '\u2022', 340, lambda t: dot(170, CY, 110))
simple('ellipsis', '\u2026', 560, lambda t: dot(100, D(t), D(t)) + dot(280, D(t), D(t)) + dot(460, D(t), D(t)))
simple('asciitilde', '~', 540, lambda t: stroke(path(arc(165, 310, 110, 80, 180, 0), arc(385, 310, 110, 80, 180, 360)), t))
simple('asciicircum', '^', 460, lambda t: stroke(line(80, 480, 230, 680), t) + stroke(line(230, 680, 380, 480), t))
simple('copyright', '\u00a9', 808, lambda t: ring(404, CC, CR - t * .4, CR - t * .4, t * .8) + stroke(arc(404, CC, 180, 180, 48, 312), t * .8))
def arrow(a):
    def f(t):
        P = lambda x, y: (380 + x * cos(a) - y * sin(a), 320 + x * sin(a) + y * cos(a))
        seg = lambda p, q: stroke(line(*P(*p), *P(*q)), t)
        return seg((-270, 0), (270, 0)) + seg((90, 180), (270, 0)) + seg((90, -180), (270, 0))
    return f
simple('arrowright', '\u2192', 760, arrow(0)); simple('arrowleft', '\u2190', 760, arrow(180))
simple('arrowup', '\u2191', 760, arrow(90)); simple('arrowdown', '\u2193', 760, arrow(270))
simple('germandbls', '\u00df', SBS + 540, lambda t: stroke(path(line(SBS + t / 2, t / 2, SBS + t / 2, 560), arc(SBS + 215, 560, 215 - t / 2, ASC - 560 - t / 2, 180, -60)), t) + stroke(arc(SBS + 260, 220, 240 - t / 2, 230 - t / 2, 92, -120), t))
OE = CXL + 2 * R - 60
simple('oe', '\u0153', SBR * 2 + 4 * R - 70, lambda t: bowl(CXL, t) + stroke(arc(OE, CY, R - t / 2, R - t / 2, -4, 316), t) + stroke(line(OE - R + t / 2, CY - 18, OE + R - t / 2, CY - 18), t * .94))
simple('ae', '\u00e6', SBR * 2 + 4 * R - 70, lambda t: bowl(CXL, t) + stem(CXL + R - t / 2, 0, XH, t) + stroke(arc(OE, CY, R - t / 2, R - t / 2, -4, 316), t) + stroke(line(OE - R + t / 2, CY - 18, OE + R - t / 2, CY - 18), t * .94))
def OEcap(t):
    h = t / 2; x = CS + CR - 40; f = lambda y, w: stroke(line(x, y, x + w - h, y), t)
    return ring(CS, CC, CR - h, CR - h, t) + stem(x, 0, CAP, t) + f(CAP - h, 400) + f(CC, 350) + f(h, 400)
simple('OE', '\u0152', CS + CR + 390, OEcap)
def AEcap(t):
    h = t / 2; x = SBS + 600 - h; f = lambda y, w: stroke(line(x, y, x + w - h, y), t)
    return G['A'][1](t) + stem(x, 0, CAP, t) + f(CAP - h, 400) + f(CC, 350) + f(h, 400)
simple('AE', '\u00c6', SBS + 600 + 390, AEcap)

# accents, drawn around x = 0 at the height of a lowercase letter
ACC = {
    'acute': lambda t: stroke(line(-32, 655, 42, 760), t * .82),
    'grave': lambda t: stroke(line(-42, 760, 32, 655), t * .82),
    'circ': lambda t: stroke(line(-105, 660, 0, 755), t * .8) + stroke(line(0, 755, 105, 660), t * .8),
    'diaer': lambda t: dot(-92, 712, 30 + t * .25) + dot(92, 712, 30 + t * .25),
    'tilde': lambda t: stroke(path(arc(-60, 695, 62, 46, 180, 0), arc(64, 695, 62, 46, 180, 360)), t * .75),
    'ringacc': lambda t: ring(0, 730, 78, 78, t * .6),
    'cedil': lambda t: stroke(path(line(0, 0, 0, -70)), t * .7) + stroke(arc(-20, -120, 70, 55, 85, -120), t * .7),
}
for a, f in ACC.items(): G[a] = (0, f, ())
COMP = {}
def accent(ch, base, acc, dx=None):
    name = f'{base}{acc}'
    adv, _, faces = G[base]
    cx = dx if dx is not None else (faces[0][0] if faces and base not in 'D' else adv / 2)
    up = 178 if base.isupper() else 0
    if acc == 'cedil': up = 0
    COMP[name] = (base, acc, round(cx), up)
    G[name] = (adv, None, faces)
    UNI[ord(ch)] = name
for base, s in {'a': 'áàâäãå', 'e': 'éèêë', 'dotlessi': 'íìîï', 'o': 'óòôöõ', 'u': 'úùûü', 'A': 'ÁÀÂÄÃÅ', 'E': 'ÉÈÊË', 'I': 'ÍÌÎÏ', 'O': 'ÓÒÔÖÕ', 'U': 'ÚÙÛÜ'}.items():
    for ch, acc in zip(s, ('acute', 'grave', 'circ', 'diaer', 'tilde', 'ringacc')): accent(ch, base, acc)
accent('ñ', 'n', 'tilde'); accent('Ñ', 'N', 'tilde'); accent('ÿ', 'y', 'diaer'); accent('ý', 'y', 'acute'); accent('Ý', 'Y', 'acute'); accent('Ÿ', 'Y', 'diaer')
accent('ç', 'c', 'cedil', CXL); accent('Ç', 'C', 'cedil', CS)

# ---------- faces --------------------------------------------------------
def face(cast, L):
    gx, gy, m, f = L['GAZX'] * 22, L['GAZY'] * 20, L['MOOD'], L['FACE']
    b = L['BLK' + cast]
    out = []
    for i, ex in enumerate((-70, 70)):
        shut = 1 if cast == 'C' and i else b             # cast C winks
        rx, ry = 35 + 7 * shut, 37 - 25 * shut
        out.append(ellipse(ex + gx, 36 + gy, rx, ry, n=8))
    smile = [arc(0, -40, 62, 46, 198, 342, 10), 30]
    oh = [arc(0, -66, 31, 31, 92, 448, 10), 25]
    a, z = (oh, smile) if cast == 'B' else (smile, oh)
    k = [((p[0] + (q[0] - p[0]) * m, p[1] + (q[1] - p[1]) * m), (u[0] + (v[0] - u[0]) * m, u[1] + (v[1] - u[1]) * m)) for (p, u), (q, v) in zip(a[0], z[0])]
    mo = stroke(k, a[1] + (z[1] - a[1]) * m)
    out += [[(x + gx * .45, y + gy * .45) for x, y in c] for c in mo]
    return [[(x * f, y * f) for x, y in c] for c in out]

# ---------- masters --------------------------------------------------------
DEF = dict(wght=700, FACE=0, BLKA=0, BLKB=0, BLKC=0, GAZX=0, GAZY=0, MOOD=0)
AXES = [('wght', 400, 700, 700, 'Weight'), ('FACE', 0, 0, 1, 'Face'), ('BLKA', 0, 0, 1, 'Blink A'), ('BLKB', 0, 0, 1, 'Blink B'), ('BLKC', 0, 0, 1, 'Blink C'),
        ('GAZX', -1, 0, 1, 'Gaze X'), ('GAZY', -1, 0, 1, 'Gaze Y'), ('MOOD', 0, 0, 1, 'Mood')]
# Expressions only exist where FACE is open, so plain text can never be disturbed.
LOCS = [DEF, dict(DEF, wght=400), dict(DEF, FACE=1)] + [dict(DEF, FACE=1, **{k: v}) for k, v in (
    ('BLKA', 1), ('BLKB', 1), ('BLKC', 1), ('GAZX', -1), ('GAZX', 1), ('GAZY', -1), ('GAZY', 1), ('MOOD', 1))]
CASTS = 'ABC'
faced = [n for n, (_, _, f) in G.items() if f]
plain = [n for n in G if n not in faced]
order = ['.notdef'] + plain + [f'{n}.body' for n in faced] + [f'face.{c}' for c in CASTS]
for n in faced:
    for c in CASTS:
        v = n if c == 'A' else f'{n}.{c.lower()}'
        order += [v] + [f'{v}.face{i}' for i in range(len(G[n][2]))]

def draw(contours):
    pen = TTGlyphPen(None)
    for c in contours:
        pts = [(round(x), round(y)) for x, y in c]
        pen.moveTo(pts[0])
        for i in range(1, len(pts) - 1, 2): pen.qCurveTo(pts[i], pts[i + 1])
        if len(pts) % 2 == 0: pen.qCurveTo(pts[-1], pts[0])
        pen.closePath()
    g = pen.glyph()
    if g.numberOfContours > 0: g.flags[0] |= 0x40       # overlapping strokes
    return g

def comp(parts):
    pen = TTGlyphPen({k: None for k in order})
    for n, x, y, s in parts: pen.addComponent(n, (s, 0, 0, s, round(x), round(y)))
    return pen.glyph()

def master(L):
    t = 116 - (700 - L['wght']) / 300 * 46
    gl = {'.notdef': draw(ring(300, 350, 220, 330, 60))}
    def put(target, n):
        if n in COMP:
            base, acc, x, y = COMP[n]
            b = f'{base}.body' if base in faced else base
            gl[target] = comp([(b, 0, 0, 1), (acc, x, y, 1)])
        else: gl[target] = draw(G[n][1](t))
    for n in plain: put(n, n)
    for n in faced: put(f'{n}.body', n)
    for c in CASTS: gl[f'face.{c}'] = draw(face(c, L))
    for n in faced:
        for c in CASTS:
            v = n if c == 'A' else f'{n}.{c.lower()}'
            fs = [(f'face.{f[3] if len(f) > 3 else c}', f[0], f[1], f[2]) for f in G[n][2]]
            for i, f in enumerate(fs): gl[f'{v}.face{i}'] = comp([f])
            gl[v] = comp([(f'{n}.body', 0, 0, 1)] + fs)
    fb = FontBuilder(1000, isTTF=True)
    fb.setupGlyphOrder(order)
    fb.setupCharacterMap(UNI)
    fb.setupGlyf(gl)
    root = lambda g: g.replace('.body', '').split('.face')[0] if not g.startswith('face.') else g
    def adv(g):
        g = root(g)
        if g[-2:] in ('.b', '.c'): g = g[:-2]
        return round(G[g][0]) if g in G else 600
    gt = fb.font['glyf']
    fb.setupHorizontalMetrics({g: (adv(g), getattr(gt[g], 'xMin', 0) or 0) for g in order})
    fb.setupHorizontalHeader(ascent=1000, descent=-250)
    fb.setupNameTable({'familyName': 'Otto Cells', 'styleName': 'Bold', 'uniqueFontIdentifier': 'OttoCells-1.000', 'fullName': 'Otto Cells', 'psName': 'OttoCells-Bold', 'version': 'Version 1.000'})
    fb.setupOS2(version=4, sTypoAscender=1000, sTypoDescender=-250, sTypoLineGap=0, usWinAscent=1050, usWinDescent=280, sxHeight=XH, sCapHeight=CAP, usWeightClass=700, fsSelection=0x20 | 0x80, achVendID='OTTO')
    fb.setupPost()
    fb.font['head'].macStyle = 1
    return fb.font

ds = DesignSpaceDocument()
for tag, lo, de, hi, name in AXES:
    ds.addAxisDescriptor(tag=tag, name=name, minimum=lo, default=de, maximum=hi)
for i, L in enumerate(LOCS):
    s = SourceDescriptor(); s.font = master(L); s.name = f'm{i}'; s.familyName = 'Otto Cells'; s.styleName = f'm{i}'
    s.location = {name: L[tag] for tag, *_, name in AXES}
    ds.addSource(s)
vf, *_ = varbuild(ds, optimize=True)

# ---------- colour: letter in the text colour, face in palette 0 / 1 ---------
layers = {}
for n in faced:
    for c in CASTS:
        v = n if c == 'A' else f'{n}.{c.lower()}'
        layers[v] = [(f'{n}.body', 0xFFFF)] + [(f'{v}.face{i}', CASTS.index(f[3] if len(f) > 3 else c) % 2) for i, f in enumerate(G[n][2])]
vf['COLR'] = buildCOLR(layers, version=0, glyphMap=vf.getReverseGlyphMap())
vf['CPAL'] = buildCPAL([[(0x7B / 255, 0xC9 / 255, 0x43 / 255, 1), (0x5E / 255, 0xC3 / 255, 0xEE / 255, 1)]])

# ---------- features: pairs, casts in rotation, kerning --------------------
A_ = [n for n in faced]; B_ = [f'{n}.b' for n in faced]; C_ = [f'{n}.c' for n in faced]
N_ = [n for n in plain if n not in ACC]
j = ' '.join
gaps = range(0, 6)
fea = f"""
languagesystem DFLT dflt; languagesystem latn dflt;
@A=[{j(A_)}]; @B=[{j(B_)}]; @C=[{j(C_)}]; @N=[{j(N_)}];
lookup toB {{ sub @A by @B; }} toB;
lookup toC {{ sub @A by @C; }} toC;
feature liga {{ sub o o by o_o; }} liga;
feature calt {{ lookup rotate {{
{''.join(f"  sub @B {'@N ' * k}@A' lookup toC;{chr(10)}" for k in gaps)}{''.join(f"  sub @A {'@N ' * k}@A' lookup toB;{chr(10)}" for k in gaps)}}} rotate; }} calt;
@Lo=[a a.b a.c c c.b c.c d d.b d.c e g g.b g.c o o.b o.c q q.b q.c eacute egrave ecircumflex];
feature kern {{
  enum pos [T Y V] [a a.b a.c c c.b c.c d d.b d.c e g g.b g.c o o.b o.c q q.b q.c s] -70;
  enum pos [T Y V F P] [period comma] -90;
  enum pos [T F] [A] -30; enum pos [A] [T V Y] -30;
  enum pos [L] [T V Y quoteright] -90;
  enum pos [r f v y] [period comma] -60;
  enum pos [r] [a a.b a.c c c.b c.c d d.b d.c e g g.b g.c o o.b o.c q q.b q.c] -14;
  enum pos [o o.b o.c b b.b b.c p p.b p.c e] [v x w y] -14;
  enum pos [v] [a a.b a.c c c.b c.c d d.b d.c e g g.b g.c o o.b o.c q q.b q.c] -22;
  enum pos [quoteright] [s t] -20;
}} kern;
""".replace(' eacute egrave ecircumflex', '')
addOpenTypeFeaturesFromString(vf, fea)

OUT.mkdir(parents=True, exist_ok=True)
vf.flavor = 'woff2'
vf.save(OUT / 'otto-cells-vf.woff2')
print((OUT / 'otto-cells-vf.woff2').stat().st_size, 'bytes,', len(order), 'glyphs,', len(UNI), 'characters')
