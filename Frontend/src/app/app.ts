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
    MatSliderModule // <== Module registrieren
  ],
  templateUrl: './app.html'
})
export class App {
  chartData = signal<any>(null); 
  textData = signal<any>(null);
  reloadHeatmap = signal(false);

  // Slider-Werte für Tagesnavigation
  currentTimestamp = signal<number>(this.getStartOfDayUnix()); // UTC-Startzeit heute
  maxTimestamp = signal<number>(this.getEndOfDayUnix());       // UTC-Endzeit heute

  constructor(private sensor: Sensor) {
    // Effekt zum Laden von Daten bei Slider-Änderung
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

  // Sensor-Daten für aktuellen Slider-Zeitpunkt laden
  loadSensorDataAt(unixTimestamp: number) {
    this.sensor.getSensorsAtTimestamp(unixTimestamp).subscribe(res => {
      this.chartData.set(res);
    });
  }

  // Hilfsmethoden zur Tagesgrenze (UTC)
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

// Neue Signal für Sliderposition (0–1439 Minuten)
sliderPosition = signal<number>(0);

onSliderChange(event: Event) {
  const minutes = +(event.target as HTMLInputElement).value;
  this.sliderPosition.set(minutes);

  const dayStart = this.getStartOfDayUnix();
  const timestamp = dayStart + minutes * 60 * 1000; // Minuten in ms
  this.currentTimestamp.set(timestamp);
}

  // Anzeigeformat für UTC Zeit
  formatUTC(ms: number): string {
    return new Date(ms).toISOString();
  }
}
