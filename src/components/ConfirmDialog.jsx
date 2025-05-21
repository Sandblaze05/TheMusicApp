import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const ConfirmDialog = ({
  onClose,
  onConfirm,
  title = "Are You Sure?",
  message = "This action cannot be undone. Do you want to continue?",
}) => {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 min-h-screen"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative bg-zinc-900 text-zinc-100 rounded-2xl w-full max-h-[90vh] shadow-2xl overflow-hidden flex flex-col"
          style={{ maxWidth: "min(90vw, 480px)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-zinc-800 p-4 md:p-6 flex justify-between items-center border-b border-zinc-700">
            <h2 className="text-xl md:text-2xl font-bold">{title}</h2>
            <motion.button
              className="text-zinc-400 hover:text-zinc-100 p-2 hover:bg-zinc-700 rounded-full"
              onClick={onClose}
              aria-label="Close"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          <div className="p-4 md:p-6 flex-1 overflow-y-auto">
            <motion.p
              className="text-zinc-300 text-base md:text-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              {message}
            </motion.p>
          </div>

          <div className="p-4 md:p-6 bg-zinc-800 border-t border-zinc-700 flex flex-col sm:flex-row gap-3 sm:justify-end">
            <motion.button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-zinc-700 text-zinc-300 hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 17,
              }}
            >
              Cancel
            </motion.button>
            <motion.button
              onClick={onConfirm}
              className="px-4 py-2 rounded-lg sm:bg-zinc-600 text-white sm:hover:bg-red-800 bg-red-800 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-zinc-900"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 17,
              }}
            >
              Confirm
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ConfirmDialog;
