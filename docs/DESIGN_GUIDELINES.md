# 4SPORTS — DESIGN GUIDELINES

**Verzija:** 1.0
**Status:** Ready for Implementation
**Figma Reference:** [4Sports Design](https://www.figma.com/design/4RdwNSYGkUcK6MAJvz68q4/4Sports)

---

## 1. Color System

### Primary Colors
```
Primary Green: #00E676 (Main accent color)
Primary Green Dark: #00C853 (Hover states)
Primary Green Light: #69F0AE (Disabled states)
```

### Background Colors (Dark Mode)
```
Background Primary: #121212
Background Surface: #1E1E1E
Background Elevated: #2C2C2C
Background Modal: #252525
```

### Text Colors
```
Text Primary: #FFFFFF (High emphasis - 100%)
Text Secondary: #B0B0B0 (Medium emphasis - 70%)
Text Disabled: #6B6B6B (Disabled - 40%)
Text On Primary: #000000 (Text on green buttons)
```

### Status Colors
```
Success: #00E676 (Paid, Confirmed, Active)
Warning: #FFB300 (Pending, Expiring Soon)
Error: #FF5252 (Unpaid, Expired, Absent)
Info: #00B8D4 (Informational states)
```

### Semantic Colors
```
Trening Event: #00E676
Takmičenje Event: #FFB300
Medical Valid: #00E676
Medical Expired: #FF5252
Payment Paid: #00E676
Payment Unpaid: #FF5252
```

---

## 2. Typography

### Font Family
```
Primary: Inter (Web), System Default (Mobile)
Fallback: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
```

### Font Sizes & Weights

#### Web Admin Panel
```
Heading 1: 32px / Bold (700) - Page titles
Heading 2: 24px / SemiBold (600) - Section headers
Heading 3: 20px / SemiBold (600) - Card titles
Body Large: 16px / Regular (400) - Main content
Body: 14px / Regular (400) - Default text
Caption: 12px / Regular (400) - Labels, metadata
Small: 10px / Medium (500) - Tags, badges
```

#### Mobile App
```
Heading 1: 28px / Bold (700) - Screen titles
Heading 2: 22px / SemiBold (600) - Section headers
Heading 3: 18px / SemiBold (600) - Card titles
Body Large: 16px / Regular (400) - Main content
Body: 14px / Regular (400) - Default text
Caption: 12px / Regular (400) - Labels
Small: 10px / Medium (500) - Tags
```

### Line Heights
```
Tight: 1.2 (Headings)
Normal: 1.5 (Body text)
Relaxed: 1.75 (Long content)
```

---

## 3. Spacing System

### Base Unit: 4px

```
Space 1: 4px
Space 2: 8px
Space 3: 12px
Space 4: 16px
Space 5: 20px
Space 6: 24px
Space 8: 32px
Space 10: 40px
Space 12: 48px
Space 16: 64px
```

### Component Spacing
```
Card Padding: 24px (Desktop), 16px (Mobile)
Section Margin: 32px (Desktop), 24px (Mobile)
List Item Gap: 12px
Button Padding: 12px 24px
Input Padding: 12px 16px
```

---

## 4. Border Radius

```
Small: 4px (Tags, Badges)
Medium: 8px (Buttons, Inputs, Cards)
Large: 12px (Modals, Drawers)
XLarge: 16px (Feature cards)
Circle: 50% (Avatar, Icons)
```

---

## 5. Shadows & Elevation

### Shadow Levels
```css
/* Level 1 - Cards */
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);

/* Level 2 - Hover states */
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.5);

/* Level 3 - Dropdowns, Popovers */
box-shadow: 0 10px 20px rgba(0, 0, 0, 0.6);

/* Level 4 - Modals */
box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7);
```

---

## 6. Components Library

### 6.1 Buttons

#### Primary Button
```
Background: #00E676
Text: #000000
Padding: 12px 24px
Border Radius: 8px
Font: 14px / SemiBold (600)
Hover: #00C853
Active: Scale 0.98
Disabled: #69F0AE with 40% opacity
```

#### Secondary Button
```
Background: Transparent
Border: 1px solid #00E676
Text: #00E676
Hover: Background #00E67610
```

#### Danger Button
```
Background: #FF5252
Text: #FFFFFF
Hover: #E04848
```

#### Icon Button
```
Size: 40x40px
Background: #2C2C2C
Icon Color: #FFFFFF
Hover: #3C3C3C
```

### 6.2 Input Fields

```
Background: #2C2C2C
Border: 1px solid #3C3C3C
Border Radius: 8px
Padding: 12px 16px
Font: 14px / Regular
Text Color: #FFFFFF
Placeholder: #6B6B6B

Focus State:
Border: 1px solid #00E676
Box Shadow: 0 0 0 3px rgba(0, 230, 118, 0.1)

Error State:
Border: 1px solid #FF5252
```

### 6.3 Cards

#### Standard Card
```
Background: #1E1E1E
Border: 1px solid #2C2C2C
Border Radius: 12px
Padding: 24px
Shadow: Level 1
Hover: Shadow Level 2
```

#### KPI Card (Dashboard)
```
Background: #1E1E1E
Border Radius: 12px
Padding: 20px
Icon: 48x48px circle with green background
Title: 32px / Bold
Label: 12px / Medium / #B0B0B0
```

### 6.4 List Items

#### Member Card (Lista V2.png reference)
```
Background: #1E1E1E
Border Radius: 8px
Padding: 16px
Gap: 12px
Avatar: 48x48px circle
Status Badge: Right aligned
Swipe Actions: Background #2C2C2C
```

### 6.5 Status Badges

```
Padding: 4px 12px
Border Radius: 12px
Font: 12px / Medium
Text Transform: Uppercase

Paid/Active:
  Background: rgba(0, 230, 118, 0.15)
  Text: #00E676
  Border: 1px solid rgba(0, 230, 118, 0.3)

Unpaid/Expired:
  Background: rgba(255, 82, 82, 0.15)
  Text: #FF5252
  Border: 1px solid rgba(255, 82, 82, 0.3)

Pending:
  Background: rgba(255, 179, 0, 0.15)
  Text: #FFB300
  Border: 1px solid rgba(255, 179, 0, 0.3)
```

### 6.6 Calendar Events

```
Border Radius: 6px
Padding: 8px 12px
Font: 12px / Medium
Gap: 4px (Icon to text)

Trening:
  Background: rgba(0, 230, 118, 0.2)
  Border Left: 3px solid #00E676

Takmičenje:
  Background: rgba(255, 179, 0, 0.2)
  Border Left: 3px solid #FFB300
```

### 6.7 Modals & Bottom Sheets

```
Background: #252525
Border Radius: 16px (Top only for mobile)
Padding: 24px
Max Width: 600px (Desktop)
Backdrop: rgba(0, 0, 0, 0.7)

Header:
  Title: 20px / SemiBold
  Close Button: Top right, 40x40px
  Bottom Border: 1px solid #3C3C3C
  Margin Bottom: 24px
```

### 6.8 Navigation

#### Sidebar (Web)
```
Width: 240px (Expanded), 72px (Collapsed)
Background: #1E1E1E
Border Right: 1px solid #2C2C2C
Padding: 16px

Nav Item:
  Padding: 12px 16px
  Border Radius: 8px
  Gap: 12px (Icon to text)

Active State:
  Background: rgba(0, 230, 118, 0.1)
  Text: #00E676
  Border Left: 3px solid #00E676
```

#### Bottom Tab Bar (Mobile)
```
Height: 64px
Background: #1E1E1E
Border Top: 1px solid #2C2C2C
Safe Area Padding: Bottom

Tab Item:
  Size: 48x48px
  Icon: 24x24px
  Label: 10px / Medium
  Gap: 4px

Active:
  Icon Color: #00E676
  Text Color: #00E676
```

---

## 7. Iconography

### Icon Library
**Lucide Icons** (React Lucide / Lucide React Native)

### Icon Sizes
```
Small: 16x16px (Inline with text)
Medium: 24x24px (Default)
Large: 32x32px (Feature icons)
XLarge: 48x48px (KPI cards)
```

### Commonly Used Icons
```
Home: home
Calendar: calendar
Users: users
Settings: settings
Plus: plus-circle
QR Code: qr-code
Camera: camera
Check: check-circle
X: x-circle
Alert: alert-triangle
Money: dollar-sign
Chart: bar-chart-2
Trophy: trophy
Medical: activity
Bell: bell
```

---

## 8. Charts & Data Visualization

### Chart Colors (Recharts)
```
Primary Data: #00E676
Secondary Data: #00B8D4
Tertiary Data: #FFB300
Negative Data: #FF5252

Grid Lines: #2C2C2C
Axis Labels: #B0B0B0
Tooltips: #252525 with shadow
```

### Chart Types Used
1. **Line Chart** - Rast članova (Dashboard)
2. **Donut Chart** - Bilans (Dashboard)
3. **Pie Chart** - Prihod po kvartalima (Dashboard)
4. **Bar Chart** - Prihodi i rashodi (Dashboard)

---

## 9. Animations & Transitions

### Duration
```
Fast: 150ms (Hover, Focus)
Normal: 250ms (Modals, Drawers)
Slow: 350ms (Page transitions)
```

### Easing
```
Default: cubic-bezier(0.4, 0, 0.2, 1)
Entrance: cubic-bezier(0, 0, 0.2, 1)
Exit: cubic-bezier(0.4, 0, 1, 1)
```

### Common Animations
```css
/* Button Hover */
transition: all 150ms ease;
transform: scale(0.98);

/* Modal Enter */
@keyframes modalFadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

/* List Item Swipe */
transition: transform 250ms ease;

/* Loading Spinner */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

---

## 10. Responsive Breakpoints

```
Mobile: 0-639px
Tablet: 640-1023px
Desktop: 1024-1279px
Large Desktop: 1280px+
```

### Layout Adaptations
```
Mobile:
  - Single column
  - Bottom navigation
  - Full-width cards
  - Reduced padding (16px)

Tablet:
  - Two columns for lists
  - Sidebar can be collapsed
  - Modal max-width: 80%

Desktop:
  - Multi-column layouts
  - Persistent sidebar
  - Modal max-width: 600px
  - Increased padding (24px)
```

---

## 11. QR Code Design

### Member QR Code (Profile)
```
Size: 256x256px (Display), 1024x1024px (Export)
Background: #FFFFFF
Foreground: #000000
Logo: 4sports logo in center (optional)
Border: 16px padding, #1E1E1E background
Corner Radius: 12px (Container)
```

### QR Code Display Card
```
Background: #FFFFFF
Padding: 32px
Border Radius: 16px
Shadow: Level 2
Member Name: Below QR, 18px / SemiBold / #000000
Member ID: Below name, 14px / Regular / #6B6B6B
```

---

## 12. Loading States

### Skeleton Loaders
```
Background: #1E1E1E
Shimmer: Linear gradient from #1E1E1E to #2C2C2C
Animation: 1.5s ease-in-out infinite
Border Radius: Match component
```

### Spinner
```
Size: 32x32px
Border: 3px solid #2C2C2C
Border Top: 3px solid #00E676
Animation: Spin 0.6s linear infinite
```

### Progress Bar
```
Background: #2C2C2C
Fill: #00E676
Height: 4px
Border Radius: 2px
Animation: Smooth 250ms
```

---

## 13. Empty States

```
Icon: 48x48px, #6B6B6B
Title: 18px / SemiBold / #B0B0B0
Description: 14px / Regular / #6B6B6B
Action Button: Primary button
Spacing: 24px vertical gap
Alignment: Center
```

---

## 14. Forms & Validation

### Form Layout
```
Label: 14px / Medium / #B0B0B0
Margin Bottom: 8px
Required Indicator: Red asterisk
Help Text: 12px / Regular / #6B6B6B
Error Message: 12px / Medium / #FF5252
Field Spacing: 20px between fields
```

### Validation States
```
Default: Border #3C3C3C
Valid: Border #00E676, Icon check-circle
Invalid: Border #FF5252, Icon alert-circle
Disabled: Opacity 0.5, Cursor not-allowed
```

---

## 15. Accessibility

### Contrast Ratios
```
Text Primary on Background: 14.6:1 (AAA)
Text Secondary on Background: 7.3:1 (AA)
Primary Green on Background: 4.8:1 (AA)
```

### Focus States
```
Outline: 2px solid #00E676
Offset: 2px
Border Radius: Match component
```

### Touch Targets (Mobile)
```
Minimum: 44x44px
Recommended: 48x48px
Spacing: 8px between targets
```

---

## 16. Screen-Specific Designs

### Dashboard (3.png reference)
- Grid layout: 4 KPI cards at top
- 2-column layout for charts
- Cards with equal height in rows
- 32px gap between cards

### Member List (Lista V2.png reference)
- Vertical list with 12px gap
- Avatar on left (48px)
- Name and details in center
- Status badge on right
- Swipe-to-action enabled

### Calendar (Kalendar V2.png reference)
- Month view with mini calendar
- Event list below calendar
- Color-coded events
- Add button: FAB (Floating Action Button)

### Profile (Profil člana reference)
- Centered QR code at top
- Member info cards below
- Stats grid (2 columns on mobile)
- Edit button: Top right

---

## 17. Design Tokens (For Implementation)

### Tailwind Config Example
```javascript
module.exports = {
  theme: {
    colors: {
      primary: {
        DEFAULT: '#00E676',
        dark: '#00C853',
        light: '#69F0AE',
      },
      background: {
        primary: '#121212',
        surface: '#1E1E1E',
        elevated: '#2C2C2C',
      },
      text: {
        primary: '#FFFFFF',
        secondary: '#B0B0B0',
        disabled: '#6B6B6B',
      },
      status: {
        success: '#00E676',
        warning: '#FFB300',
        error: '#FF5252',
        info: '#00B8D4',
      },
    },
    borderRadius: {
      sm: '4px',
      DEFAULT: '8px',
      lg: '12px',
      xl: '16px',
    },
  },
}
```

---

## 18. Component Implementation Priority

### Phase 1 - Core Components
1. Button (Primary, Secondary, Danger, Icon)
2. Input (Text, Number, Date)
3. Card (Standard, KPI)
4. Badge (Status)
5. Avatar
6. Modal / Bottom Sheet

### Phase 2 - Complex Components
7. Navigation (Sidebar, Tab Bar)
8. Calendar (Month view, Event list)
9. Charts (Line, Donut, Pie, Bar)
10. QR Code (Generator, Scanner)

### Phase 3 - Advanced Components
11. Data Table (Sortable, Filterable)
12. Form Builder (Multi-step)
13. File Upload (Image, Video)
14. Notification Center

---

## 19. Best Practices

1. **Consistency**: Use design tokens consistently across all screens
2. **Feedback**: Always provide visual feedback for user actions
3. **Performance**: Optimize images, use lazy loading for lists
4. **Accessibility**: Maintain proper contrast, keyboard navigation
5. **Mobile-First**: Design for mobile, enhance for desktop
6. **Dark Mode**: All components must work in dark theme
7. **Testing**: Test on real devices for touch interactions
8. **Documentation**: Keep this guide updated with new components

---

## 20. Resources

- **Icons**: [Lucide Icons](https://lucide.dev/)
- **Charts**: [Recharts Documentation](https://recharts.org/)
- **UI Library (Web)**: [shadcn/ui](https://ui.shadcn.com/)
- **UI Library (Mobile)**: [React Native Paper](https://callstack.github.io/react-native-paper/)
- **Fonts**: [Inter Font](https://rsms.me/inter/)

---

**Next Steps:**
- Implement design tokens in TailwindCSS config
- Create shadcn/ui theme configuration
- Build component library following these guidelines
- Test all components in dark mode
