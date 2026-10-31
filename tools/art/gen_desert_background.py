import math
import random
from PIL import Image

def generate_desert_background(width=2560, height=720, out_path="public/assets/backgrounds/bg_desert.jpg"):
    im = Image.new("RGB", (width, height), (0, 0, 0))
    pix = im.load()
    rng = random.Random(1337)

    # 1. Sky Gradient & Celestial Body
    # Twilight cyber-desert palette
    c_sky_top = (23, 17, 49)      # #171131 Deep cosmic night
    c_sky_upper = (66, 21, 60)    # #42153c Twilight violet
    c_sky_mid = (140, 45, 25)     # #8c2d19 Burnt orange
    c_sky_lower = (217, 119, 6)   # #d97706 Warm amber
    c_horizon = (251, 191, 36)    # #fbbf24 Golden horizon glow

    sun_cx, sun_cy = width * 0.45, 340
    sun_radius = 55

    for y in range(height):
        # Sky interpolation factor
        t = y / 440.0
        if t <= 0.35:
            f = t / 0.35
            base_r = int(c_sky_top[0] + (c_sky_upper[0] - c_sky_top[0]) * f)
            base_g = int(c_sky_top[1] + (c_sky_upper[1] - c_sky_top[1]) * f)
            base_b = int(c_sky_top[2] + (c_sky_upper[2] - c_sky_top[2]) * f)
        elif t <= 0.75:
            f = (t - 0.35) / 0.40
            base_r = int(c_sky_upper[0] + (c_sky_mid[0] - c_sky_upper[0]) * f)
            base_g = int(c_sky_upper[1] + (c_sky_mid[1] - c_sky_upper[1]) * f)
            base_b = int(c_sky_upper[2] + (c_sky_mid[2] - c_sky_upper[2]) * f)
        elif t <= 1.0:
            f = (t - 0.75) / 0.25
            base_r = int(c_sky_mid[0] + (c_sky_lower[0] - c_sky_mid[0]) * f)
            base_g = int(c_sky_mid[1] + (c_sky_lower[1] - c_sky_mid[1]) * f)
            base_b = int(c_sky_mid[2] + (c_sky_lower[2] - c_sky_mid[2]) * f)
        else:
            base_r, base_g, base_b = c_horizon

        for x in range(width):
            # Sun glow calculation
            dx = x - sun_cx
            dy = y - sun_cy
            dist = math.sqrt(dx * dx + dy * dy)
            if dist < sun_radius:
                # Sun disc (bright golden cyber core)
                glow = 1.0 - (dist / sun_radius) * 0.3
                pix[x, y] = (
                    min(255, int(255 * glow)),
                    min(255, int(235 * glow)),
                    min(255, int(150 * glow))
                )
            elif dist < sun_radius * 4.5:
                # Outer atmospheric halo
                halo = math.exp(-(dist - sun_radius) / 45.0)
                r = min(255, int(base_r * (1 - halo) + 254 * halo))
                g = min(255, int(base_g * (1 - halo) + 200 * halo))
                b = min(255, int(base_b * (1 - halo) + 80 * halo))
                pix[x, y] = (r, g, b)
            else:
                pix[x, y] = (base_r, base_g, base_b)

    # 2. Distant Mesas & Monoliths (Far Layer: y ~ 370..490)
    # Using seamless periodic sine series
    def far_ridge(x):
        w1 = math.sin(x * 2 * math.pi / width) * 28
        w2 = math.cos(x * 6 * math.pi / width) * 14
        w3 = math.sin(x * 14 * math.pi / width) * 7
        # Plateau flattening
        raw = w1 + w2 + w3
        if raw > 15:
            raw = 15 + (raw - 15) * 0.25
        elif raw < -20:
            raw = -20 + (raw + 20) * 0.3
        return 410 - raw

    # Cyber monolith positions (periodic)
    monoliths = [
        (int(width * 0.18), 35, 110),
        (int(width * 0.38), 24, 85),
        (int(width * 0.65), 40, 130),
        (int(width * 0.88), 28, 95)
    ]

    c_far_rock = (92, 33, 20)       # #5c2114 Deep terracotta silhouette
    c_far_rock_hi = (165, 62, 35)   # #a53e23 Sunlit rim
    c_haze = (217, 119, 6)          # Dust haze

    for x in range(width):
        y_top = int(far_ridge(x))
        for y in range(y_top, 520):
            depth = (y - y_top) / 110.0
            haze_mix = min(1.0, max(0.0, (y - 430) / 90.0))
            if y == y_top:
                col = c_far_rock_hi
            elif depth < 0.2:
                col = c_far_rock_hi
            else:
                col = c_far_rock
            # Blend with dust haze near bottom
            r = int(col[0] * (1 - haze_mix) + c_haze[0] * haze_mix)
            g = int(col[1] * (1 - haze_mix) + c_haze[1] * haze_mix)
            b = int(col[2] * (1 - haze_mix) + c_haze[2] * haze_mix)
            pix[x, y] = (r, g, b)

    # Draw distant monoliths
    for mx, mw, mh in monoliths:
        for x in range(mx - mw // 2, mx + mw // 2):
            if 0 <= x < width:
                top_y = int(far_ridge(mx)) - mh
                for y in range(top_y, int(far_ridge(x)) + 5):
                    if y >= 0:
                        # Beveled futuristic pillar
                        is_edge = (x == mx - mw // 2 or x == mx + mw // 2 - 1)
                        col = c_far_rock_hi if is_edge else (70, 22, 14)
                        pix[x, y] = col

    # 3. Midground Sweeping Dunes (y ~ 470..600)
    def mid_dune(x):
        w1 = math.sin(x * 4 * math.pi / width + 0.8) * 38
        w2 = math.cos(x * 10 * math.pi / width) * 16
        w3 = math.sin(x * 18 * math.pi / width) * 8
        return 490 - (w1 + w2 + w3)

    c_mid_sun = (217, 119, 6)      # #d97706 Warm golden sunlit dune
    c_mid_crest = (245, 158, 11)   # #f59e0b Sharp illuminated crest
    c_mid_shade = (120, 53, 15)    # #78350f Dune shadow side
    c_mid_deep = (90, 35, 7)       # #5a2307

    for x in range(width):
        y_top = int(mid_dune(x))
        # Slope determines sunlit vs shadow side
        slope = (mid_dune((x + 2) % width) - mid_dune((x - 2) % width)) / 4.0
        is_sunlit = slope < 0.15

        for y in range(y_top, 620):
            dist_down = y - y_top
            if dist_down == 0 or dist_down == 1:
                pix[x, y] = c_mid_crest
            elif is_sunlit:
                f = min(1.0, dist_down / 80.0)
                r = int(c_mid_sun[0] * (1 - f) + c_mid_shade[0] * f)
                g = int(c_mid_sun[1] * (1 - f) + c_mid_shade[1] * f)
                b = int(c_mid_sun[2] * (1 - f) + c_mid_shade[2] * f)
                pix[x, y] = (r, g, b)
            else:
                f = min(1.0, dist_down / 80.0)
                r = int(c_mid_shade[0] * (1 - f) + c_mid_deep[0] * f)
                g = int(c_mid_shade[1] * (1 - f) + c_mid_deep[1] * f)
                b = int(c_mid_shade[2] * (1 - f) + c_mid_deep[2] * f)
                pix[x, y] = (r, g, b)

    # 4. Foreground Rolling Desert Dunes (y ~ 570..720)
    def fore_dune(x):
        w1 = math.sin(x * 6 * math.pi / width + 2.2) * 35
        w2 = math.cos(x * 12 * math.pi / width + 1.1) * 18
        w3 = math.sin(x * 24 * math.pi / width) * 6
        return 590 - (w1 + w2 + w3)

    c_fore_crest = (253, 224, 71)   # #fde047 Golden crest
    c_fore_sun = (234, 179, 8)      # #eab308
    c_fore_mid = (180, 83, 9)       # #b45309
    c_fore_shade = (120, 53, 15)    # #78350f
    c_fore_deep = (69, 26, 3)       # #451a03

    for x in range(width):
        y_top = int(fore_dune(x))
        slope = (fore_dune((x + 2) % width) - fore_dune((x - 2) % width)) / 4.0
        is_sunlit = slope < 0.2

        for y in range(y_top, height):
            dist_down = y - y_top
            if dist_down < 2:
                pix[x, y] = c_fore_crest
            elif dist_down < 6:
                pix[x, y] = c_fore_sun if is_sunlit else c_fore_mid
            elif is_sunlit:
                f = min(1.0, (dist_down - 6) / 90.0)
                # Subtle wind ripples
                ripple = math.sin((x * 0.2 + y * 0.4)) * 6
                r = int(max(0, min(255, c_fore_sun[0] * (1 - f) + c_fore_mid[0] * f + ripple)))
                g = int(max(0, min(255, c_fore_sun[1] * (1 - f) + c_fore_mid[1] * f + ripple * 0.8)))
                b = int(max(0, min(255, c_fore_sun[2] * (1 - f) + c_fore_mid[2] * f)))
                pix[x, y] = (r, g, b)
            else:
                f = min(1.0, (dist_down - 6) / 90.0)
                r = int(c_fore_mid[0] * (1 - f) + c_fore_shade[0] * f)
                g = int(c_fore_mid[1] * (1 - f) + c_fore_shade[1] * f)
                b = int(c_fore_mid[2] * (1 - f) + c_fore_shade[2] * f)
                pix[x, y] = (r, g, b)

    im.save(out_path, quality=92)
    print(f"Saved desert background: {out_path} ({width}x{height})")

if __name__ == "__main__":
    generate_desert_background()

