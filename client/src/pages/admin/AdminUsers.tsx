/**
 * ShopMart Admin - Users Management
 * Design: 深色側邊欄 + 白色內容區域
 */

import { useState } from 'react';
import { Search, Eye, Ban, CheckCircle, Users, X } from 'lucide-react';
import { AdminLayout } from './Dashboard';
import { users as initialUsers } from '@/lib/data';
import type { User } from '@/lib/data';
import { toast } from 'sonner';

function UserDetailModal({ user, onClose }: { user: User; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">User Profile</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-4 mb-5">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-100"
              onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=E93323&color=fff`; }}
            />
            <div>
              <h3 className="font-semibold text-gray-800">{user.name}</h3>
              <p className="text-sm text-gray-500">{user.email}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${
                user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {user.status}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-800">{user.orders}</p>
              <p className="text-xs text-gray-500 mt-1">Total Orders</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-red-500">${user.spent.toFixed(0)}</p>
              <p className="text-xs text-gray-500 mt-1">Total Spent</p>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            <p>Member since: {user.createdAt}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const [userList, setUserList] = useState(initialUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const filtered = userList.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'All' || u.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleToggleBan = (id: number) => {
    setUserList(prev => prev.map(u => {
      if (u.id === id) {
        const newStatus = u.status === 'active' ? 'banned' : 'active';
        toast.success(`User ${newStatus === 'banned' ? 'banned' : 'unbanned'} successfully`);
        return { ...u, status: newStatus };
      }
      return u;
    }));
  };

  const activeCount = userList.filter(u => u.status === 'active').length;
  const bannedCount = userList.filter(u => u.status === 'banned').length;

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Users</h1>
        <p className="text-gray-500 text-sm mt-1">{userList.length} registered users</p>
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
              <p className="text-xs text-gray-500">Total Users</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle size={18} className="text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{activeCount}</p>
              <p className="text-xs text-gray-500">Active Users</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Ban size={18} className="text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{bannedCount}</p>
              <p className="text-xs text-gray-500">Banned Users</p>
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
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-red-400"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400"
          >
            <option value="All">All Status</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
          </select>
          <span className="text-sm text-gray-500">{filtered.length} results</span>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">User</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Email</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Orders</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Total Spent</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Joined</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-9 h-9 rounded-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=E93323&color=fff&size=80`; }}
                      />
                      <span className="text-sm font-medium text-gray-700">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500">{user.email}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{user.orders}</td>
                  <td className="px-5 py-3">
                    <span className="text-sm font-semibold text-red-500">${user.spent.toFixed(2)}</span>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500">{user.createdAt}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                        title="View"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => handleToggleBan(user.id)}
                        className={`p-1.5 rounded transition-colors ${
                          user.status === 'active'
                            ? 'text-red-500 hover:bg-red-50'
                            : 'text-green-500 hover:bg-green-50'
                        }`}
                        title={user.status === 'active' ? 'Ban' : 'Unban'}
                      >
                        {user.status === 'active' ? <Ban size={14} /> : <CheckCircle size={14} />}
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
              <p>No users found</p>
            </div>
          )}
        </div>
      </div>

      {selectedUser && (
        <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </AdminLayout>
  );
}
