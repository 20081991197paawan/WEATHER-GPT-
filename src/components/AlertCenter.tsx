import React from 'react';
import {
  AlertTriangle,
  CloudRain,
  Flame,
  Wind,
  ShieldAlert,
  Clock,
  CheckCircle2,
  BellRing,
} from 'lucide-react';
import { SeverityLevel, WeatherAlert } from '../types';

interface AlertCenterProps {
  alerts: WeatherAlert[];
}

export const AlertCenter: React.FC<AlertCenterProps> = ({ alerts }) => {
  const getSeverityBadge = (sev: SeverityLevel) => {
    switch (sev) {
      case 'danger':
        return {
          label: 'CRITICAL WARNING',
          bg: 'bg-rose-950/80 border-rose-500/50 text-rose-300',
          accent: 'border-l-4 border-rose-500',
          iconColor: 'text-rose-400',
        };
      case 'warning':
        return {
          label: 'WEATHER WARNING',
          bg: 'bg-amber-950/80 border-amber-500/50 text-amber-300',
          accent: 'border-l-4 border-amber-500',
          iconColor: 'text-amber-400',
        };
      case 'advisory':
        return {
          label: 'ADVISORY WATCH',
          bg: 'bg-yellow-950/80 border-yellow-500/50 text-yellow-300',
          accent: 'border-l-4 border-yellow-500',
          iconColor: 'text-yellow-400',
        };
      default:
        return {
          label: 'INFORMATIONAL',
          bg: 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300',
          accent: 'border-l-4 border-cyan-500',
          iconColor: 'text-cyan-400',
        };
    }
  };

  const getAlertIcon = (type: WeatherAlert['type']) => {
    switch (type) {
      case 'rain':
        return CloudRain;
      case 'heat':
        return Flame;
      case 'wind':
        return Wind;
      default:
        return AlertTriangle;
    }
  };

  return (
    <div className="rounded-3xl p-6 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950 border border-slate-800/80 shadow-xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow">
            <BellRing className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
              Weather Alert Center
              {alerts.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-950 text-rose-300 border border-rose-800">
                  {alerts.length} Active
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400">
              Verified meteorological alerts generated from configured atmospheric thresholds
            </p>
          </div>
        </div>

        <span className="text-xs text-slate-400">Official Safety Protocol</span>
      </div>

      {alerts.length === 0 ? (
        <div className="p-8 rounded-2xl bg-slate-950/40 border border-slate-800/80 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-200 mb-1">
            No Hazardous Alerts in Your Sector
          </h4>
          <p className="text-xs text-slate-400 max-w-md">
            Meteorological atmospheric models indicate stable, non-hazardous weather conditions. No severe rainstorms, heatwaves, or destructive wind gusts detected.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => {
            const Icon = getAlertIcon(alert.type);
            const style = getSeverityBadge(alert.severity);

            return (
              <div
                key={alert.id}
                className={`p-5 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-xl transition overflow-hidden relative ${style.accent}`}
              >
                {/* Top status bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider border ${style.bg}`}>
                      {style.label}
                    </span>
                    <span className="text-xs font-semibold text-slate-300">
                      {alert.condition}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{alert.expectedTime}</span>
                  </div>
                </div>

                {/* Title & headline */}
                <div className="flex items-start gap-3 mb-3">
                  <div className={`p-2 rounded-xl bg-slate-900 border border-slate-800 ${style.iconColor} shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-white font-display">
                      {alert.title}
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {alert.headline}
                    </p>
                  </div>
                </div>

                {/* Relevant Measurements Table */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 mb-3">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Relevant Station Measurements
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(alert.measurements).map(([key, val]) => (
                      <div key={key} className="text-xs">
                        <span className="text-slate-400 block text-[10px]">{key}</span>
                        <span className="font-mono font-bold text-slate-200">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Safety Action */}
                <div className="flex items-start gap-2 pt-2 border-t border-slate-800/80 text-xs">
                  <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-cyan-300 font-semibold">Recommended Action: </strong>
                    <span className="text-slate-300">{alert.recommendedAction}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
