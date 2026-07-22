import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Create from './pages/Create';
import Preview from './pages/Preview';
import Dashboard from './pages/Dashboard';
import About from './pages/About';
import './styles/global.css';
import Upgrade from './pages/Upgrade';
import AIChat from './pages/AIChat';
import PreviewConfirm from './pages/PreviewConfirm';
import PackApp from './pages/PackApp';

function App() {
    return (
        <Router>
            <div className="app">
                <Header />
                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/create" element={<Create />} />
                        <Route path="/preview/:id" element={<Preview />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/about" element={<About />} />
						<Route path="/upgrade" element={<Upgrade />} />
						<Route path="/ai-chat" element={<AIChat />} />
						<Route path="/preview-confirm/:projectId" element={<PreviewConfirm />} />
						<Route path="/pack/:projectId" element={<PackApp />} />
                    </Routes>
                </main>
                <Footer />
            </div>
        </Router>
    );
}

export default App;