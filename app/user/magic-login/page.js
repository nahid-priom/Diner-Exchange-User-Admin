export const dynamic = "force-dynamic";
import { Suspense } from "react";
import MagicLoginPage from "./MagicLoginPage";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MagicLoginPage />
    </Suspense>
  );
}
