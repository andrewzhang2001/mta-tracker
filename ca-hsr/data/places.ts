export type Place = {
  name: string
  /** [lng, lat]. */
  coordinates: [number, number]
}

// Coordinates are OpenStreetMap points, looked up through Nominatim on
// 2026-11-15. Merced, Madera, Fresno, Bakersfield, Los Angeles, and San
// Francisco use the city's center. Every other entry uses the OSM station node.
export const places: Place[] = [
  { name: 'San Francisco', coordinates: [-122.4075, 37.7879] },
  { name: 'Millbrae', coordinates: [-122.3868, 37.6002] },
  { name: 'San Jose Diridon', coordinates: [-121.9026, 37.3296] },
  { name: 'Gilroy', coordinates: [-121.5669, 37.0045] },
  // The Central Valley Wye, a junction with no station. Placed at the SR 152 /
  // Road 11 intersection in Madera County: the midpoint of OSM nodes 88866318
  // and 332157196, one per carriageway, looked up through Overpass on 2026-11-16.
  { name: 'Wye', coordinates: [-120.347, 37.0834] },
  { name: 'Merced', coordinates: [-120.4843, 37.303] },
  { name: 'Madera', coordinates: [-120.0595, 36.9623] },
  { name: 'Fresno', coordinates: [-119.7848, 36.7394] },
  { name: 'Kings–Tulare', coordinates: [-119.5916, 36.3322] },
  { name: 'Bakersfield', coordinates: [-119.0195, 35.3739] },
  { name: 'Palmdale', coordinates: [-118.1196, 34.5908] },
  // Burbank Airport–North, the Metrolink stop on the Antelope Valley Line.
  { name: 'Burbank Airport', coordinates: [-118.3499, 34.2063] },
  { name: 'Los Angeles', coordinates: [-118.2428, 34.0537] },
  // Anaheim Regional Transportation Intermodal Center (ARTIC).
  { name: 'Anaheim', coordinates: [-117.8775, 33.8033] },
]
