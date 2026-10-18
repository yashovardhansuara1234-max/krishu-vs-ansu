/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { View1WishTimer } from './components/View1WishTimer.tsx';
import { View2SplitContrast } from './components/View2SplitContrast.tsx';
import { View3CardsUnravel } from './components/View3CardsUnravel.tsx';
import { View4SoftFinale } from './components/View4SoftFinale.tsx';
import { PetalDriftBackground } from './components/PetalDriftBackground.tsx';
import { soundManager } from './utils/audioPlayer.ts';
import { testFirestoreConnection, seedInitialDatabase } from './firebase.ts';

export default function App() {
  const [currentView, setCurrentView] = useState<1 | 2 | 3 | 4>(1);

  // Initialize and connect to Firestore database permanently
  useEffect(() => {
    testFirestoreConnection().then(() => {
      seedInitialDatabase();
    });
  }, []);

  const goToView = (view: 1 | 2 | 3 | 4) => {
    // When leaving View 3 or 4, properly stop active card tracks
    if (view !== 3 && view !== 4) {
      soundManager.stop();
    }
    setCurrentView(view);
  };

  const handleRestart = () => {
    soundManager.stop();
    setCurrentView(1);
  };

  // Fluid Framer Motion Spring physics: solid immediate opacity, smooth exit
  const pageVariants = {
    initial: { opacity: 1, y: 0 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  const pageTransition = {
    duration: 0.2,
    ease: 'easeInOut' as const,
  };

  return (
    <main className="min-h-screen w-full bg-[#FDFBF7] text-[#18181B] relative flex flex-col justify-between selection:bg-[#FCE7F3] selection:text-[#18181B]">
      {/* Persistent slow-drifting pastel petals across all views */}
      <PetalDriftBackground />

      <AnimatePresence mode="wait" initial={false}>
        {currentView === 1 && (
          <motion.div
            key="view-1"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            className="w-full h-full flex-1"
          >
            <View1WishTimer onNext={() => goToView(2)} />
          </motion.div>
        )}

        {currentView === 2 && (
          <motion.div
            key="view-2"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            className="w-full h-full flex-1"
          >
            <View2SplitContrast
              onBack={() => goToView(1)}
              onNext={() => goToView(3)}
            />
          </motion.div>
        )}

        {currentView === 3 && (
          <motion.div
            key="view-3"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            className="w-full h-full flex-1"
          >
            <View3CardsUnravel
              onBack={() => goToView(2)}
              onNext={() => goToView(4)}
            />
          </motion.div>
        )}

        {currentView === 4 && (
          <motion.div
            key="view-4"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            className="w-full h-full flex-1"
          >
            <View4SoftFinale
              onBack={() => goToView(3)}
              onRestart={handleRestart}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
