export default function Home() {
  return (
    <div style={{ 
      padding: '50px 20px', 
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif',
      direction: 'rtl'
    }}>
      <h1 style={{ color: '#2d3748' }}>🤖 ربات آلیتا فعال است</h1>
      <p style={{ color: '#4a5568', fontSize: '18px' }}>
        ربات دانشگاهی با قابلیت‌های هوش مصنوعی
      </p>
      <div style={{ 
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#f7fafc',
        borderRadius: '10px',
        display: 'inline-block'
      }}>
        <p>✅ وبهوک تلگرام: /api/telegram</p>
        <p>✅ پنل مدیریت اختصاصی</p>
        <p>✅ پاسخ‌های هوشمند</p>
      </div>
    </div>
  );
}