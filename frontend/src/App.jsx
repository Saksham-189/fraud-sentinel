import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { ThemeProvider } from "./context/ThemeContext"
import LocalIconProvider from "./components/LocalIcons"
import Landing from "./pages/Landing"
import Auth, { AuthGuard } from "./pages/Auth"
import Dashboard from "./pages/Dashboard"
import Profile from "./pages/Profile"
import Pricing from "./pages/Pricing"
import Analyze from "./pages/Analyze"
import Solutions from "./pages/Solutions"
import Developers from "./pages/Developers"
import History from "./pages/History"
import Settings from "./pages/Settings"
import Visualization from "./pages/Visualization"
import About from "./pages/About"
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LocalIconProvider>
          <BrowserRouter>
            <Routes>
            {}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/register" element={<Auth />} />
            <Route path="/forgot-password" element={<Auth />} />
            <Route path="/reset-password" element={<Auth />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/solutions" element={<Solutions />} />
            <Route path="/developers" element={<Developers />} />
            <Route path="/about" element={<About />} />
            {}
            <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
            <Route path="/analyze" element={<AuthGuard><Analyze /></AuthGuard>} />
            <Route path="/history" element={<AuthGuard><History /></AuthGuard>} />
            <Route path="/settings" element={<AuthGuard><Settings /></AuthGuard>} />
            <Route path="/visualization" element={<AuthGuard><Visualization /></AuthGuard>} />
            <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
            </Routes>
          </BrowserRouter>
        </LocalIconProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
export default App
