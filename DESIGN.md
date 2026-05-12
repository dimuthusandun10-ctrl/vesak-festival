# Design Brief — Vesak Festival Community Dashboard with Admin & Engagement

## Aesthetic
Peaceful, warm, festive. Inspired by Sri Lankan Vesak celebrations with soft, inviting colors and gentle interactions. Meditative and joyful simultaneously — never chaotic or harsh. Admin features use subtle differentiation (muted backgrounds) without disrupting core warmth.

## Color Palette (OKLCH)

| Token | OKLCH | Purpose |
| --- | --- | --- |
| Primary | 0.72 0.15 102 | Warm gold — main actions, featured content, warmth |
| Secondary | 0.68 0.18 65 | Soft orange — accents, secondary interactions |
| Accent | 0.55 0.22 65 | Deep saffron — highlights, active states |
| Foreground | 0.25 0.04 65 | Warm dark text |
| Background | 0.98 0.02 105 | Off-white, subtle warmth |
| Muted | 0.92 0.02 105 | Soft surface (admin/secondary sections) |
| Border | 0.94 0.02 100 | Gentle edge |
| Destructive | 0.55 0.22 25 | Red (reports, rejections) |

## Status Badges
- **Pending**: Yellow background (0.85 0.15 85), text foreground
- **Approved**: Green background (0.75 0.12 130), text foreground
- **Rejected**: Red background (0.65 0.18 25), text foreground

## Typography
- **Display**: Figtree (warm, geometric, accessible)
- **Body**: DM Sans (clean, modern, readable)
- **Mono**: Geist Mono (technical elements, admin tables)

## Elevation & Depth
Soft shadows (`shadow-sm`), rounded corners (12px cards, 24px large cards, full pills), subtle borders with `border-border/40` transparency. No harsh elevations. Cards feel nested, not floating.

## Structural Zones

| Zone | Surface | Border | Purpose |
| --- | --- | --- | --- |
| Header | `bg-background` | `border-b border-border/30` | Navigation context |
| Content | `bg-background` | None | Main flow |
| Card | `bg-card` | `border border-border/40` | Content container (Dansal, gallery) |
| Admin Panel | `bg-muted/30` | `border border-border/50` | Data tables, management |
| Analytics Card | `bg-card` | `border border-border/40` | View/like/appreciation metrics |
| Engagement Row | `bg-transparent` | None | Like/comment/report buttons |
| Bottom Nav | `bg-card` | `border-t border-border/30` | Mobile tab bar (fixed) |
| Modal/Popover | `bg-popover` | `border border-border/40` | Report form, comments |

## Component Patterns
- **Buttons**: Gradient `bg-gradient-to-br from-primary via-primary to-secondary`, rounded-lg, white text (action), or `btn-engagement` (like/comment/report)
- **Cards**: `rounded-xl shadow-sm border border-border/40`, padding-4, hover transition
- **Status Badges**: `badge-pending`/`badge-approved`/`badge-rejected` utilities (rounded-full, text-xs)
- **Admin Table**: `admin-table` utility, `badge-*` status cells, role indicators
- **Analytics**: `analytics-card` grid (view count, like count, approval status)
- **Engagement Buttons**: `btn-like`/`btn-comment`/`btn-report` (icon + count, heart/message/flag)
- **Category Tabs**: `category-tabs` flex scroll, `category-tab`/`category-tab.active` toggles
- **Icons**: Lucide icons (20-24px) in primary/secondary/accent/destructive colors
- **Forms**: Light borders (`border-input`), soft focus states, no validation colors unless error

## Motion & Interaction
- **Transition**: `all 0.3s cubic-bezier(0.4, 0, 0.2, 1)` (smooth easing)
- **Hover**: Subtle shadow increase, color shift on buttons, badge background lift
- **Load**: Fade-in cards sequentially (staggered)
- **Heart Animation**: `heart-beat` keyframe on like button click (0.4s scale 1→1.3)
- **Float Animation**: `float` keyframe on featured Dansals (3s loop)
- **No**: Bounce, spin, or aggressive animations

## Dark Mode
Warm dark backgrounds (0.18 lightness, slight hue shift), inverted text contrast, slightly elevated primaries for readability. Admin sections use darker muted (`0.28 0.02 100`) with borders for clarity. Warm tone preserved throughout.

## Responsive
Mobile-first: Cards stack vertically, bottom navigation always visible (Home, Dansals, Gallery, Favorites, Admin), touch-friendly hit targets (44px+). Admin panel scrollable horizontally on small screens. Tablet/desktop: 2-3 column grids, admin sidebar navigation option.

## New Feature Zones
- **Admin Panel**: User management table, approval workflows (pending/approved/rejected), role badges, action buttons (approve/reject/edit/delete)
- **Approval Workflow**: Status badge on Dansal/photo cards, inline approval controls in admin
- **Report Modal**: Dropdown reason categories, optional text field, destructive submit button
- **Like/Comment/Review**: Heart icon + count (btn-like), message icon + comment section (collapsible), star rating form (review modal)
- **Organizer Analytics**: Cards showing views, likes, appreciations, approval status by Dansal
- **Favorites List**: Secondary tab in bottom nav, star icon toggle on cards, personal saved Dansals
- **Category Map**: Filter tabs (All/Vegetarian/Rice/Sweets/Milk/Fruit/Other), density visual, map placeholder

## Unique Signature
Warm color palette mimics lamp glow (lanterns). Soft shadows create a sense of floating peace. Admin features integrate via subtle `bg-muted/30` zones — powerful without jarring. Engagement features (likes, comments, reports) use iconic buttons that scale gracefully. Status badges use intuitive traffic-light colors (yellow/green/red) but in warm tones. Typography pairs communicate both tradition and modernity.

## Anti-Patterns
- ❌ Harsh blues, greys, or cold colors
- ❌ Aggressive animations or transitions
- ❌ Admin panels that dominate the UI (keep them recessed)
- ❌ Like buttons without feedback animation
- ❌ Uniform rounded corners (vary intentionally by zone)
- ❌ Full-width forms in modals (constrain to readable width)
- ❌ Conflicting engagement buttons on cards (group into row)

