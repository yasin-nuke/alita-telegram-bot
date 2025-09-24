export default function Home() {
  return (
    <div style={{ 
      padding: '50px 20px', 
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif',
      direction: 'rtl',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white'
    }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>🤖 ربات آلیتا فعال است</h1>
      <p style={{ fontSize: '1.2rem', marginBottom: '30px' }}>دستیار هوشمند دانشگاهی با قابلیت‌های پیشرفته</p>
      
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        padding: '30px',
        borderRadius: '20px',
        backdropFilter: 'blur(10px)',
        maxWidth: '500px',
        margin: '0 auto'
      }}>
        <h3>🎯 دستورات اصلی:</h3>
        <p>• آلیتا کمک - راهنمایی</p>
        <p>• آلیتا [سوال] - پرسش و پاسخ</p>
        <p>• آلیتا کلاس امروز - برنامه درسی</p>
        
        <h3 style={{ marginTop: '20px' }}>🔗 لینک‌های مفید:</h3>
        <p>
          <a href="/admin-panel.html" style={{ color: '#4ECDC4', textDecoration: 'none' }}>
            🎛️ پنل مدیریت
          </a>
        </p>
      </div>
    </div>
  );
}