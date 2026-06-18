import { Plus, Minus } from 'lucide-react';

interface MapControlsProps {
  zoomIn: () => void;
  zoomOut: () => void;
}

export default function MapControls({
  zoomIn,
  zoomOut
}: MapControlsProps) {
  return (
    <div className="absolute bottom-10 right-6 z-[1000] flex flex-col gap-3">
      <div className="flex flex-col bg-white rounded-2xl shadow-xl overflow-hidden divide-y divide-slate-100 border border-slate-200/80 font-bold">
        <button onClick={zoomIn} className="w-12 h-12 flex items-center justify-center text-slate-650 hover:bg-slate-50 cursor-pointer"><Plus className="w-5 h-5" /></button>
        <button onClick={zoomOut} className="w-12 h-12 flex items-center justify-center text-slate-650 hover:bg-slate-50 cursor-pointer"><Minus className="w-5 h-5" /></button>
      </div>
    </div>
  );
}
