import React, { useState, useEffect, useCallback } from 'react';
import { Plus, X, Hash, Folder, Edit2, Trash2, Save, Eye, EyeOff } from 'lucide-react';

export default function DiaryTagManager({ diaries, onBack }) {
  const [tags, setTags] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [activeTab, setActiveTab] = useState('tags'); // 'tags' or 'categories'
  const [editingTag, setEditingTag] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [tagColors] = useState([
    '#FFD700', '#FF6B6B', '#4ECDC4', '#95E1D3', '#F38181',
    '#AA96DA', '#FCBAD3', '#FFFFD2', '#A8E6CF', '#FFD3B6'
  ]);

  // 提取标签
  const extractTags = useCallback(() => {
    const tagsMap = {};
    diaries.forEach(diary => {
      const tagMatches = diary.filename.match(/#(\w+)/g);
      if (tagMatches) {
        tagMatches.forEach(tag => {
          const tagName = tag.slice(1);
          if (!tagsMap[tagName]) {
            tagsMap[tagName] = {
              name: tagName,
              count: 0,
              color: tagColors[Object.keys(tagsMap).length % tagColors.length],
              createdAt: new Date().toLocaleDateString(),
            };
          }
          tagsMap[tagName].count++;
        });
      }
    });
    return Object.values(tagsMap);
  }, [diaries, tagColors]);

  // 提取分类
  const extractCategories = useCallback(() => {
    const categoriesSet = new Set();
    diaries.forEach(diary => {
      // 假设分类以 [Category] 格式标注
      const categoryMatch = diary.filename.match(/\[(生活|工作|学习|感悟|旅行|美食|技术|其他)\]/);
      if (categoryMatch) {
        categoriesSet.add(categoryMatch[1]);
      }
    });
    return Array.from(categoriesSet).map(name => ({
      name,
      count: diaries.filter(d => d.filename.includes(`[${name}]`)).length,
      icon: getCategoryIcon(name),
    }));
  }, [diaries]);

  useEffect(() => {
    setTags(extractTags());
    setCategories(extractCategories());
  }, [extractTags, extractCategories]);

  const getCategoryIcon = (categoryName) => {
    const icons = {
      '生活': '🏠',
      '工作': '💼',
      '学习': '📚',
      '感悟': '💭',
      '旅行': '✈️',
      '美食': '🍽️',
      '技术': '💻',
      '其他': '📝'
    };
    return icons[categoryName] || '📁';
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.some(t => t.name === newTag)) {
      const newTagObj = {
        name: newTag,
        count: 0,
        color: tagColors[tags.length % tagColors.length],
        createdAt: new Date().toLocaleDateString(),
      };
      setTags([...tags, newTagObj]);
      setNewTag('');
    }
  };

  const handleDeleteTag = (tagName) => {
    setTags(tags.filter(t => t.name !== tagName));
    setShowDeleteConfirm(null);
  };

  const handleEditTagColor = (tagName, newColor) => {
    setTags(tags.map(t =>
      t.name === tagName ? { ...t, color: newColor } : t
    ));
  };

  // 排序标签（按使用次数）
  const sortedTags = [...tags].sort((a, b) => b.count - a.count);
  const sortedCategories = [...categories].sort((a, b) => b.count - a.count);

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">🏷️ 标签与分类</h1>
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 border-2 border-black bg-white hover:bg-gray-100 font-bold"
          >
            返回
          </button>
        )}
      </div>

      {/* 标签页选择 */}
      <div className="flex gap-2 border-b-2 border-gray-300">
        <button
          onClick={() => setActiveTab('tags')}
          className={`px-6 py-3 font-bold text-lg border-b-4 transition ${
            activeTab === 'tags'
              ? 'border-black text-black'
              : 'border-transparent text-gray-600 hover:text-black'
          }`}
        >
          <Hash className="inline mr-2" size={20} /> 标签管理
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-6 py-3 font-bold text-lg border-b-4 transition ${
            activeTab === 'categories'
              ? 'border-black text-black'
              : 'border-transparent text-gray-600 hover:text-black'
          }`}
        >
          <Folder className="inline mr-2" size={20} /> 分类浏览
        </button>
      </div>

      {/* 标签管理标签页 */}
      {activeTab === 'tags' && (
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto">
          {/* 添加新标签 */}
          <div className="border-2 border-black bg-blue-50 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">➕ 创建新标签</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="输入标签名称（英文或中文）"
                className="flex-1 px-4 py-2 border-2 border-black rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAddTag}
                className="px-6 py-2 border-2 border-black bg-yellow-200 hover:bg-yellow-300 font-bold rounded-lg transition flex items-center gap-2"
              >
                <Plus size={20} /> 添加
              </button>
            </div>
          </div>

          {/* 标签列表 */}
          <div className="border-2 border-black bg-white rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">📌 标签列表 ({sortedTags.length})</h2>
            
            {sortedTags.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <p className="text-lg">还没有标签，创建一个吧！</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedTags.map(tag => (
                  <div
                    key={tag.name}
                    className="flex items-center justify-between p-4 border-2 border-gray-300 hover:border-black rounded-lg transition group"
                    style={{ backgroundColor: `${tag.color}20` }}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="w-4 h-4 rounded-full border-2 border-black"
                        style={{ backgroundColor: tag.color }}
                      />
                      <div>
                        <h3 className="font-bold text-lg">#{tag.name}</h3>
                        <p className="text-sm text-gray-600">
                          创建于 {tag.createdAt} · 使用 {tag.count} 次
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* 颜色选择器 */}
                      <div className="hidden group-hover:flex gap-1 flex-wrap w-32 absolute right-0 bottom-full bg-white border-2 border-black rounded-lg p-2 z-10">
                        {tagColors.map(color => (
                          <button
                            key={color}
                            onClick={() => handleEditTagColor(tag.name, color)}
                            className={`w-6 h-6 rounded-full border-2 ${
                              tag.color === color ? 'border-black' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>

                      {/* 删除按钮 */}
                      <button
                        onClick={() => setShowDeleteConfirm(tag.name)}
                        className="p-2 hover:bg-red-200 rounded-lg transition"
                        title="删除标签"
                      >
                        <Trash2 size={18} className="text-red-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 标签云 */}
          <div className="border-2 border-black bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">☁️ 标签云</h2>
            <div className="flex flex-wrap gap-3">
              {sortedTags.map((tag, idx) => {
                const sizes = ['text-xl', 'text-lg', 'text-base', 'text-sm', 'text-xs'];
                return (
                  <button
                    key={tag.name}
                    className={`px-4 py-2 border-2 border-black rounded-full font-bold transition hover:scale-110 ${sizes[Math.min(idx, 4)]}`}
                    style={{ backgroundColor: tag.color, opacity: 0.8 }}
                  >
                    #{tag.name} ({tag.count})
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 分类浏览标签页 */}
      {activeTab === 'categories' && (
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto">
          {/* 默认分类提示 */}
          <div className="border-2 border-black bg-yellow-50 p-4 rounded-lg text-sm">
            <p>
              💡 系统会自动从日记文件名中识别分类标记（如 [生活], [工作], [学习] 等）
            </p>
          </div>

          {/* 分类列表 */}
          {sortedCategories.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center py-12 text-gray-600">
                <p className="text-xl">还没有分类日记</p>
                <p className="text-sm mt-2">在日记文件名中添加 [分类名] 来分类你的日记</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedCategories.map(category => (
                <div
                  key={category.name}
                  className="border-2 border-black bg-white p-6 rounded-lg hover:shadow-lg transition cursor-pointer hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl">{category.icon}</span>
                    <div>
                      <h3 className="text-2xl font-bold">{category.name}</h3>
                      <p className="text-sm text-gray-600">{category.count} 篇日记</p>
                    </div>
                  </div>

                  {/* 进度条 */}
                  <div className="mt-4 bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all"
                      style={{
                        width: `${(category.count / Math.max(...sortedCategories.map(c => c.count), 1)) * 100}%`
                      }}
                    />
                  </div>

                  <button className="mt-4 w-full px-4 py-2 border-2 border-black bg-yellow-100 hover:bg-yellow-200 font-bold rounded-lg transition">
                    查看此分类
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 推荐分类 */}
          <div className="border-2 border-black bg-gradient-to-r from-cyan-50 to-blue-50 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">📚 推荐分类</h2>
            <p className="text-sm mb-4 text-gray-700">
              在日记文件名中使用以下分类标签来更好地组织你的日记：
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {['生活', '工作', '学习', '感悟', '旅行', '美食', '技术', '其他'].map(cat => (
                <div key={cat} className="text-center p-3 bg-white border-2 border-gray-300 rounded-lg">
                  <span className="text-2xl">{getCategoryIcon(cat)}</span>
                  <p className="font-bold mt-1 text-sm">[{cat}]</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white border-4 border-black p-6 rounded-lg max-w-sm">
            <h2 className="text-2xl font-bold mb-4">⚠️ 确认删除</h2>
            <p className="mb-4 font-bold">确定要删除标签 "#{showDeleteConfirm}" 吗？</p>
            <p className="text-sm text-gray-600 mb-6">（此操作不会删除相关日记，只是删除标签管理）</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDeleteTag(showDeleteConfirm)}
                className="flex-1 px-4 py-2 border-2 border-black bg-red-200 hover:bg-red-300 font-bold rounded-lg transition"
              >
                删除
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border-2 border-black bg-gray-200 hover:bg-gray-300 font-bold rounded-lg transition"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
