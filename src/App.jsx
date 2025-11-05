import { router } from "./routes/routes";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
    // <Router>
    //   <Routes>
    //     <Route path="/home" element={<Home />} />
    //     <Route path="/instruction" element={<Instruction />} />
    //     <Route path="/capture" element={<Capture />} />
    //     <Route path="/submitorretake" element={<SubmitOrRetake />} />
    //     <Route path="/avatar" element={<Avatar />} />
    //     <Route path="/preview" element={<Preview />} />
    //   </Routes>
    // </Router>
    // <>
    // <Home />
    // <Instruction />
    // <Capture />
    // <SubmitOrRetake />
    // <Avatar />
    // <Preview />
    // </>
  );
}

export default App;
