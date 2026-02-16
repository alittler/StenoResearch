
import React, { useState } from 'react';
import { ProjectNote } from '../types';

interface AssetVaultProps {
  notes: ProjectNote[];
  onDelete: (id: string) => void;
}

const AssetVault: React.FC<AssetVaultProps> = ({ notes, onDelete }) => {
  const [filter, setFilter] = useState<'all' | 'image' | 'link'>('all');
  
  const assets = notes.filter(n => {
    if (filter === 'image') return !!n.metadata?.imageData;
    if (filter === 'link') return n.metadata?.urls && n.metadata.urls.length > 0;
    return n.metadata?.imageData || (n.metadata?.urls && n.metadata.urls.length > 0);
  });

  return (
    <div className="space-y-8 animate-slide-in">
      <header className="flex justify-between items-center border-b border-stone-800 pb-6">
        <h2 className="text-2xl font-black font-mono text-white uppercase tracking-tighter">Asset Repository</h2>
        <div className="flex gap-2">
          {['all', 'image', 'link'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black font-mono uppercase transition-all ${filter === f ? 'bg-stone-100 text-stone-900' : 'bg-stone-800 text-stone-400 hover:text-white'}`}
            >
              {f}s
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {assets.map(note => (
          <div key={note.id} className="group relative bg-stone-900 rounded-2xl overflow-hidden border border-stone-800 hover:border-stone-700 transition-all shadow-xl">
            {note.metadata?.imageData ? (
              <div className="aspect-square w-full relative">
                <img src={note.metadata.imageData} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                  <p className="text-[10px] text-white font-mono line-clamp-2">{note.content}</p>
                </div>
              </div>
            ) : (
              <div className="aspect-square w-full p-6 flex flex-col justify-between bg-stone-800">
                <span className="text-4xl">🔗</span>
                <div className="space-y-2">
                  <p className="text-[10px] text-stone-300 font-mono line-clamp-3">{note.content}</p>
                  <div className="flex flex-col gap-1">
                    {note.metadata?.urls?.map((url, i) => (
                      <a key={i} href={url} target="_blank" className="text-[9px] text-blue-400 truncate hover:underline">{url}</a>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <button 
              onClick={() => onDelete(note.id)}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        ))}
        {assets.length === 0 && (
          <div className="col-span-full py-24 text-center border-2 border-dashed border-stone-800 rounded-3xl">
            <p className="text-[10px] font-mono text-stone-600 uppercase tracking-widest">Repository is currently empty</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetVault;
