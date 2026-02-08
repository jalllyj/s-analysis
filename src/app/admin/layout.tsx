import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <nav className="bg-black text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold">
                股票分析系统
              </Link>
              <span className="mx-4 text-gray-400">|</span>
              <span className="text-gray-300">管理后台</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/topup"
                className="text-white hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium"
              >
                充值审核
              </Link>
              <Link
                href="/"
                className="bg-white text-black px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-100"
              >
                返回首页
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容区域 */}
      <main className="py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
