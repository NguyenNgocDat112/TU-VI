import React, { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button when page is scrolled down more than 300px
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          className="fixed bottom-8 right-8 z-[100]"
        >
          <motion.div
            className="relative"
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          >
            <Button
              onClick={scrollToTop}
              size="icon"
              className={cn(
                "w-12 h-12 rounded-full shadow-[0_0_20px_rgba(var(--primary),0.5)] bg-primary text-primary-foreground focus:outline-none transition-colors relative z-10",
                "hover:bg-primary/90"
              )}
            >
              <ChevronUp className="w-6 h-6" />
            </Button>
            {/* Outer animated ring */}
            <div className="absolute inset-0 rounded-full border-2 border-primary/40 animate-ping pointer-events-none" style={{ animationDuration: '3s' }}></div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
