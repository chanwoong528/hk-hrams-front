import { navigation, type Page } from "@/utils";

export default function SidebarContent({
  currentPage,
  setCurrentPage,
  setSidebarOpen,
}: {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  setSidebarOpen: (open: boolean) => void;
}) {
  return (
    <div className='flex h-full flex-col'>
      <div className='p-6 border-b'>
        <h1 className='text-blue-600'>HRAMS</h1>
        <p className='text-sm text-gray-600 mt-1'>인사 성과 관리 시스템</p>
      </div>
      <nav className='flex-1 p-4 space-y-1'>
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                setCurrentPage(item.id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                currentPage === item.id
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}>
              <Icon className='w-5 h-5' />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>
      <div className='p-4 border-t'>
        <div className='flex items-center gap-3 p-3 rounded-lg bg-gray-50'>
          <div className='w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white'>
            관
          </div>
          <div>
            <div>관리자</div>
            <div className='text-sm text-gray-600'>admin@company.com</div>
          </div>
        </div>
      </div>
    </div>
  );
}
