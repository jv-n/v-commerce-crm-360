import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import AppFrame from './components/organisms/AppFrame'
import Home from './Pages/Home'
import Contacts from './Pages/Contacts'
import Sales from './Pages/Sales'
import Products from './Pages/Products'
import Chat from './Pages/Chat'
import Tickets from './Pages/Tickets'

function App() {

  return (
    <>
      <Router>
        <Routes>
          <Route element={<AppFrame />}>
            <Route path="/" element={<Home />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/products" element={<Products />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/tickets" element={<Tickets />} />
          </Route>
        </Routes>
      </Router>
    </>
  )
}

export default App
