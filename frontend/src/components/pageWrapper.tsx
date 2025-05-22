import { Layout } from "antd";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
const { Content } = Layout;

export default function PageWrapper({ children }: { children: ReactNode }) {
  return (
    <Content>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
        style={{ width: "100%" }}
      >
        {children}
      </motion.div>
    </Content>
  );
}
