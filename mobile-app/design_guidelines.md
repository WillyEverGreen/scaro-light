# Edgecase - Supply Chain Risk Intelligence App
## Design Guidelines

## 1. Brand Identity

**Purpose**: Professional supply chain risk monitoring tool for analysts who need to detect, track, and respond to global supply chain disruptions before they cascade.

**Aesthetic Direction**: **Data-Forward Editorial**
- Clean, information-dense layouts inspired by financial terminals
- High contrast for quick scanning of critical data
- Typography-driven hierarchy with minimal decoration
- Strategic use of data visualization as visual interest
- Serious, trustworthy, not playful

**Memorable Element**: The 3D interactive supply chain graph - a unique, explorable visualization that makes complex relationships tangible and immediately reveals critical dependencies.

## 2. Navigation Architecture

**Root Navigation**: Bottom Tab Bar (5 tabs)

**Screen Structure**:

**Tab 1: Dashboard** (Home icon)
- Main: Dashboard Screen
- Modal: Risk Detail Sheet
- Modal: Event Detail Sheet

**Tab 2: Graph** (Network icon)
- Main: 3D Supply Chain Graph
- Modal: Node Detail Overlay
- Modal: Filter Controls

**Tab 3: Query** (Message Circle icon)
- Main: AI Query Interface
- Sheet: Query History

**Tab 4: Monitor** (Activity icon)
- Stack: Scraping Control → Activity Log → Feed Management
- Stack: Weather & Alerts → Port Detail
- Stack: Trade Restrictions → Restriction Detail

**Tab 5: Settings** (Settings icon)
- Main: Settings Screen
- Stack: Backend Configuration

## 3. Screen-by-Screen Specifications

### Dashboard Screen
**Purpose**: At-a-glance view of current supply chain risk status and recent events.

**Layout**:
- Header: Transparent, title "Dashboard", right button (refresh icon)
- Content: Scrollable with pull-to-refresh
  - System Status Bar (3 connection indicators in a row)
  - Risk Metrics Grid (2x2 cards: Overall Risk, Alerts, Vendors, Countries)
  - Risk Timeline Chart (full-width card)
  - Commodity Status (horizontal scroll cards)
  - Recent Events Feed (list)
- Safe area: top = headerHeight + 16, bottom = tabBarHeight + 16

**Components**:
- Status indicators with colored dots (green/amber/red)
- Metric cards with large numbers, small labels, trend arrows
- Line chart with dual Y-axis (risk score + event count)
- Commodity cards (80% screen width) with horizontal scroll
- Event list items: category badge, severity pill, flag, title, timestamp

**Empty State**: If no events, show `empty-events.png` illustration with "No recent events detected"

### 3D Supply Chain Graph Screen
**Purpose**: Explore dependencies and relationships in the supply chain network.

**Layout**:
- Header: Transparent, title "Supply Chain Graph", right button (filter icon)
- Content: Full-screen 3D canvas (React Native WebView)
- Floating: Filter button (bottom-right, 72dp from edges)
- Safe area: entire screen edge-to-edge for immersive experience

**Components**:
- 3D force-directed graph (nodes colored by risk, sized by centrality)
- Pinch-zoom, pan, rotate gestures
- Tap node → show detail sheet from bottom
- Filter sheet: node type toggles, risk slider, search input

**Empty State**: Show `empty-graph.png` with "No data available. Check backend connection."

### AI Query Screen
**Purpose**: Ask natural language questions about supply chain risks.

**Layout**:
- Header: Default, title "Risk Intelligence"
- Content: Scrollable form layout
  - Example query chips (horizontal scroll)
  - Query input (multiline, min 3 lines)
  - Submit button (full width, below input)
  - Response area (markdown, streaming text animation)
  - Source citations (collapsible cards)
- Safe area: top = 16, bottom = tabBarHeight + 16

**Components**:
- Chip buttons for example queries
- Expanding text input with voice button
- Streaming text with typing indicator
- Citation cards: title, relevance score, snippet preview, chevron right
- Loading skeleton for response area

**Empty State**: Show `empty-query.png` with "Ask a question to get started"

### Scraping Control Screen
**Purpose**: Manage news scraping jobs and monitor activity.

**Layout**:
- Header: Default, title "Data Collection"
- Content: Scrollable
  - Active Jobs (cards with progress bars)
  - Start/Stop buttons (row)
  - Configuration form (search query input, date picker, source toggles)
  - Activity Log (last 20 events, monospace font)
- Safe area: top = 16, bottom = tabBarHeight + 16

**Components**:
- Job cards with status badges, progress bars
- Toggle switches for sources (Google, Bing, DuckDuckGo, Twitter)
- Date range picker (platform native)
- Activity log with severity color coding (gray, amber, red)

### Weather & Alerts Screen
**Purpose**: Monitor port weather conditions and active supply chain alerts.

**Layout**:
- Header: Default with tabs (Weather | Alerts)
- Content: Scrollable list
  - **Weather Tab**: Port cards (name, country flag, temp, wind, precipitation, status badge)
  - **Alerts Tab**: Alert list items (severity badge, title, description, timestamp, dismiss button)
- Safe area: top = 16, bottom = tabBarHeight + 16

**Components**:
- Port cards: horizontal layout, weather icon left, status badge right
- Alert items: colored left border (green/amber/orange/red), swipeable for dismiss
- Status badges: Normal (green), Warning (amber), Critical (red)

