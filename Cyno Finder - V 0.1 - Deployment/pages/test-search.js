import SystemSearchCards from '../components/SystemSearchCards';

export default function TestPage() {
  const handleFindCynos = (systems) => {
    console.log('Finding cynos for systems:', systems);
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#0e1a2b',
      padding: '2rem'
    }}>
      <SystemSearchCards 
        onFindCynos={handleFindCynos}
        isSearching={false}
      />
    </div>
  );
}