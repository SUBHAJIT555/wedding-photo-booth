import { createBrowserRouter } from "react-router-dom";
import Home from "../pages/Home";
import Instruction from "../pages/Instraction";
import Capture from "../pages/Capture";
import Avatar from "../pages/Avatar";
import Preview from "../pages/Preview";
import ErrorPage from "../pages/ErrorPage";
import ImageViewer from "../pages/ImageViewer";
import AnimatedOutlet from "../component/AnimatedOutlet";
// import CaptureTest from "../pages/CaptureTest";

export const router = createBrowserRouter([
  {
    element: <AnimatedOutlet />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/instruction",
        element: <Instruction />,
      },
      {
        path: "/capture",
        element: <Capture />,
      },
      {
        path: "/avatar",
        element: <Avatar />,
      },
      // {
      //   path: "/submitorretake",
      //   element: <SubmitOrRetake />,
      // },
      {
        path: "/preview",
        element: <Preview />,
      },
      {
        path: "/i/:id",
        element: <ImageViewer />,
      },
      {
        path: "*",
        element: <ErrorPage />,
      },
    ],
  },
]);
