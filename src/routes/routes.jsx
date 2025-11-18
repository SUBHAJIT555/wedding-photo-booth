import { createBrowserRouter } from "react-router-dom";
import Home from "../pages/Home";
import Instruction from "../pages/Instraction";
import Capture from "../pages/Capture";
import Avatar from "../pages/Avatar";
import Preview from "../pages/Preview";
import ErrorPage from "../pages/ErrorPage";
import ImageViewer from "../pages/ImageViewer";
import AnimatedOutlet from "../component/AnimatedOutlet";
import ProtectedRoute from "../component/ProtectedRoute";
import Login from "../pages/Login";
// import CaptureTest from "../pages/CaptureTest";

export const router = createBrowserRouter([
  {
    element: <AnimatedOutlet />,
    children: [
      {
        path: "/",
        element: (
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        ),
      },
      {
        path: "/instruction",
        element: (
          <ProtectedRoute>
            <Instruction />
          </ProtectedRoute>
        ),
      },
      {
        path: "/capture",
        element: (
          <ProtectedRoute>
            <Capture />
          </ProtectedRoute>
        ),
      },
      {
        path: "/avatar",
        element: (
          <ProtectedRoute>
            <Avatar />
          </ProtectedRoute>
        ),
      },
      // {
      //   path: "/submitorretake",
      //   element: <SubmitOrRetake />,
      // },
      {
        path: "/preview",
        element: (
          <ProtectedRoute>
            <Preview />
          </ProtectedRoute>
        ),
      },
      {
        path: "/i/:id",
        element: <ImageViewer />, // Public route - no auth needed for viewing shared images
      },
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "*",
        element: <ErrorPage />,
      },
    ],
  },
]);
