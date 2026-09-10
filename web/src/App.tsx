import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'

function Home() {
  return (
    <div className="app">
      <header>
        <h1>AgriConnect Uganda</h1>
        <p>Manage your farm. Understand your finances. Find better market opportunities.</p>
      </header>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
      </nav>
      <main>
        <p>Welcome to AgriConnect. Platform infrastructure is being set up.</p>
      </main>
    </div>
  )
}

function Placeholder() {
  return (
    <div className="app">
      <nav>
        <Link to="/">Home</Link>
      </nav>
      <main>
        <p>This page is under construction.</p>
      </main>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Placeholder />} />
        <Route path="/register" element={<Placeholder />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App