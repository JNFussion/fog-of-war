"use client";

import { useEffect, useRef } from "react";
import mapboxgl, { Map } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  Units,
  circle,
  mask,
  Feature,
  Polygon,
  union,
  MultiPolygon,
} from "@turf/turf";

interface optionsCircle {
  steps?: number | undefined;
  units?: Units | undefined;
  properties?: {} | undefined;
}

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY!;

export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<Map | null>(null);
  const unionisedCircle = useRef<Feature<Polygon | MultiPolygon> | null>(null);
  const currentPositionCircle = useRef<Feature<Polygon> | null>(null);

  useEffect(() => {
    if (map.current) return;

    if (mapContainer.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/outdoors-v12",
      });

      map.current.on("load", () => {
        // SOURCE OF THE FOG (WHOLE WORLD)
        map.current!.addSource("fog", {
          type: "geojson",
          data: {
            type: "Polygon",
            coordinates: [
              [
                [180, 90],
                [-180, 90],
                [-180, -90],
                [180, -90],
                [180, 90],
              ],
            ],
          },
        });
        // ADD FILL LAYER USING FOG AS A SOURCE
        map.current!.addLayer({
          id: "fog",
          type: "fill",
          source: "fog",
          layout: {},
          paint: {
            "fill-color": "#000",
          },
        });
      });

      const geolocate = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showUserHeading: true,
      });

      map.current.addControl(geolocate);

      // I DONT UNDERSTAND WHY IT GIVES ERROR
      //@ts-ignore
      geolocate.on("geolocate", ({ coords }: GeolocationPosition) => {
        //Logic for revealing the map as the user moves.

        // Creates a circle using user position as center.
        let center = [coords.longitude, coords.latitude];
        let radius = 0.1;
        let options: optionsCircle = { steps: 40, units: "kilometers" };
        currentPositionCircle.current = circle(center, radius, options);

        const geoJsonSource = map.current!.getSource("fog");
        if (geoJsonSource.type === "geojson") {
          if (!unionisedCircle.current) {
            unionisedCircle.current = currentPositionCircle.current;
          } else {
            unionisedCircle.current = union(
              unionisedCircle.current,
              currentPositionCircle.current
            );
          }

          if (unionisedCircle.current) {
            let fog = mask(unionisedCircle.current);
            geoJsonSource.setData(fog);
          }
        }
      });
    }
  });

  return (
    <div className="h-screen">
      <div ref={mapContainer} id="map-container" className="h-3/4"></div>
    </div>
  );
}
