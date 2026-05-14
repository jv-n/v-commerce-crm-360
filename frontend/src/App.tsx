import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import { AuthProvider } from './contexts/auth/AuthContext'
import AppFrame from './components/organisms/AppFrame'
import ProtectedRoute from './components/organisms/ProtectedRoute'
import Login from './Pages/Login'
import Home from './Pages/Home'
import Contacts from './Pages/Contacts'
import ContactDetail from './Pages/Contacts/ContactDetail'
import Sales from './Pages/Sales'
import Products from './Pages/Products'
import Chat from './Pages/Chat'
import Tickets from './Pages/Tickets'
import Unauthorized from './Pages/Unauthorized'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />}/>
          <Route element={<ProtectedRoute />}>
            <Route element={<AppFrame />}>
              <Route path="/" element={<Home />} />
              <Route element={<ProtectedRoute allowedRoles={["admin", "sales"]}/>}>
                <Route path="/contacts" element={<Contacts />} />
                <Route path="/contacts/:id" element={<ContactDetail />} />
                <Route path="/sales" element={<Sales />} />
              </Route>
              <Route path="/products" element={<Products />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/tickets" element={<Tickets />} /> 
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
