import ThreeCanvas from './components/ThreeCanvas';

export default function App() {
  return (
    <div className="app-container">
      <header className="hero" style={{ position: 'absolute', zIndex: 10, padding: '2rem', pointerEvents: 'none' }}>
        <p className="subtitle" style={{ color: '#00f0ff', fontFamily: 'sans-serif', margin: 0 }}>3D • Design • Musique</p>
        <h1 style={{ color: 'white', fontFamily: 'sans-serif', fontSize: '3rem', margin: '0.5rem 0 0 0' }}>Portfolio</h1>
      </header>

      {/* Scène 3D interactive */}
      <ThreeCanvas />
    </div>
  );
}