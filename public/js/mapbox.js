/* eslint-disable */

// //Walk back the problem
// const locations = JSON.parse(document.getElementById('map').dataset.locations);
// console.log(locations);

export const displayMap = locations => {
  mapboxgl.accessToken =
    'pk.eyJ1Ijoibm92YXByaW1lMSIsImEiOiJjbGwzM2JnbXYwMTU2M2tzZGl3MjZ5NmgyIn0.tGhda0u5dpHfDBZMoydRCg';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/novaprime1/cll34d90h002r01qn7lf22h3h',
    scrollZoom: false
    // center: [-118.113491, 34.111745],
    //zoom: 10
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach(loc => {
    // Create Marker
    const el = document.createElement('div');
    el.className = 'marker';

    //Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100
    }
  });
};
