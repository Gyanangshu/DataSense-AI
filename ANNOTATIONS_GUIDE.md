# Chart Annotations Guide

## Overview
Chart annotations allow you to add visual markers and labels to your visualizations to highlight important data points, trends, or thresholds.

## Features Implemented

### Annotation Types
1. **Text Labels** - Add custom text at specific coordinates
2. **Point Markers** - Highlight specific data points with colored dots
3. **Reference Lines** - Draw vertical or horizontal lines to mark thresholds or boundaries

### Supported Chart Types
- ✅ Bar Chart
- ✅ Line Chart
- ✅ Scatter Plot
- ⚠️ Pie Chart (annotations not applicable due to chart structure)

## How to Use Annotations

### Adding Annotations via UI

1. Navigate to the Visualization Builder page
2. Configure your chart (select axes, chart type, etc.)
3. Expand the **Annotations** panel in the left sidebar
4. Fill in the annotation details:
   - **Type**: Choose from Text Label, Point Marker, or Reference Line
   - **X Position**: The X-axis value where the annotation should appear
   - **Y Position**: The Y-axis value where the annotation should appear
   - **Text**: (For text labels only) The message to display
   - **Color**: The color for the annotation marker/line

5. Click **Add Annotation** to apply it to the chart

### Example Use Cases

#### 1. Marking Sales Target
```
Type: Reference Line (Horizontal)
X Position: (leave empty for horizontal line)
Y Position: 100000
Text: "Sales Target"
Color: #22c55e (green)
```

#### 2. Highlighting Peak Performance
```
Type: Point Marker
X Position: "2024-03-15"
Y Position: 125000
Color: #f59e0b (amber)
```

#### 3. Adding Context Notes
```
Type: Text Label
X Position: "Q2"
Y Position: 95000
Text: "Product Launch"
Color: #3b82f6 (blue)
```

## Technical Implementation

### Architecture
- **Storage**: Zustand store with localStorage persistence
- **Rendering**: Recharts `ReferenceLine` and `ReferenceDot` components
- **Integration**: `ChartAnnotations` component automatically fetches and renders annotations

### Component Structure
```
ChartAnnotations (components/charts/ChartAnnotations.tsx)
├─ Uses useChartStore to fetch annotations
├─ Renders ReferenceLine for line annotations
├─ Renders ReferenceDot for point and text annotations
└─ Supports both numeric and category axis types
```

### Props Required for Chart Components
All chart components now accept an optional `visualizationId` prop:
```typescript
<BarChart
  data={data}
  xKey="date"
  yKeys={["sales"]}
  visualizationId="viz-123" // Required for annotations to work
/>
```

## Persistence
- Annotations are automatically saved to localStorage
- They persist across page refreshes
- Each visualization has its own set of annotations (identified by visualizationId)

## Limitations
1. Pie charts don't support annotations (due to their radial structure)
2. X position must match data values for category axes
3. Y position must be numeric for vertical positioning

## Future Enhancements
Potential future features:
- Area annotations (shaded regions)
- Annotation templates for common use cases
- Drag-and-drop positioning
- Annotation grouping and layers
- Export annotations with chart images
