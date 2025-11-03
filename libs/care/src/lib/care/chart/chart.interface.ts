/**
 * Interface that all chart components must implement
 * Ensures consistent API for parent components
 */
export interface ChartComponent {
    /**
     * Returns the chart's canvas element for operations like downloading
     * @returns HTMLCanvasElement if chart is rendered, null otherwise
     */
    getCanvas(): HTMLCanvasElement | null;

    /**
     * Updates the chart with new data or configuration
     */
    update(): void;
}