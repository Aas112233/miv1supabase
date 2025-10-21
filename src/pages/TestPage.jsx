import React from 'react';
import AuthTest from '../components/AuthTest';
import DatabaseTest from '../components/DatabaseTest';

const TestPage = () => {
  return (
    <div>
      <header style={{ 
        backgroundColor: '#2196f3', 
        color: 'white', 
        padding: '20px', 
        textAlign: 'center' 
      }}>
        <h1>Investment Club Accounting System</h1>
        <p>Supabase Migration Test Page</p>
      </header>
      
      <main style={{ padding: '20px' }}>
        <section style={{ marginBottom: '40px' }}>
          <h2>Authentication Test</h2>
          <AuthTest />
        </section>
        
        <hr style={{ margin: '30px 0' }} />
        
        <section>
          <h2>Database Test</h2>
          <DatabaseTest />
        </section>
      </main>
      
      <footer style={{ 
        textAlign: 'center', 
        padding: '20px', 
        backgroundColor: '#f5f5f5', 
        marginTop: '30px' 
      }}>
        <p>Supabase Migration in Progress</p>
      </footer>
    </div>
  );
};

export default TestPage;