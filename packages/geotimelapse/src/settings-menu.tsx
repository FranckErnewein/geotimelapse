'use client';

import type { ComponentType, SVGProps } from 'react';
import { useState } from 'react';
import {
  ArrowPathIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  Cog6ToothIcon,
  PauseIcon,
  PlayIcon,
  ViewfinderCircleIcon,
} from '@heroicons/react/20/solid';

import { useMapBounds } from './bounds.js';
import { useIsPlaying, useTimelapseClock } from './clock.js';
import type { FrameBids } from './hooks.js';
import { FRAME_HISTORY } from './hooks.js';

interface RowProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  hint?: string;
  state?: boolean;
  onClick: () => void;
}

function Row({ icon: Icon, label, hint, state, onClick }: RowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-white/10"
    >
      <Icon className="size-4 shrink-0" />
      <span className="flex-1">
        {label}
        {hint && <span className="text-white/50"> {hint}</span>}
      </span>
      {state !== undefined && <span className={state ? '' : 'text-white/40'}>{state ? 'on' : 'off'}</span>}
    </button>
  );
}

interface SettingsMenuProps {
  visible: boolean;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  loop: boolean;
  onToggleLoop: () => void;
  scoped: boolean;
  onToggleScoped: () => void;
  frame?: FrameBids;
  fps: number;
  /** Ghost frames currently rendered by the adaptive trail. */
  trailFrames: number;
}

export default function SettingsMenu({
  visible,
  fullscreen,
  onToggleFullscreen,
  loop,
  onToggleLoop,
  scoped,
  onToggleScoped,
  frame,
  fps,
  trailFrames,
}: SettingsMenuProps) {
  const clock = useTimelapseClock();
  const playing = useIsPlaying();
  const bounds = useMapBounds();
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`absolute top-4 left-4 font-mono text-xs text-white transition-opacity duration-250 ${
        visible ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      <button
        type="button"
        aria-label="Settings"
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        className="cursor-pointer rounded-lg bg-black/60 p-2 opacity-80 backdrop-blur-sm hover:opacity-100"
      >
        <Cog6ToothIcon className="size-5" />
      </button>
      {open && (
        <div className="mt-2 w-64 rounded-lg bg-black/60 p-2 backdrop-blur-sm">
          <Row
            icon={fullscreen ? ArrowsPointingInIcon : ArrowsPointingOutIcon}
            label={fullscreen ? 'Exit full screen' : 'Full screen'}
            hint="([Esc] to quit)"
            onClick={onToggleFullscreen}
          />
          <Row icon={playing ? PauseIcon : PlayIcon} label={playing ? 'Pause' : 'Play'} onClick={clock.toggle} />
          <Row icon={ArrowPathIcon} label="Loop" state={loop} onClick={onToggleLoop} />
          <Row icon={ViewfinderCircleIcon} label="Scope data to view" state={scoped} onClick={onToggleScoped} />
          <div className="mt-2 space-y-1 border-t border-white/10 px-2 pt-2 text-white/50 tabular-nums">
            {bounds && (
              <div>
                {bounds.west.toFixed(1)}, {bounds.south.toFixed(1)} → {bounds.east.toFixed(1)},{' '}
                {bounds.north.toFixed(1)}
              </div>
            )}
            <div>
              {fps} fps · {trailFrames}/{FRAME_HISTORY} ghosts
              {frame ? ` · ${frame.count.toLocaleString('en-US')} pts · ${frame.queryMs} ms` : ''}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
