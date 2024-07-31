import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { Component, OnInit, AfterViewInit } from '@angular/core';
import {
  Map,
  geoJson,
  GeoJSON,
  map,
  tileLayer,
  LatLngExpression,
  LeafletMouseEvent,
} from 'leaflet';
import { FeatureCollection } from 'geojson';
import { Observable, of } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [FormsModule, MatRadioModule],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
})
export class MapComponent implements OnInit, AfterViewInit {
  private map!: Map;
  private shape!: GeoJSON;
  private shapeData!: FeatureCollection;
  matrices: string[] = ['Weight', 'CO2', 'Methane', 'Contribution'];

  constructor(private _http: HttpClient) {}

  ngOnInit() {
    // load shape
    this._http
      .get<FeatureCollection>('http://192.168.0.100:8000/shape')
      .subscribe((data) => {
        this.shapeData = data;
        this.shape = geoJson(data.features, {
          style: (feature) => {
            return {
              color: feature?.properties.color,
              weight: 1,
              opacity: 0.5,
              fillOpacity: 0.3,
            };
          },
          onEachFeature: (feature, layer) => {
            let properties = feature.properties;
            layer.bindTooltip(`${properties.fid}`);
            layer.on({
              mouseover: (event: LeafletMouseEvent) =>
                this.highlightFeature(event),
              mouseout: (event: LeafletMouseEvent) => this.resetFeature(event),
              click: (event: LeafletMouseEvent) => {
                console.log(properties.color);
              },
            });
          },
        }).addTo(this.map);

        let center: LatLngExpression = [40.5, -86.9];
        this.map.setView(center, 12);

        data.features.forEach((feature) => {
          let fid = feature.properties?.['fid'];
          this._http
            .get<LogInterface[]>(
              `http://192.168.0.101:8000/census_blocks/${fid}/log_entries`
            )
            .pipe(
              catchError(
                this.handleError<LogInterface[]>(
                  'census_blocks_log_entries',
                  []
                )
              )
            )
            .subscribe((data) => {
              let weight: number = 0;
              let co2: number = 0;
              let methane: number = 0;
              let contribution = data.length;
              data.forEach((element) => {
                weight += element.weight_grams;
                co2 += element.co2;
                methane += element.methane;
              });
              feature.properties = {
                ...feature.properties,
                weight: weight,
                co2: co2,
                methane: methane,
                contribution: contribution,
              };
            });
        });
      });
  }

  ngAfterViewInit() {
    this.initializeMap();
  }

  private initializeMap() {
    const baseMapURl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    this.map = map('map');
    tileLayer(baseMapURl).addTo(this.map);
  }

  private highlightFeature(event: LeafletMouseEvent) {
    let layer = event.target;

    layer.setStyle({
      weight: 8,
      opacity: 1.0,
      // fillOpacity: 0.8,
    });
  }

  private resetFeature(event: LeafletMouseEvent) {
    let layer = event.target;

    layer.setStyle({
      weight: 1,
      opacity: 0.5,
      // fillOpacity: 0.3,
    });
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      // console.error(error); // log to console instead
      // console.log(`${operation} failed: ${error.message}`);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

  showMatrix(matrix: string) {
    console.log(matrix);
    let key: string;
    let unit: string;
    let color: string;
    switch (matrix) {
      case 'Weight': {
        key = 'weight';
        unit = 'gram(s)';
        color = '#000000';
        break;
      }

      case 'CO2': {
        key = 'co2';
        unit = 'gram(s)';
        color = '#ff0000';
        break;
      }

      case 'Methane': {
        key = 'methane';
        unit = 'gram(s)';
        color = '#00ff00';
        break;
      }

      case 'Contribution': {
        key = 'contribution';
        unit = 'time(s)';
        color = '#0000ff';
        break;
      }
    }

    let values: number[] = [];
    this.shape.remove();
    this.shapeData.features.forEach((element) => {
      values.push(element.properties?.[key]);
    });
    console.log(values);
    let max = Math.max(...values);
    console.log(max);
    this.shape = geoJson(this.shapeData.features, {
      style: (feature) => {
        return {
          color: color,
          weight: 1,
          opacity: 0.5,
          fillOpacity: feature?.properties[key] / max,
        };
      },
      onEachFeature: (feature, layer) => {
        layer.bindTooltip(`${feature.properties?.[key]} ${unit}`);
        layer.on({
          mouseover: (event: LeafletMouseEvent) => this.highlightFeature(event),
          mouseout: (event: LeafletMouseEvent) => this.resetFeature(event),
        });
      },
    }).addTo(this.map);
  }
}

export interface LogInterface {
  user_id: number;
  weight_grams: number;
  contamination: number;
  time: Date | string;
  id: string;
  co2: number;
  methane: number;
}
