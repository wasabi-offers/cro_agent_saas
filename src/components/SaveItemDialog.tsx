"use client";

import { useState, useEffect } from "react";
import { X, Plus, Tag, Folder } from "lucide-react";
import { Category, categoryStorage } from "@/lib/saved-items";

interface SaveItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; categoryId: string; url?: string }) => void;
  type: 'funnel' | 'landing';
  defaultName?: string;
  defaultUrl?: string;
}

export default function SaveItemDialog({
  isOpen,
  onClose,
  onSave,
  type,
  defaultName = '',
  defaultUrl = '',
}: SaveItemDialogProps) {
  const [name, setName] = useState(defaultName);
  const [url, setUrl] = useState(defaultUrl);
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#7c5cff');

  useEffect(() => {
    if (isOpen) {
      const cats = categoryStorage.getAll();
      setCategories(cats);
      if (cats.length > 0 && !categoryId) {
        setCategoryId(cats[0].id);
      }
    }
  }, [isOpen]);

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) return;

    const newCategory: Category = {
      id: `cat_${Date.now()}`,
      name: newCategoryName.trim(),
      color: newCategoryColor,
      createdAt: new Date().toISOString(),
    };

    categoryStorage.save(newCategory);
    setCategories([...categories, newCategory]);
    setCategoryId(newCategory.id);
    setNewCategoryName('');
    setShowNewCategory(false);
  };

  const handleSave = () => {
    if (!name.trim() || !categoryId) return;
    onSave({
      name: name.trim(),
      categoryId,
      url: url.trim() || undefined,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl max-w-lg w-full p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-[20px] font-semibold text-[#fafafa]">
              Save {type === 'funnel' ? 'Funnel' : 'Landing Page'}
            </h2>
            <p className="text-[13px] text-[#888888] mt-1">
              Organize your {type === 'funnel' ? 'funnels' : 'pages'} with custom categories
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#1a1a1a] transition-colors"
          >
            <X className="w-5 h-5 text-[#888888]" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-[13px] text-[#888888] mb-2">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`My ${type === 'funnel' ? 'Checkout Funnel' : 'Landing Page'}`}
              className="w-full px-4 py-3 bg-[#111111] border border-[#2a2a2a] rounded-xl text-[#fafafa] text-[15px] placeholder:text-[#666666] focus:outline-none focus:border-[#7c5cff] transition-all"
            />
          </div>

          {/* URL (optional) */}
          <div>
            <label className="block text-[13px] text-[#888888] mb-2">
              URL (optional)
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-4 py-3 bg-[#111111] border border-[#2a2a2a] rounded-xl text-[#fafafa] text-[15px] placeholder:text-[#666666] focus:outline-none focus:border-[#7c5cff] transition-all"
            />
          </div>

          {/* Category */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[13px] text-[#888888]">
                Category *
              </label>
              <button
                onClick={() => setShowNewCategory(!showNewCategory)}
                className="flex items-center gap-1.5 text-[12px] text-[#7c5cff] hover:text-[#a78bff] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                New Category
              </button>
            </div>

            {showNewCategory ? (
              <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-4 space-y-3">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Category name"
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-[#fafafa] text-[14px] placeholder:text-[#666666] focus:outline-none focus:border-[#7c5cff] transition-all"
                />
                <div className="flex items-center gap-3">
                  <label className="text-[12px] text-[#888888]">Color:</label>
                  <div className="flex gap-2">
                    {['#7c5cff', '#00d4aa', '#f59e0b', '#ff6b6b', '#3b82f6', '#ec4899'].map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewCategoryColor(color)}
                        className={`w-7 h-7 rounded-lg transition-all ${
                          newCategoryColor === color
                            ? 'ring-2 ring-offset-2 ring-offset-[#111111] scale-110'
                            : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: color, ringColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateCategory}
                    className="flex-1 px-3 py-2 bg-[#7c5cff] text-white rounded-lg text-[13px] font-medium hover:bg-[#6b4ee0] transition-colors"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setShowNewCategory(false)}
                    className="px-3 py-2 bg-[#1a1a1a] text-[#888888] rounded-lg text-[13px] hover:bg-[#2a2a2a] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryId(cat.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                      categoryId === cat.id
                        ? 'bg-[#7c5cff] text-white'
                        : 'bg-[#111111] text-[#888888] border border-[#2a2a2a] hover:border-[#7c5cff]/50'
                    }`}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-[#1a1a1a] text-[#888888] rounded-xl font-medium text-[15px] hover:bg-[#2a2a2a] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || !categoryId}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-[#7c5cff] to-[#00d4aa] text-white rounded-xl font-medium text-[15px] hover:shadow-lg hover:shadow-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save {type === 'funnel' ? 'Funnel' : 'Page'}
          </button>
        </div>
      </div>
    </div>
  );
}