### Settings Screen
**Purpose**: Configure app preferences and backend connection.

**Layout**:
- Header: Default, title "Settings"
- Content: Scrollable form
  - Backend Configuration section
  - Display Preferences section
  - Notifications section
  - Data Management section
  - About section (version, licenses)
- Safe area: top = 16, bottom = tabBarHeight + 16

**Components**:
- Section headers (uppercase, small, gray)
- Setting rows (left label, right control: toggle, chevron, input)
- Test Connection button with loading state
- Danger zone (Clear Cache, red text)

## 4. Color Palette

**Edgecase Brand Colors** (derived from logo):
- Primary: #6FBFAB (Teal/Mint - main brand color from logo)
- Primary Light: #8DD4C4
- Primary Dark: #5AA593
- Secondary: #475569 (Dark Slate - accent from logo)
- Secondary Light: #64748B
- Secondary Dark: #334155

**Light Mode**:
- Background: #FFFFFF
- Surface: #F8FAFC (slate-50)
- Surface Elevated: #F1F5F9 (slate-100)
- Primary: #6FBFAB (brand teal)
- Primary Hover: #5AA593
- Text Primary: #1E293B (slate-800)
- Text Secondary: #64748B (slate-500)
- Border: #E2E8F0 (slate-200)

**Dark Mode**:
- Background: #0F172A (slate-900)
- Surface: #1E293B (slate-800)
- Surface Elevated: #334155 (slate-700)
- Primary: #6FBFAB (brand teal)
- Primary Hover: #8DD4C4
- Text Primary: #F1F5F9 (slate-100)
- Text Secondary: #94A3B8 (slate-400)
- Border: #334155 (slate-700)

**Risk Semantic Colors** (same in light/dark):
- Low (0-0.33): #10B981 (emerald-500)
- Medium (0.33-0.66): #F59E0B (amber-500)
- High (0.66-0.85): #F97316 (orange-500)
- Critical (0.85-1.0): #EF4444 (red-500)

**Status Colors**:
- Success: #10B981
- Warning: #F59E0B
- Error: #EF4444
- Info: #6FBFAB (brand teal)

## 5. Typography

**Font**: System default (SF Pro on iOS, Roboto on Android)

**Type Scale**:
- Headline 1: Bold, 24px, -0.5% letter-spacing (screen titles)
- Headline 2: Bold, 20px (card headers)
- Body 1: Regular, 16px, 24px line-height (main content)
- Body 2: Regular, 14px, 20px line-height (secondary content)
- Caption: Medium, 12px, 16px line-height (labels, timestamps)
- Overline: Medium, 11px, uppercase, 0.5px letter-spacing (section headers)
- Monospace: Monospace font, 13px (logs, technical data)

**Hierarchy**:
- Large risk scores: Bold, 48px
- Metric values: Bold, 32px
- Card titles: Bold, 18px
- List item titles: Medium, 16px

## 6. Visual Design

**Icons**: Lucide icon set from react-native-vector-icons (clean, minimal)

**Touchable Feedback**:
- Cards: Scale down to 0.98 on press, subtle opacity 0.7
- Buttons: Background color darkens 10%
- List items: Background color change (light: gray-50, dark: slate-800)

**Floating Action Button** (Filter on Graph screen):
- Background: Primary color
- Size: 56x56
- Icon: 24x24, white
- Shadow: shadowOffset width:0 height:2, shadowOpacity:0.10, shadowRadius:2
- Position: bottom-right, 72dp from edges

**Cards**:
- Border radius: 12px
- Border: 1px, Border color
- Padding: 16px
- No drop shadow (clean, editorial look)

**Charts**:
- Line thickness: 2px
- Grid lines: 1px, low opacity (0.1)
- Axis labels: Caption size, Text Secondary
- Data points: 4px circles on hover/tap

## 7. Assets to Generate

**App Icons**:
1. `icon.png` - App icon (1024x1024)
   - WHERE USED: Device home screen, App Store/Play Store
   - DESCRIPTION: Abstract network graph icon in Primary blue, nodes connected by lines, on white/transparent background

2. `splash-icon.png` - Splash screen icon (400x400)
   - WHERE USED: App launch screen
   - DESCRIPTION: Same as app icon but simpler, optimized for quick display

**Empty States**:
3. `empty-events.png` (300x240)
   - WHERE USED: Dashboard when no events available
   - DESCRIPTION: Minimal illustration of a calm globe/world with subtle connection lines, grayscale with Primary accent

4. `empty-graph.png` (300x240)
   - WHERE USED: Graph screen when no data loaded
   - DESCRIPTION: Abstract disconnected nodes floating in space, muted colors

5. `empty-query.png` (300x240)
   - WHERE USED: AI Query screen before first query
   - DESCRIPTION: Simple speech bubble icon with question mark, Primary color outline

**Country Flags**:
6. Flag icons for countries (24x16, rectangular)
   - WHERE USED: Event feed, port cards, restriction listings
   - USE STANDARD: Use existing flag emoji or icon library (react-native-flag-icons), do not generate custom

**Weather Icons**:
7. Weather condition icons (32x32)
   - WHERE USED: Port weather cards
   - USE STANDARD: Use existing weather icon library (e.g., react-native-vector-icons Feather set), do not generate custom