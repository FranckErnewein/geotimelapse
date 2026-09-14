'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { MapBoundsProvider } from './bounds.js';
import { DAY_SECONDS, TimelapseClockProvider, useTimelapseClock } from './clock.js';
import Counter from './counter.js';
import { useFps, useFrameHistory, useMinuteActivity } from './hooks.js';
import TimelapseMap from './map.js';
import PlayerBar from './player-bar.js';
import SettingsMenu from './settings-menu.js';
import type { GeoTimelapseProps, MapBounds } from './types.js';

const defaultFormat = (value: number) => Math.round(value).toLocaleString('en-US');

function Stage({
  source,
  mapboxAccessToken,
  dateLabel,
  timeZoneLabel,
  formatValue = defaultFormat,
  formatCount = defaultFormat,
}: GeoTimelapseProps) {
  const clock = useTimelapseClock();
  const stageRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [loop, setLoop] = useState(true);
  const [scoped, setScoped] = useState(true);
  const [progress, setProgress] = useState<{ loadedBytes: number; totalBytes: number } | null>(null);
  const [ready, setReady] = useState(false);
  // Bumped after every completed re-scope so readers re-query the source.
  const [scopeVersion, setScopeVersion] = useState(0);
  // Mouse-idle state: the settings gear and the cursor itself fade out so
  // nothing overlays a TV-screen replay; any mouse move brings them back.
  const [uiVisible, setUiVisible] = useState(true);
  const [bounds, setBounds] = useState<MapBounds | null>(null);

  const frames = useFrameHistory(source, ready);
  const fps = useFps();
  const activity = useMinuteActivity(source, ready, scopeVersion);

  const onBoundsChange = useCallback((next: MapBounds) => {
    setBounds((prev) =>
      prev &&
      prev.west === next.west &&
      prev.south === next.south &&
      prev.east === next.east &&
      prev.north === next.north
        ? prev
        : next,
    );
  }, []);

  // Load the day once, then start the replay.
  useEffect(() => {
    let disposed = false;
    void source
      .load((loadedBytes, totalBytes) => {
        if (!disposed) setProgress({ loadedBytes, totalBytes });
      })
      .then(() => {
        if (disposed) return;
        setReady(true);
        clock.play();
      });
    return () => {
      disposed = true;
    };
  }, [source, clock]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const show = () => {
      setUiVisible(true);
      clearTimeout(timer);
      timer = setTimeout(() => setUiVisible(false), 5000);
    };
    show();
    window.addEventListener('pointermove', show);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointermove', show);
    };
  }, []);

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === stageRef.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // Re-scope the aggregates once the viewport settles.
  useEffect(() => {
    if (!ready) return;
    let disposed = false;
    const bump = () => {
      if (!disposed) setScopeVersion((version) => version + 1);
    };
    if (!scoped) {
      void source.setScope(null).then(bump);
      return () => {
        disposed = true;
      };
    }
    if (!bounds) return;
    const handle = setTimeout(() => void source.setScope(bounds).then(bump), 400);
    return () => {
      disposed = true;
      clearTimeout(handle);
    };
  }, [source, bounds, scoped, ready]);

  // The clock pauses at the end of the day; loop restarts it (play() rewinds).
  useEffect(() => {
    if (!loop) return;
    return clock.subscribe(() => {
      if (!clock.isPlaying() && clock.getDaySeconds() >= DAY_SECONDS) clock.play();
    });
  }, [loop, clock]);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void stageRef.current?.requestFullscreen();
  };

  return (
    <div
      ref={stageRef}
      className={[
        'relative h-full w-full overflow-hidden bg-black',
        /* important beats the inline cursor deck.gl sets on its canvas */
        uiVisible ? '' : 'cursor-none! **:cursor-none!',
      ].join(' ')}
    >
      <TimelapseMap frames={frames} mapboxAccessToken={mapboxAccessToken} onBoundsChange={onBoundsChange} />
      <MapBoundsProvider value={bounds}>
        <SettingsMenu
          visible={uiVisible}
          fullscreen={fullscreen}
          onToggleFullscreen={toggleFullscreen}
          loop={loop}
          onToggleLoop={() => setLoop((value) => !value)}
          scoped={scoped}
          onToggleScoped={() => setScoped((value) => !value)}
          frame={frames[0]}
          fps={fps}
        />
        <Counter
          source={source}
          ready={ready}
          progress={progress}
          scopeVersion={scopeVersion}
          dateLabel={dateLabel}
          timeZoneLabel={timeZoneLabel}
          formatValue={formatValue}
          formatCount={formatCount}
        />
      </MapBoundsProvider>
      <PlayerBar activity={activity} />
    </div>
  );
}

/**
 * A full-day replay of geolocated events: dark glowing map, waveform seek
 * bar, running totals, and a TV mode (autoplay, loop, self-hiding UI).
 * Fills its parent — give the wrapping element an explicit size.
 */
export function GeoTimelapse(props: GeoTimelapseProps) {
  return (
    <TimelapseClockProvider>
      <Stage {...props} />
    </TimelapseClockProvider>
  );
}
