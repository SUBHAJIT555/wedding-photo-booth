import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../component/Logo";
import { ShinyButton } from "../component/shiny-button";
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
    //  sessionStorage.setItem("authenticated", "true");
    //   sessionStorage.setItem("username", data.data.username || username);

      // navigate("/");

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      let authUrl;

      if (apiUrl) {
        const baseUrl = apiUrl.replace(/\/+$/, "");
        authUrl = `${baseUrl}/auth.php`;
      } else {
        authUrl = "/auth.php";
      }

      const response = await fetch(authUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
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

      sessionStorage.setItem("authenticated", "true");
      sessionStorage.setItem("username", data.data.username || username);

      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
      setError("Failed to connect to server. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex overflow-hidden relative flex-col justify-center items-center w-full h-screen min-h-screen">
      {/* Dashed Bottom Fade Grid */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #FF5900 1px, transparent 1px),
            linear-gradient(to bottom, #FF5900 1px, transparent 1px)
          `,
          backgroundSize: "10px 10px",
          backgroundPosition: "0 0, 0 0",
          opacity: 0.3,
          maskImage: `
            repeating-linear-gradient(
              to right,
              black 0px,
              black 3px,
              transparent 3px,
              transparent 8px
            ),
            repeating-linear-gradient(
              to bottom,
              black 0px,
              black 3px,
              transparent 3px,
              transparent 8px
            ),
            radial-gradient(ellipse 100% 80% at 50% 100%, #000 50%, transparent 90%)
          `,
          WebkitMaskImage: `
            repeating-linear-gradient(
              to right,
              black 0px,
              black 3px,
              transparent 3px,
              transparent 8px
            ),
            repeating-linear-gradient(
              to bottom,
              black 0px,
              black 3px,
              transparent 3px,
              transparent 8px
            ),
            radial-gradient(ellipse 100% 80% at 50% 100%, #000 50%, transparent 90%)
          `,
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in",
        }}
      />

      {/* Amber-style glow background */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(125% 125% at 50% 90%, #ffffff 40%, #FF5900 100%)
          `,
          backgroundSize: "100% 100%",
        }}
      />

      {/* Main Content Container */}
      <div className="relative z-[2] flex flex-col items-center justify-center w-full px-4">
        <div className="w-full max-w-md p-8 bg-white bg-opacity-95 rounded-2xl border border-neutral-300 ring-1 ring-neutral-300 ring-offset-4 md:ring-offset-8">
          <div className="text-center mb-8">
            <div className="flex justify-center items-center mb-10">
              <Logo />
            </div>

            <p className="text-lg text-gray-600">Admin Login</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-semibold text-gray-700 mb-2 "
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
                className="w-full px-4 py-3 border border-gray-300 rounded-2xl ring-1 ring-neutral-300 ring-offset-2 focus:border-[#FF5900] focus:outline-none text-lg "
                autoFocus
                disabled={loading}
                autoComplete="username"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700 mb-2 "
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
                className="w-full px-4 py-3 border border-gray-300 rounded-2xl ring-1 ring-neutral-300 ring-offset-2 focus:border-[#FF5900] focus:outline-none text-lg "
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <ShinyButton
              onClick={handleSubmit}
              className={`w-full !text-lg !py-2 !px-6 ${loading ? "opacity-50 pointer-events-none" : ""}`}
            >
              {loading ? "Logging in..." : "Login"}
            </ShinyButton>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
