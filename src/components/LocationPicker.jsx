import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const GOOGLE_API_KEY = 'AIzaSyAwL6ljhnd2enI1v-3dMElRPxUeiT0SP08';
const libraries = ['places'];
const containerStyle = {
  width: '100%',
  height: '300px',
};

const defaultCenter = {
  lat: 20.5937,
  lng: 78.9629,
};

export default function LocationPicker({ defaultLocation, isEdit = false }) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_API_KEY,
    libraries,
  });

  const [markerPosition, setMarkerPosition] = useState(defaultLocation || defaultCenter);
  const mapRef = useRef(null);
  const autocompleteRef = useRef(null);
  const searchInputRef = useRef(null);
  const prefixRef = useRef(isEdit ? 'swal-edit-' : 'swal-');

  const setFieldValue = (id, value) => {
    const el = document.getElementById(id);
    if (el) {
      el.value = value !== undefined && value !== null ? String(value) : '';
    }
  };

  const applyLocation = useCallback((lat, lng, addressData) => {
    const prefix = prefixRef.current;
    setFieldValue(`${prefix}latitude`, lat);
    setFieldValue(`${prefix}longitude`, lng);
    if (addressData) {
      setFieldValue(`${prefix}address`, addressData.address || '');
      setFieldValue(`${prefix}city`, addressData.city || '');
      setFieldValue(`${prefix}state`, addressData.state || '');
      setFieldValue(`${prefix}pincode`, addressData.pincode || '');
      setFieldValue(`${prefix}country`, addressData.country || '');
    }
  }, []);

  const parseComponents = (components) => {
    let city = '', state = '', pincode = '', country = '';
    (components || []).forEach(c => {
      if (c.types.includes('locality')) city = c.long_name;
      if (c.types.includes('administrative_area_level_1')) state = c.long_name;
      if (c.types.includes('postal_code')) pincode = c.long_name;
      if (c.types.includes('country')) country = c.long_name;
    });
    return { city, state, pincode, country };
  };

  const reverseGeocode = useCallback((lat, lng) => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const { city, state, pincode, country } = parseComponents(results[0].address_components);
        applyLocation(lat, lng, {
          address: results[0].formatted_address,
          city, state, pincode, country,
        });
      } else {
        applyLocation(lat, lng, null);
      }
    });
  }, [applyLocation]);

  const handleMapClick = useCallback((event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    setMarkerPosition({ lat, lng });
    reverseGeocode(lat, lng);
  }, [reverseGeocode]);

  // Initialize autocomplete manually using native Google Maps API (avoids stale React closure)
  const initAutocomplete = useCallback(() => {
    if (!searchInputRef.current || autocompleteRef.current) return;
    if (!window.google || !window.google.maps || !window.google.maps.places) return;

    const ac = new window.google.maps.places.Autocomplete(searchInputRef.current, {
      fields: ['geometry', 'address_components', 'formatted_address'],
    });

    ac.addListener('place_changed', () => {
      const place = ac.getPlace();
      if (!place.geometry || !place.geometry.location) return;

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      setMarkerPosition({ lat, lng });

      // Pan map directly via ref (no stale closure issue)
      if (mapRef.current) {
        mapRef.current.panTo({ lat, lng });
        mapRef.current.setZoom(16);
      }

      const { city, state, pincode, country } = parseComponents(place.address_components || []);
      applyLocation(lat, lng, {
        address: place.formatted_address || '',
        city, state, pincode, country,
      });
    });

    autocompleteRef.current = ac;
  }, [applyLocation]);

  const onMapLoad = useCallback((mapInstance) => {
    mapRef.current = mapInstance;
    // Try init autocomplete again now that map is ready
    initAutocomplete();
  }, [initAutocomplete]);

  const onMapUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  useEffect(() => {
    if (defaultLocation && defaultLocation.lat && defaultLocation.lng) {
      setMarkerPosition(defaultLocation);
    }
  }, [defaultLocation]);

  // Init autocomplete as soon as API is loaded and input is in DOM
  useEffect(() => {
    if (isLoaded && searchInputRef.current) {
      initAutocomplete();
    }
  }, [isLoaded, initAutocomplete]);

  return isLoaded ? (
    <div className="my-4 border rounded-lg overflow-hidden flex flex-col">
      <style>{`
        .pac-container {
          z-index: 999999 !important;
          pointer-events: auto !important;
        }
      `}</style>
      <div className="p-3 bg-gray-50 flex flex-col sm:flex-row sm:items-center gap-3 border-b">
        <input
          ref={searchInputRef}
          type="text"
          placeholder="🔍 Search for a location..."
          className="flex-1 w-full p-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ color: '#111' }}
        />
        <span className="text-xs text-gray-500 whitespace-nowrap">or click map to pin</span>
      </div>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={markerPosition}
        zoom={defaultLocation ? 15 : 5}
        onLoad={onMapLoad}
        onUnmount={onMapUnmount}
        onClick={handleMapClick}
      >
        <Marker position={markerPosition} />
      </GoogleMap>
    </div>
  ) : (
    <div className="my-4 h-[300px] flex items-center justify-center bg-gray-100 rounded-lg border text-sm text-gray-500">
      Loading Map...
    </div>
  );
}
