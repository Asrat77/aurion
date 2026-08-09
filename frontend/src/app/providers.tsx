"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import I18nProvider from "@/i18n/Provider";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 30_000,
            refetchOnWindowFocus: true,
          },
        },
      })
  );

  useEffect(() => {
    const handleUnauthorized = () => {
      client.clear();
      client.setQueryData(["me"], null);
    };
    window.addEventListener("aurion:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("aurion:unauthorized", handleUnauthorized);
  }, [client]);

  return (
    <QueryClientProvider client={client}>
      <I18nProvider>{children}</I18nProvider>
    </QueryClientProvider>
  );
}
