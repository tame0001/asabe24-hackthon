import { HttpClient } from '@angular/common/http';
import { Component, OnInit, AfterViewInit } from '@angular/core';
import * as L from 'leaflet';
import { FeatureCollection, Point } from 'geojson';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
})
export class MapComponent implements OnInit, AfterViewInit {
  private map!: L.Map;

  constructor(private _http: HttpClient) {}

  ngOnInit() {
    this._http
      .get<FeatureCollection>('http://localhost:8000/shape')
      .subscribe((data) => {
        let shape = L.geoJson(data.features, {
          style: (feature) => ({ color: feature?.properties.color }),
          // onEachFeature(feature, layer) {
          //   let properties = feature.properties;
          //   // console.log(properties.fid);
          //   return layer.bindPopup(properties.fid);
          // },
        }).addTo(this.map);
        this.map.fitBounds(shape.getBounds());
      });
  }

  ngAfterViewInit() {
    this.initializeMap();
    this.initShape();
  }

  private initShape() {
    // let feature = L.geoJSON(this.shape, {
    //   onEachFeature(feature, layer) {
    //     // console.log(feature.properties);
    //     return layer.bindPopup(feature.properties.NAME);
    //   },
    //   style: function filterColor(feature) {
    //     switch (feature.properties.NAME) {
    //       default:
    //         return {
    //           color: 'red',
    //           weight: 1,
    //           opacity: 0.65,
    //         };
    //     }
    //   }.bind(this),
    // }).addTo(map);
    // L.geoJson(this.shape).addTo(this.map);
  }

  private initializeMap() {
    const baseMapURl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    this.map = L.map('map');
    L.tileLayer(baseMapURl).addTo(this.map);
  }
}
