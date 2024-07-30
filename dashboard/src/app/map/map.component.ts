import { HttpClient } from '@angular/common/http';
import { Component, OnInit, AfterViewInit } from '@angular/core';
import {
  Map,
  geoJson,
  map,
  tileLayer,
  LatLngExpression,
  LeafletMouseEvent,
} from 'leaflet';
import { FeatureCollection } from 'geojson';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
})
export class MapComponent implements OnInit, AfterViewInit {
  private map!: Map;
  constructor(private _http: HttpClient) {}

  ngOnInit() {
    this._http
      .get<FeatureCollection>('http://localhost:8000/shape')
      .subscribe((data) => {
        let shape = geoJson(data.features, {
          style: (feature) => {
            return {
              color: feature?.properties.color,
              weight: 3,
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
        this.map.fitBounds(shape.getBounds());
        let center: LatLngExpression = [40.5, -86.9];
        this.map.setView(center, 12);
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
      weight: 10,
      opacity: 1.0,
      fillOpacity: 0.8,
    });
  }

  private resetFeature(event: LeafletMouseEvent) {
    let layer = event.target;

    layer.setStyle({
      weight: 3,
      opacity: 0.5,
      fillOpacity: 0.3,
    });
  }
}
