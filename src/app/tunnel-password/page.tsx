'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TunnelPasswordPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const router = useRouter();

  // 隧道密码
  const TUNNEL_PASSWORD = '115.190.93.94';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === TUNNEL_PASSWORD) {
      // 密码正确，设置 localStorage 并返回上一页
      localStorage.setItem('tunnel_password', password);
      router.back();
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 border border-gray-200">
        <div className="mb-6 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">安全验证</h1>
          <p className="text-gray-600 text-sm">
            为了保护您的账户安全，请输入隧道密码
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              隧道密码
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              placeholder="请输入密码"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-all ${
                error
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-black'
              }`}
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">密码错误，请重试</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-black text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            继续
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            密码提示：服务器的公网 IP 地址
          </p>
        </div>
      </div>
    </div>
  );
}
