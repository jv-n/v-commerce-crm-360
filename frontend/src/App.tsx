import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import AppFrame from './components/organisms/AppFrame'
import Home from './Pages/Home'

function App() {

  return (
    <>
      <Router>
        <Routes>
          <Route element={<AppFrame />}>
            <Route path="/" element={<Home />} />
          </Route>
        </Routes>
      </Router>
    </>
  )
}

export default App
