/**
 * Jade Emporium Admin - Users Management
 * Design: 深色側邊欄 + 白色內容區域
 * 數據來源: 完全從後端 API 獲取真實數據
 */

import { useState } from 'react';
import { Search, Eye, Ban, CheckCircle, Users, X, Shield, User as UserIcon } from 'lucide-react';
import { AdminLayout } from './Dashboard';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

function UserDetailModal({ user, onClose }: { user: any; onClose: () => void }) {
  const { language } = useLanguage();
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">{language === 'zh' ? '用戶檔案' : 'User Profile'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center border-2 border-gray-100">
              <span className="text-red-600 font-bold text-xl">
                {(user.name || user.email || '?').charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">{user.name || 'Anonymous'}</h3>
              <p className="text-sm text-gray-500">{user.email || '-'}</p>
              <div className="flex gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {user.role === 'admin' ? (language === 'zh' ? '管理員' : 'Admin') : (language === 'zh' ? '用戶' : 'User')}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            <p>{language === 'zh' ? '加入時間' : 'Member since'}: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</p>
            {user.openId && <p className="mt-1 text-xs text-gray-400">OpenID: {user.openId}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // 從後端 API 獲取真實用戶數據
  const { data: userList = [], isLoading } = trpc.adminUsers.list.useQuery();
  const utils = trpc.useUtils();

  const updateRole = trpc.adminUsers.updateRole.useMutation({
    onSuccess: () => {
      utils.adminUsers.list.invalidate();
      toast.success(language === 'zh' ? '用戶角色已更新' : 'User role updated');
    },
    onError: () => {
      toast.error(language === 'zh' ? '更新失敗' : 'Update failed');
    }
  });

  const filtered = userList.filter((u: any) => {
    const matchSearch = (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = filterRole === 'All' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const adminCount = userList.filter((u: any) => u.role === 'admin').length;
  const userCount = userList.filter((u: any) => u.role === 'user').length;

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{language === 'zh' ? '用戶管理' : 'Users'}</h1>
        <p className="text-gray-500 text-sm mt-1">{userList.length} {language === 'zh' ? '個已註冊的用戶' : 'registered users'}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users size={18} className="text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{userList.length}</p>
              <p className="text-xs text-gray-500">{language === 'zh' ? '總用戶' : 'Total Users'}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Shield size={18} className="text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{adminCount}</p>
              <p className="text-xs text-gray-500">{language === 'zh' ? '管理員' : 'Admins'}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <UserIcon size={18} className="text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{userCount}</p>
              <p className="text-xs text-gray-500">{language === 'zh' ? '普通用戶' : 'Regular Users'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'zh' ? '按名稱或電子郵件搜索...' : 'Search by name or email...'}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-red-400"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400"
          >
            <option value="All">{language === 'zh' ? '所有角色' : 'All Roles'}</option>
            <option value="admin">{language === 'zh' ? '管理員' : 'Admin'}</option>
            <option value="user">{language === 'zh' ? '用戶' : 'User'}</option>
          </select>
          <span className="text-sm text-gray-500">{filtered.length} {language === 'zh' ? '個結果' : 'results'}</span>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-gray-400">
            {language === 'zh' ? '加載中...' : 'Loading...'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">{language === 'zh' ? '用戶' : 'User'}</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">{language === 'zh' ? '電子郵件' : 'Email'}</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">{language === 'zh' ? '角色' : 'Role'}</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">{language === 'zh' ? '加入時間' : 'Joined'}</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">{language === 'zh' ? '操作' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((user: any) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center">
                          <span className="text-red-600 font-bold text-sm">
                            {(user.name || user.email || '?').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-700">{user.name || 'Anonymous'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">{user.email || '-'}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {user.role === 'admin' ? (language === 'zh' ? '管理員' : 'Admin') : (language === 'zh' ? '用戶' : 'User')}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                          title={language === 'zh' ? '查看' : 'View'}
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <Users size={40} className="mx-auto mb-3 opacity-30" />
                <p>{language === 'zh' ? '暫無用戶' : 'No users found'}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedUser && (
        <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </AdminLayout>
  );
}
