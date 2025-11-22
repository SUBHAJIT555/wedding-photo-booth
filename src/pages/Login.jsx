import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BgImage from "../assets/images/home/Bg.png";
import FlowerBgImage from "../assets/images/home/Flower-Bg.png";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      setLoading(false);
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      let authUrl;

      if (apiUrl) {
        const baseUrl = apiUrl.replace(/\/+$/, "");
        authUrl = `${baseUrl}/auth.php`;
      } else {
        // console.log("No API URL found, using relative path");
        authUrl = "/auth.php";
      }

      const response = await fetch(authUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important for session cookies
        body: JSON.stringify({
          username: username.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Invalid username or password");
        setLoading(false);
        return;
      }

      // Store authentication status
      sessionStorage.setItem("authenticated", "true");
      sessionStorage.setItem("username", data.data.username || username);

      // Navigate to home
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
      setError("Failed to connect to server. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex overflow-hidden relative flex-col justify-center items-center w-full h-screen min-h-screen cursor-none">
      {/* Background with Floral Pattern */}
      <div
        className="absolute top-0 left-0 w-full h-full z-[1]"
        style={{
          backgroundImage: `url(${BgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Floral overlay */}
        <div
          className="absolute top-0 left-0 w-full h-full opacity-90"
          style={{
            backgroundImage: `url(${FlowerBgImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
      </div>

      {/* Main Content Container */}
      <div className="relative z-[2] flex flex-col items-center justify-center w-full px-4">
        <div className="w-full max-w-md p-8 bg-white bg-opacity-95 rounded-2xl shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-krylon text-[#5d4037] mb-2">
              Photo Booth
            </h1>
            <p className="text-lg text-gray-600">Admin Login</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-semibold text-gray-700 mb-2 cursor-none"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError("");
                }}
                placeholder="Enter username"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#e91e63] focus:outline-none text-lg cursor-none"
                autoFocus
                disabled={loading}
                autoComplete="username"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700 mb-2 cursor-none"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="Enter password"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#e91e63] focus:outline-none text-lg cursor-none"
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#e91e63] text-white rounded-lg font-semibold hover:bg-[#c2185b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-none"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
