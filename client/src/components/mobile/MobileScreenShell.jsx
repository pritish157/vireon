import React from 'react';
import { motion } from 'framer-motion';

const MobileScreenShell = ({ eyebrow, title, subtitle, actions, children }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className="md:hidden"
        >
            <section className="mb-5 rounded-[30px] bg-slate-950 px-5 pb-5 pt-5 text-white shadow-[0_22px_70px_rgba(15,23,42,0.22)]">
                {eyebrow && (
                    <p className="text-[11px] font-black uppercase tracking-[0.28em] text-white/40">
                        {eyebrow}
                    </p>
                )}
                <div className="mt-3 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h1 className="text-[30px] font-black leading-none tracking-tight">{title}</h1>
                        {subtitle && (
                            <p className="mt-3 max-w-sm text-sm leading-6 text-white/65">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    {actions ? <div className="shrink-0">{actions}</div> : null}
                </div>
            </section>

            <div className="space-y-4 pb-1">{children}</div>
        </motion.div>
    );
};

export default MobileScreenShell;
