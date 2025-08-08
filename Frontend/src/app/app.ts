import { Component, signal, effect } from '@angular/core';
import { Sensor } from './sensor.service';
import { CommonModule } from '@angular/common';
import { SensorChartComponent } from './sensor-chart/sensor-chart';
import { Heatmap } from './heatmap/heatmap';
import { ArrayTestComponent } from './array-test/array-test.component';
import { MatSliderModule } from '@angular/material/slider'; 

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    SensorChartComponent,
    Heatmap,
    ArrayTestComponent,
    MatSliderModule
  ],
  templateUrl: './app.html'
})
export class App {
  chartData = signal<any>(null); 
  textData = signal<any>(null);
  reloadHeatmap = signal(false);
  heatmapData = signal<any>(null); // <== Heatmapdaten speichern

  // Slider-Werte für Tagesnavigation
  currentTimestamp = signal<number>(this.getStartOfDayUnix());
  maxTimestamp = signal<number>(this.getEndOfDayUnix());

  constructor(private sensor: Sensor) {
    // Effekt: bei Timestamp-Änderung neue Daten laden
    effect(() => {
      const timestamp = this.currentTimestamp();
      this.loadSensorDataAt(timestamp);
    });
  }

  generateDummy() {
    this.sensor.generateDummyData().subscribe(res => {
      this.textData.set(res);
      this.chartData.set(null);
      this.reloadHeatmap.set(true);
    });
  }

  loadAllSensors() {
    this.sensor.getAllSensors().subscribe(res => {
      this.chartData.set(res);
      this.textData.set(null);
    });
  }

  loadNewSensors() {
    this.sensor.getNewSensors().subscribe(res => {
      this.chartData.set(res);
      this.textData.set(null);
    });
  }

  // Sensor- und Heatmap-Daten für aktuellen Timestamp laden
  loadSensorDataAt(unixTimestamp: number) {
    // Sensor-Daten (Chart)
    this.sensor.getSensorsAtTimestamp(unixTimestamp).subscribe(res => {
      this.chartData.set(res);
    });

    // Heatmap-Daten (aus /api/getArray?timestamp=...)
    const isoTimestamp = new Date(unixTimestamp).toISOString();
    this.sensor.getArray(isoTimestamp).subscribe(res => {
      this.heatmapData.set(res);
    });
  }

  getStartOfDayUnix(): number {
    const now = new Date();
    now.setUTCHours(0, 0, 0, 0);
    return now.getTime();
  }

  getEndOfDayUnix(): number {
    const now = new Date();
    now.setUTCHours(23, 59, 59, 999);
    return now.getTime();
  }

  sliderPosition = signal<number>(0);

  onSliderChange(event: Event) {
    const minutes = +(event.target as HTMLInputElement).value;
    this.sliderPosition.set(minutes);
    const dayStart = this.getStartOfDayUnix();
    const timestamp = dayStart + minutes * 60 * 1000;
    this.currentTimestamp.set(timestamp);
  }

  formatUTC(ms: number): string {
    return new Date(ms).toISOString();
  }
}
