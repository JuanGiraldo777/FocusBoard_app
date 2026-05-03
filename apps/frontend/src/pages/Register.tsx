import { RegisterForm } from "../components/RegisterForm";

function Register() {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Crear Cuenta</h2>
        <RegisterForm />
      </div>
    </div>
  );
}

export default Register;
