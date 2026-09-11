import React from "react";
import { motion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1];

export default function BrandLoader() {
  return (
    <motion.div
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="flex flex-col items-center gap-6"
    >
      <motion.div
        animate={{ scale: [1, 1.06, 1], opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <img src="/logo.png" alt="Nova MDK" className="h-[58px] w-auto" />
      </motion.div>
      <div className="h-[3px] w-44 overflow-hidden rounded-full bg-line">
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "120%" }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
          className="h-full w-2/3 rounded-full bg-primary"
        />
      </div>
    </motion.div>
  );
}
