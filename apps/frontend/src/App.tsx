import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicRoute } from "./components/PublicRoute";
import { AuthProvider } from "./context/AuthContext";
import { CreateRoom } from "./pages/CreateRoom";
import { Dashboard } from "./pages/Dashboard";
import { History } from "./pages/History";
import { JoinRoom } from "./pages/JoinRoom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { Room } from "./pages/Room";
import { RoomList } from "./pages/RoomList";
import { NotFound } from "./pages/NotFound";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/rooms"
          element={
            <ProtectedRoute>
              <Layout>
                <RoomList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <Layout>
                <History />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/room/:code"
          element={
            <ProtectedRoute>
              <Layout>
                <Room />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-room"
          element={
            <ProtectedRoute>
              <Layout>
                <CreateRoom />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/join-room"
          element={
            <ProtectedRoute>
              <Layout>
                <JoinRoom />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route path="/join" element={<Navigate to="/join-room" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
