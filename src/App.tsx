import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Workspace } from '@/pages/workspace/Workspace';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Workspace />} path="/" />
        <Route element={<Workspace />} path="/workspace" />
        <Route element={<Navigate replace to="/" />} path="*" />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
