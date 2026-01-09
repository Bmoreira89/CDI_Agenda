// Route Segment Configs padrão para páginas que não devem ser cacheadas
export const dynamic = "force-dynamic" as const;          // desabilita SSG/ISR
export const revalidate = 0 as const;                     // sem revalidação
export const fetchCache = "force-no-store" as const;      // sem cache no fetch
