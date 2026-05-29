import { Home, Plus, Minus } from 'lucide-react';

interface MapControlsProps {
  panToHomeCenter: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
}

export default function MapControls({
  panToHomeCenter,
  zoomIn,
  zoomOut
}: MapControlsProps) {
  return (
    <div className="absolute bottom-10 right-6 z-[1000] flex flex-col gap-3">
      <button 
        onClick={panToHomeCenter}
        className="w-12 h-12 glass rounded-2xl flex items-center justify-center transition-all shadow-xl text-sky-600 bg-white hover:bg-sky-50 border-white group"
        title="Về trung tâm Phường Bình Minh"
      >
        <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
      </button>
      <div className="flex flex-col bg-white rounded-2xl shadow-xl overflow-hidden divide-y divide-slate-100 border border-slate-100 font-bold">
        <button onClick={zoomIn} className="w-12 h-12 flex items-center justify-center text-slate-650 hover:bg-slate-50"><Plus className="w-5 h-5" /></button>
        <button onClick={zoomOut} className="w-12 h-12 flex items-center justify-center text-slate-650 hover:bg-slate-50"><Minus className="w-5 h-5" /></button>
      </div>
    </div>
  );
}
