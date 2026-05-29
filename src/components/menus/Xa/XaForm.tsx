import React from 'react';

interface Props {
  formData: any;
  setFormData: (val: any) => void;
}

export default function XaForm({ formData, setFormData }: Props) {
  return (
    <div className="space-y-4 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Phân loại</label>
        <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none" value={formData.loai || ''} onChange={(e) => setFormData({ ...formData, loai: e.target.value })} />
      </div>

    </div>
  );
}
