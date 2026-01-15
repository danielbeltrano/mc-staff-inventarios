// App.jsx
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/index";
import SessionManagerWrapper from "./components/SessionManagerWrapper";
import "./index.css";

function App() {
  return (
    <BrowserRouter>
      <SessionManagerWrapper>
        <AppRoutes />
      </SessionManagerWrapper>
    </BrowserRouter>
  );
}

export default App;