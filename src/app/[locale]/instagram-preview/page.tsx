'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface InstagramMedia {
  id: string;
  caption?: string;
  media_url: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  timestamp: string;
  permalink?: string;
  thumbnail_url?: string;
}

export default function InstagramPreviewPage() {
  const [media, setMedia] = useState<InstagramMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/instagram/media?limit=20');
      const data = await res.json();

      if (data.success) {
        setMedia(data.data.media);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to fetch media');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const getImageUrl = (item: InstagramMedia) => {
    if (item.media_type === 'VIDEO') {
      return item.thumbnail_url || item.media_url;
    }
    return item.media_url;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading Instagram media...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-secondary-900 text-white flex items-center justify-center">
        <div className="text-xl text-error-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Instagram Media Preview</h1>
          <div className="flex items-center gap-4">
            <span className="text-secondary-400">
              {selectedIds.size} selected
            </span>
            <button
              className="px-4 py-2 bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
              disabled={selectedIds.size === 0}
              onClick={() => {
                alert(`Import ${selectedIds.size} items:\n${Array.from(selectedIds).join('\n')}`);
              }}
            >
              Import Selected
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {media.map((item) => (
            <div
              key={item.id}
              className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer group ${
                selectedIds.has(item.id) ? 'ring-4 ring-primary-500' : ''
              }`}
              onClick={() => toggleSelect(item.id)}
            >
              {/* Image */}
              <img
                src={getImageUrl(item)}
                alt={item.caption || 'Instagram media'}
                className="w-full h-full object-cover"
              />

              {/* Overlay */}
              <div className={`absolute inset-0 transition-opacity ${
                selectedIds.has(item.id)
                  ? 'bg-primary-500/30'
                  : 'bg-black/0 group-hover:bg-black/40'
              }`} />

              {/* Media type badge */}
              {item.media_type !== 'IMAGE' && (
                <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs">
                  {item.media_type === 'VIDEO' ? '🎬 Video' : '📷 Album'}
                </div>
              )}

              {/* Selection indicator */}
              <div className={`absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                selectedIds.has(item.id)
                  ? 'bg-primary-500 border-primary-500'
                  : 'border-white/70 group-hover:border-white'
              }`}>
                {selectedIds.has(item.id) && (
                  <span className="text-white text-sm">✓</span>
                )}
              </div>

              {/* Caption preview */}
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-sm text-white line-clamp-2">
                  {item.caption?.slice(0, 100) || 'No caption'}
                </p>
                <p className="text-xs text-secondary-400 mt-1">
                  {new Date(item.timestamp).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Debug info */}
        <div className="mt-8 p-4 bg-secondary-800 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Debug Info</h3>
          <p>Total items: {media.length}</p>
          <p>Selected: {Array.from(selectedIds).join(', ') || 'None'}</p>
        </div>
      </div>
    </div>
  );
}
