import React from 'react';
import { X, ShieldAlert, AlertTriangle, Info, Bell, CheckCircle } from 'lucide-react';
import { WeatherAlert } from '../types';

interface AlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: WeatherAlert[];
  locationName: string;
}

export const AlertsModal: React.FC<AlertsModalProps> = ({
  isOpen,
  onClose,
  alerts,
  locationName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg max-h-[85vh] rounded-3xl p-6 backdrop-blur-3xl bg-stone-950/95 border border-white/20 shadow-2xl text-white flex flex-col space-y-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">Weather Alerts</h3>
              <p className="text-xs text-white/50">{locationName} Meteorological Radar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
          {alerts.length === 0 ? (
            <div className="py-12 text-center text-white/60 space-y-2">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto opacity-80" />
              <div className="text-sm font-medium text-white">No Severe Weather Warnings Active</div>
              <p className="text-xs text-white/40 max-w-xs mx-auto">
                Atmospheric conditions are within safe operational limits for outdoor travel.
              </p>
            </div>
          ) : (
            alerts.map((alert) => {
              const isDanger = alert.severity === 'danger';
              const isWarning = alert.severity === 'warning';

              return (
                <div
                  key={alert.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isDanger
                      ? 'bg-rose-950/40 border-rose-500/40 text-rose-100'
                      : isWarning
                      ? 'bg-amber-950/40 border-amber-500/40 text-amber-100'
                      : 'bg-orange-950/40 border-orange-500/40 text-orange-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {isDanger ? (
                        <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                      <span className="font-bold text-sm">{alert.title}</span>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold bg-white/10">
                      {alert.severity}
                    </span>
                  </div>

                  <p className="text-xs text-white/80 leading-relaxed mb-3">
                    {alert.headline}
                  </p>

                  <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1.5 text-xs text-white/70">
                    <div className="font-semibold text-white/90">Safety Action:</div>
                    <p className="text-[11px] leading-relaxed text-white/80">
                      {alert.recommendedAction}
                    </p>
                    {alert.measurements && Object.keys(alert.measurements).length > 0 && (
                      <div className="pt-1.5 flex flex-wrap gap-2 text-[10px] font-mono text-white/50">
                        {Object.entries(alert.measurements).map(([k, v]) => (
                          <span key={k} className="px-2 py-0.5 rounded bg-white/5">
                            {k}: {String(v)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[10px] text-white/40 font-mono">
                    <span>Expected Window:</span>
                    <span className="text-white/70">{alert.expectedTime}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
