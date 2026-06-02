import { Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from './components/Sidebar';
import { StoryBar } from './components/StoryBar';
import { Overview } from './screens/Overview';
import { FutureMap } from './screens/FutureMap';
import { SankeyTimeline } from './screens/SankeyTimeline';
import { Ranking } from './screens/Ranking';
import { Knockout } from './screens/Knockout';
import { Backcasting } from './screens/Backcasting';
import { Loops } from './screens/Loops';
import { Report } from './screens/Report';
import { Editor } from './screens/Editor';
import { Compare } from './screens/Compare';
import { Sinic } from './screens/Sinic';
import { Decompose } from './screens/Decompose';
import { Roadmap } from './screens/Roadmap';

export default function App() {
  const location = useLocation();
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="app-bg" />
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1400px] px-6 py-7 md:px-10">
          <StoryBar />
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
            >
              <Routes location={location}>
                <Route path="/" element={<Overview />} />
                <Route path="/sinic" element={<Sinic />} />
                <Route path="/roadmap" element={<Roadmap />} />
                <Route path="/map" element={<FutureMap />} />
                <Route path="/editor" element={<Editor />} />
                <Route path="/sankey" element={<SankeyTimeline />} />
                <Route path="/compare" element={<Compare />} />
                <Route path="/ranking" element={<Ranking />} />
                <Route path="/decompose" element={<Decompose />} />
                <Route path="/knockout" element={<Knockout />} />
                <Route path="/backcast" element={<Backcasting />} />
                <Route path="/loops" element={<Loops />} />
                <Route path="/report" element={<Report />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
