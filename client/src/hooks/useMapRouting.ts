import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchRoute, RouteCoordinate, RouteResponse } from '../lib/api';
import { SchoolZoneFeature } from '../lib/schoolZones';
import { RouteSnapshot } from '../types/routes';

/** Start/end points + route line. One place so map screens stay simple. */
export function useMapRouting(
  avoidSchoolZones: boolean,
  schoolZonesForRouting: SchoolZoneFeature[] = []
) {
  const [origin, setOrigin] = useState<RouteCoordinate | null>(null);
  const [destination, setDestination] = useState<RouteCoordinate | null>(null);
  const [originName, setOriginName] = useState('Start');
  const [destinationName, setDestinationName] = useState('End');
  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [savedRouteId, setSavedRouteId] = useState<string | null>(null);
  const [publishedRouteId, setPublishedRouteId] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapRenderVersion, setMapRenderVersion] = useState(0);
  const reqId = useRef(0);
  const skipNextRecalculate = useRef(false);

  const clearAll = useCallback(() => {
    reqId.current += 1;
    setMapRenderVersion((v) => v + 1);
    setOrigin(null);
    setDestination(null);
    setOriginName('Start');
    setDestinationName('End');
    setRoute(null);
    setSavedRouteId(null);
    setPublishedRouteId(null);
    setErrorText(null);
    setLoading(false);
  }, []);

  const calculateRoute = useCallback(
    async (start: RouteCoordinate, end: RouteCoordinate) => {
      const id = ++reqId.current;
      setLoading(true);
      setErrorText(null);
      setRoute(null);
      setSavedRouteId(null);
      setPublishedRouteId(null);
      try {
        const response = await fetchRoute(start, end, avoidSchoolZones, schoolZonesForRouting);
        if (id !== reqId.current) return;
        setRoute(response);
      } catch (err: any) {
        if (id !== reqId.current) return;
        setRoute(null);
        setErrorText(err.message || 'Could not get route');
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    },
    [avoidSchoolZones, schoolZonesForRouting]
  );

  // Settings toggled — redraw route (old line cleared first in calculateRoute)
  useEffect(() => {
    if (origin && destination) {
      if (skipNextRecalculate.current) {
        skipNextRecalculate.current = false;
        return;
      }
      calculateRoute(origin, destination);
    }
  }, [avoidSchoolZones, schoolZonesForRouting, origin, destination, calculateRoute]);

  const onMapTap = useCallback(
    (lat: number, lon: number) => {
      const coord = { lat, lon };
      const label = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;

      // No start yet, or route already done → new route from scratch
      if (!origin || (origin && destination)) {
        reqId.current += 1;
        setMapRenderVersion((v) => v + 1);
        setOrigin(coord);
        setOriginName(label);
        setDestination(null);
        setDestinationName('End');
        setRoute(null);
        setSavedRouteId(null);
        setPublishedRouteId(null);
        setErrorText(null);
        setLoading(false);
        return;
      }

      setDestination(coord);
      setDestinationName(label);
      calculateRoute(origin, coord);
    },
    [origin, destination, calculateRoute]
  );

  const onSearchPlace = useCallback(
    (place: { lat: string; lon: string; display_name?: string }) => {
      const coord = { lat: parseFloat(place.lat), lon: parseFloat(place.lon) };
      const name = place.display_name?.split(',')[0] || 'Place';

      if (!origin || (origin && destination)) {
        reqId.current += 1;
        setMapRenderVersion((v) => v + 1);
        setOrigin(coord);
        setOriginName(name);
        setDestination(null);
        setDestinationName('End');
        setRoute(null);
        setSavedRouteId(null);
        setPublishedRouteId(null);
        setErrorText(null);
        setLoading(false);
        return;
      }

      setDestination(coord);
      setDestinationName(name);
      calculateRoute(origin, coord);
    },
    [origin, destination, calculateRoute]
  );

  const loadSavedRoute = useCallback(
    (saved: RouteSnapshot) => {
      skipNextRecalculate.current = Boolean(saved.route);
      setMapRenderVersion((v) => v + 1);
      setOrigin(saved.origin);
      setDestination(saved.destination);
      setOriginName(saved.originName);
      setDestinationName(saved.destinationName);
      setSavedRouteId(saved.savedRouteId ?? null);
      setPublishedRouteId(saved.publishedRouteId ?? null);
      if (saved.route) {
        reqId.current += 1;
        setRoute(saved.route);
        setErrorText(null);
        setLoading(false);
        return;
      }
      calculateRoute(saved.origin, saved.destination);
    },
    [calculateRoute]
  );

  const hint = !origin
    ? 'Tap map: choose start'
    : !destination
      ? 'Tap map: choose end'
      : 'Tap map to start over, or press Clear';

  const routeLineKey = route
    ? `${avoidSchoolZones}-${schoolZonesForRouting.length}-${route.distance}-${route.geometry.coordinates.length}`
    : 'none';

  return {
    origin,
    destination,
    originName,
    destinationName,
    route,
    savedRouteId,
    publishedRouteId,
    errorText,
    loading,
    hint,
    routeLineKey,
    mapRenderVersion,
    clearAll,
    onMapTap,
    onSearchPlace,
    loadSavedRoute,
  };
}
