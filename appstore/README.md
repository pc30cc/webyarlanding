# WebYar — App Store creative assets (header / search results)

| File | Placement |
|---|---|
| `webyar-appstore-{fa,en}-universal-5244x2950.png` | Universal (header + search results) |
| `webyar-appstore-{fa,en}-header-3840x1646.jpg` | Product page header (21:9) |
| `webyar-appstore-{fa,en}-search-3840x2560.jpg` | Search results (3:2) |

Key content sits inside Apple's Art Safe Area (from Apple's templates), which is all iPhone shows:
universal 1921,660 1402×962 · header 1097,493 1646×661 · search 836,765 2168×1030.

Regenerate: `cd source && node render.mjs "creative.html?lang=fa&c=header" out.png 1920 823 2`
(universal: 2622 1475 · search: 1920 1280; add `&guides=1` to show the safe area).
