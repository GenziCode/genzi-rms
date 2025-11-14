# Modern Report Dashboard Guide

## Overview

A comprehensive, modern, responsive, and user-friendly report dashboard system with mobile-first design, customizable reports, interactive charts, and seamless backend integration.

## Features

### ✅ Modern & Stylish UI
- Clean, contemporary design with sleek color palette
- Professional typography and intuitive layout
- Modern UI components (cards, modals, interactive widgets)
- Visually engaging and easy to navigate

### ✅ Responsive Design
- Mobile-first approach
- Fully responsive across smartphones, tablets, and desktops
- Optimal user experience on all devices

### ✅ Customizable Reports
- **Drag-and-drop columns**: Reorder columns by dragging
- **Show/hide columns**: Toggle column visibility dynamically
- **Grouping, filtering, and sorting**: Full data manipulation capabilities
- **Save and load layouts**: Persist custom report configurations

### ✅ Interactive Sections
- Organized sections for reports, analytics, and KPIs
- Each report has its own dedicated dashboard
- Main reports dashboard page for navigation

### ✅ KPIs, Charts, and Infographics
- Multiple chart types: Bar, Line, Pie, Area charts
- Interactive charts with tooltips and legends
- KPI widgets with trend indicators
- Real-time data visualization

### ✅ Backend API Integration
- Seamless data fetching from backend APIs
- Real-time updates with React Query
- Efficient handling of large datasets
- Error handling and loading states

### ✅ User-Friendly Features
- Easy navigation between sections
- Real-time data updates
- Export options (PDF, CSV, Excel)
- User-friendly error handling and loading states

## Components

### 1. KPIWidget (`components/dashboard/KPIWidget.tsx`)
Displays key performance indicators with:
- Customizable colors and icons
- Trend indicators (up/down/neutral)
- Loading states
- Click handlers for navigation

**Usage:**
```tsx
<KPIWidget
  title="Total Sales"
  value="$10,000"
  subtitle="100 transactions"
  icon={<DollarSign />}
  color="green"
  trend={{ value: 12.5, label: "vs yesterday" }}
/>
```

### 2. ChartCard (`components/dashboard/ChartCard.tsx`)
Wrapper component for charts with:
- Header with title and description
- Action buttons (export, fullscreen)
- Loading states
- Gradient header styling

**Usage:**
```tsx
<ChartCard title="Sales Trend" description="Daily sales performance">
  <LineChart data={data} dataKey="date" lines={lines} />
</ChartCard>
```

### 3. Chart Components (`components/charts/`)
- **BarChart**: Bar chart visualization
- **LineChart**: Line chart with multiple series
- **PieChart**: Pie/donut chart
- **AreaChart**: Area chart with stacking support

### 4. CustomizableTable (`components/reports/CustomizableTable.tsx`)
Advanced data table with:
- Drag-and-drop column reordering
- Show/hide column visibility
- Sorting capabilities
- Filtering (coming soon)
- Export functionality
- Responsive design

**Usage:**
```tsx
<CustomizableTable
  data={tableData}
  columns={columns}
  onColumnsChange={handleColumnsChange}
  onExport={handleExport}
  loading={isLoading}
  title="Sales Data"
/>
```

### 5. ReportDashboardPage (`pages/ReportDashboardPage.tsx`)
Main dashboard page that combines:
- KPI widgets
- Multiple chart types
- Customizable data table
- Filter controls
- Layout save/load functionality
- Export options

## Usage

### Accessing Dashboards

1. Navigate to `/reports` to see all available reports
2. Click "Dashboard" button on supported reports (e.g., Daily Sales, Current Stock)
3. Or navigate directly to `/reports/dashboard/:reportType`

### Customizing Reports

1. **Reorder Columns**: Drag column headers to reorder
2. **Show/Hide Columns**: Click the eye icon on column headers
3. **Sort Data**: Click the sort icon on sortable columns
4. **Save Layout**: Click "Save Layout" button to persist your configuration
5. **Load Layout**: Saved layouts are automatically loaded on page refresh

### Exporting Reports

1. **Export Table**: Click CSV, Excel, or PDF buttons in table header
2. **Export Chart**: Click the menu icon on chart cards and select "Export Chart"
3. Exports are automatically downloaded with timestamped filenames

## Adding New Report Dashboards

To add a new report dashboard:

1. **Add Configuration** in `ReportDashboardPage.tsx`:
```tsx
const REPORT_CONFIGS = {
  'your-report-type': {
    title: 'Your Report Title',
    service: yourServiceMethod,
    getKPIs: (data) => [...],
    getCharts: (data) => [...],
    getTableData: (data) => [...],
    getTableColumns: () => [...],
  },
};
```

2. **Add Route** in `routes/index.tsx`:
```tsx
<Route path="/reports/dashboard/your-report-type" element={<ReportDashboardPage />} />
```

3. **Update ReportsPage** to show dashboard link:
```tsx
const hasDashboard = ['daily-sales', 'current-stock', 'your-report-type'].includes(report.id);
```

## Export Utilities

The `utils/exportUtils.ts` provides:
- `exportToCSV()`: Export data as CSV
- `exportToExcel()`: Export data as Excel (XLSX)
- `exportToPDF()`: Export data as PDF with auto-table
- `exportChartAsImage()`: Export chart as PNG image

## Layout Persistence

Layouts are saved to localStorage using the `useReportLayout` hook:
- Automatically saves column visibility and order
- Persists filters and sort configurations
- User-specific layouts (based on user ID)
- Report-type specific layouts

## Responsive Breakpoints

- **Mobile**: < 640px (1 column layout)
- **Tablet**: 640px - 1024px (2 column layout)
- **Desktop**: > 1024px (4 column layout for KPIs, 2 column for charts)

## Dependencies

- `@dnd-kit/core`: Drag-and-drop functionality
- `@dnd-kit/sortable`: Sortable list components
- `recharts`: Chart library (already installed)
- `chart.js` & `react-chartjs-2`: Alternative chart library
- `xlsx`: Excel export
- `jspdf` & `jspdf-autotable`: PDF export
- `html2canvas`: Chart image export

## Best Practices

1. **Performance**: Use React Query for data fetching and caching
2. **Accessibility**: All interactive elements have proper ARIA labels
3. **Error Handling**: Always show loading and error states
4. **Mobile First**: Design for mobile, enhance for desktop
5. **User Experience**: Provide clear feedback for all actions

## Future Enhancements

- [ ] Advanced filtering UI
- [ ] Column grouping
- [ ] Real-time data updates via WebSocket
- [ ] Custom chart types
- [ ] Dashboard templates
- [ ] Scheduled report exports
- [ ] Email report delivery

