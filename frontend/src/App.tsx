import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import AppFrame from './components/organisms/AppFrame'
import Home from './Pages/Home'
import Contacts from './Pages/Contacts'
import Sales from './Pages/Sales'

function App() {

  return (
    <>
      <Router>
        <Routes>
          <Route element={<AppFrame />}>
            <Route path="/" element={<Home />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/sales" element={<Sales />} /> 
          </Route>
        </Routes>
      </Router>
    </>
  )
}

export default App
