import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout.tsx";
import { ProtectedRoute } from "./components/ProtectedRoute.tsx";
import { PublicRoute } from "./components/PublicRoute.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { CreateRoom } from "./pages/CreateRoom.tsx";
import { Dashboard } from "./pages/Dashboard.tsx";
import { History } from "./pages/History.tsx";
import { JoinRoom } from "./pages/JoinRoom.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import Room from "./pages/Room.tsx";
import { RoomList } from "./pages/RoomList.tsx";

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
      </Routes>
    </AuthProvider>
  );
}

export default App;
