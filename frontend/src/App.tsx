import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import AppFrame from './components/organisms/AppFrame'
import Home from './Pages/Home'
import Contacts from './Pages/Contacts'

function App() {

  return (
    <>
      <Router>
        <Routes>
          <Route element={<AppFrame />}>
            <Route path="/" element={<Home />} />
            <Route path="/contacts" element={<Contacts />} />
          </Route>
        </Routes>
      </Router>
    </>
  )
}

export default App
